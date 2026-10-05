const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const PRESETS_KEY = 'presets';
const HISTORY_KEY = 'presets:history';
const HISTORY_LIMIT = 20;
const MAX_PRESETS_BYTES = 200_000;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

// Shared banner presets: { version, updatedAt, presets }. presets is null until someone first saves.
async function handlePresets(request, env) {
  const current = (await env.PRESETS.get(PRESETS_KEY, 'json')) || { version: 0, updatedAt: null, presets: null };

  if (request.method === 'GET') {
    if (new URL(request.url).searchParams.has('history')) {
      return json((await env.PRESETS.get(HISTORY_KEY, 'json')) || []);
    }
    return json(current);
  }

  if (request.method !== 'PUT') return json({ error: 'Method not allowed' }, 405);

  const raw = await request.text();
  if (raw.length > MAX_PRESETS_BYTES) return json({ error: 'Preset list too large' }, 413);

  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }
  const { baseVersion, presets } = body || {};
  const valid = Array.isArray(presets) && presets.every(p => p && typeof p === 'object' && typeof p.id === 'string' && p.id);
  if (!valid || !presets.some(p => p.id === 'custom')) return json({ error: 'Invalid preset list' }, 400);

  // Reject saves based on a stale copy so concurrent editors don't silently overwrite each other
  if (baseVersion !== current.version) return json({ error: 'conflict', ...current }, 409);

  const next = { version: current.version + 1, updatedAt: new Date().toISOString(), presets };
  if (current.presets) {
    const history = (await env.PRESETS.get(HISTORY_KEY, 'json')) || [];
    await env.PRESETS.put(HISTORY_KEY, JSON.stringify([current, ...history].slice(0, HISTORY_LIMIT)));
  }
  await env.PRESETS.put(PRESETS_KEY, JSON.stringify(next));
  return json(next);
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: { ...CORS_HEADERS, 'Access-Control-Max-Age': '86400' } });
    }

    const { pathname, searchParams } = new URL(request.url);
    if (pathname === '/presets') {
      try {
        return await handlePresets(request, env);
      } catch (err) {
        return json({ error: err.message }, 500);
      }
    }

    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return new Response('Missing url parameter', { status: 400, headers: CORS_HEADERS });
    }

    try {
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': new URL(imageUrl).origin,
        },
      });
      if (!response.ok) {
        return new Response(`Upstream error: ${response.status}`, { status: response.status, headers: CORS_HEADERS });
      }
      const blob = await response.blob();
      return new Response(blob, {
        headers: {
          ...CORS_HEADERS,
          'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    } catch (err) {
      return new Response(`Proxy error: ${err.message}`, { status: 500, headers: CORS_HEADERS });
    }
  },
};
