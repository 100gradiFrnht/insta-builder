import { CORS_HEADERS, json } from './http.js';

const BUFFER_API = 'https://api.buffer.com';
const MEDIA_TTL = 60 * 60 * 24 * 30; // images must outlive the latest scheduled post
const MEDIA_MAX_BYTES = 10 * 1024 * 1024;
const MEDIA_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const SEND_RECORD_TTL = 60 * 60 * 24 * 7;
const MAX_SCHEDULE_DAYS = 28; // Buffer fetches images at publish time, so posts must go out before they expire
const SERVICES = ['twitter', 'bluesky', 'instagram'];

const sha256 = async (text) => crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));

// Posting is password-protected (unlike preset editing); fails closed if the secret isn't set
async function isAuthorized(request, env) {
  const given = request.headers.get('X-Post-Password');
  if (!env.POST_PASSWORD || !given) return false;
  const [a, b] = await Promise.all([sha256(given), sha256(env.POST_PASSWORD)]);
  return crypto.subtle.timingSafeEqual(a, b);
}

async function bufferQuery(env, query, variables) {
  const res = await fetch(BUFFER_API, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.BUFFER_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.errors?.length) {
    throw new Error(body.errors?.map(e => e.message).join('; ') || `Buffer API HTTP ${res.status}`);
  }
  return body.data;
}

// Maps service → channel id for connected channels
async function getChannels(env) {
  const { account } = await bufferQuery(env, 'query { account { organizations { id } } }');
  const channels = {};
  for (const org of account.organizations) {
    const data = await bufferQuery(
      env,
      'query($org: OrganizationId!) { channels(input: { organizationId: $org }) { id service isDisconnected } }',
      { org: org.id },
    );
    for (const c of data.channels) {
      if (!c.isDisconnected && SERVICES.includes(c.service) && !channels[c.service]) channels[c.service] = c.id;
    }
  }
  return channels;
}

const CREATE_POST = `mutation($input: CreatePostInput!) {
  createPost(input: $input) {
    __typename
    ... on PostActionSuccess { post { id status dueAt } }
    ... on MutationError { message }
  }
}`;

const imageAssets = (urls) => urls.map(url => ({ image: { url } }));

function buildPostInput(service, channelId, payload) {
  const base = {
    channelId,
    schedulingType: 'automatic',
    mode: payload.dueAt ? 'customScheduled' : 'shareNow',
    needsApproval: false,
    ...(payload.dueAt && { dueAt: payload.dueAt }),
  };
  if (service === 'instagram') {
    const { caption, images } = payload.instagram;
    return {
      ...base,
      text: caption,
      assets: imageAssets(images),
      // Buffer has no 'carousel' type for Instagram: a post with several images becomes a carousel
      metadata: { instagram: { type: 'post', shouldShareToFeed: true } },
    };
  }
  // X and Bluesky: every post, including the first, goes in the thread; the top level mirrors the first post
  const thread = payload.thread.map(p => ({ text: p.text, assets: imageAssets(p.images) }));
  return { ...base, text: thread[0].text, assets: thread[0].assets, metadata: { [service]: { thread } } };
}

function validateSend(body) {
  if (!/^[\w-]{8,64}$/.test(body?.sendId || '')) return 'Missing or invalid sendId';
  if (!Array.isArray(body.services) || !body.services.length || body.services.some(s => !SERVICES.includes(s))) return 'Invalid services';
  const isUrlList = (list) => Array.isArray(list) && list.every(u => typeof u === 'string' && u.startsWith('https://'));
  if (body.services.some(s => s !== 'instagram')) {
    if (!Array.isArray(body.thread) || !body.thread.length) return 'Missing thread';
    if (body.thread.some(p => typeof p.text !== 'string' || !isUrlList(p.images) || p.images.length > 4)) return 'Invalid thread post';
  }
  if (body.services.includes('instagram')) {
    const ig = body.instagram;
    if (!ig || typeof ig.caption !== 'string' || !isUrlList(ig.images) || !ig.images.length || ig.images.length > 20) return 'Invalid Instagram post';
  }
  if (body.dueAt != null && !(Date.parse(body.dueAt) > Date.now())) return 'Scheduled time must be in the future';
  if (body.dueAt != null && Date.parse(body.dueAt) > Date.now() + MAX_SCHEDULE_DAYS * 86400e3) return `Posts can be scheduled at most ${MAX_SCHEDULE_DAYS} days ahead`;
  return null;
}

