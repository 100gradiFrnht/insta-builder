import { CORS_HEADERS, json } from './http.js';

const PRESETS_KEY = 'presets';
const HISTORY_KEY = 'presets:history';
const HISTORY_LIMIT = 20;
const MAX_PRESETS_BYTES = 200_000;

// Shared banner presets: { version, updatedAt, presets }. presets is null until someone first saves.
export async function handlePresets(request, env) {
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