// Creates one post per requested service. A service that already succeeded for this sendId is not posted again,
// so retrying after a partial failure only resends what failed.
async function send(request, env) {
  const body = await request.json().catch(() => null);
  const invalid = validateSend(body);
  if (invalid) return json({ error: invalid }, 400);

  const channels = await getChannels(env);
  const results = {};
  await Promise.all(body.services.map(async (service) => {
    const recordKey = `send:${body.sendId}:${service}`;
    const previous = await env.MEDIA.get(recordKey, 'json');
    if (previous) {
      results[service] = { ...previous, duplicate: true };
      return;
    }
    if (!channels[service]) {
      results[service] = { ok: false, error: `No connected ${service} channel in Buffer` };
      return;
    }
    try {
      const data = await bufferQuery(env, CREATE_POST, { input: buildPostInput(service, channels[service], body) });
      const r = data.createPost;
      if (r.__typename !== 'PostActionSuccess') {
        results[service] = { ok: false, error: r.message || r.__typename };
        return;
      }
      results[service] = { ok: true, postId: r.post.id, status: r.post.status, dueAt: r.post.dueAt };
      await env.MEDIA.put(recordKey, JSON.stringify(results[service]), { expirationTtl: SEND_RECORD_TTL });
    } catch (err) {
      results[service] = { ok: false, error: err.message };
    }
  }));
  return json({ results });
}

async function status(request, env) {
  const ids = (new URL(request.url).searchParams.get('ids') || '').split(',').filter(Boolean).slice(0, 10);
  const posts = await Promise.all(ids.map(async (id) => {
    try {
      const { post } = await bufferQuery(
        env,
        'query($id: PostId!) { post(input: { id: $id }) { id status sentAt externalLink error { message } } }',
        { id },
      );
      return { id, status: post.status, sentAt: post.sentAt, link: post.externalLink, error: post.error?.message || null };
    } catch (err) {
      return { id, status: 'unknown', error: err.message };
    }
  }));
  return json({ posts });
}

export async function handleBuffer(request, env) {
  if (!(await isAuthorized(request, env))) return json({ error: 'Wrong or missing posting password' }, 401);
  const { pathname } = new URL(request.url);
  if (pathname === '/buffer/check' && request.method === 'GET') return json({ ok: true });
  if (pathname === '/buffer/send' && request.method === 'POST') return send(request, env);
  if (pathname === '/buffer/status' && request.method === 'GET') return status(request, env);
  return json({ error: 'Not found' }, 404);
}

// POST /media uploads an image (password required); GET /media/<id>.<ext> serves it publicly, since Buffer
// only accepts public image URLs
export async function handleMedia(request, env) {
  const url = new URL(request.url);

  // HEAD matters: Buffer checks that an image is reachable with a HEAD request before publishing
  if (request.method === 'GET' || request.method === 'HEAD') {
    const id = url.pathname.match(/^\/media\/([0-9a-f-]{36})\.\w+$/)?.[1];
    const stored = id && (await env.MEDIA.getWithMetadata(`img:${id}`, 'arrayBuffer'));
    if (!stored?.value) return new Response(null, { status: 404, headers: CORS_HEADERS });
    const headers = {
      ...CORS_HEADERS,
      'Content-Type': stored.metadata?.type || 'image/jpeg',
      'Content-Length': String(stored.value.byteLength),
      'Cache-Control': 'public, max-age=2592000, immutable',
    };
    return new Response(request.method === 'HEAD' ? null : stored.value, { headers });
  }

  if (request.method !== 'POST' || url.pathname !== '/media') return json({ error: 'Not found' }, 404);
  if (!(await isAuthorized(request, env))) return json({ error: 'Wrong or missing posting password' }, 401);
  const type = (request.headers.get('Content-Type') || '').split(';')[0];
  if (!MEDIA_TYPES[type]) return json({ error: 'Only JPEG, PNG and WebP images are accepted' }, 415);
  const data = await request.arrayBuffer();
  if (!data.byteLength || data.byteLength > MEDIA_MAX_BYTES) return json({ error: 'Image is empty or larger than 10 MB' }, 413);

  const id = crypto.randomUUID();
  await env.MEDIA.put(`img:${id}`, data, { expirationTtl: MEDIA_TTL, metadata: { type } });
  return json({ url: `${url.origin}/media/${id}.${MEDIA_TYPES[type]}` });
}
