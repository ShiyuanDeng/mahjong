// A random table ID grants read access. Only the separate device-held key can write.
const UUID = /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/;
const MAX_BYTES = 800000;
const pagesOrigin = 'https://shiyuandeng.github.io';

function json(value, status = 200) {
  return Response.json(value, {status, headers:{'Cache-Control':'no-store'}});
}
async function digest(value) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
}
async function handleTable(request, db, id) {
  if (request.method === 'GET') {
    const row = await db.prepare('SELECT revision, stamp, snapshot FROM score_tables WHERE id = ?').bind(id).first();
    if (!row) return json({error:'Table not found'}, 404);
    if (new URL(request.url).searchParams.get('since') === String(row.revision)) return json({revision:row.revision});
    return json({revision:row.revision, stamp:row.stamp, state:JSON.parse(row.snapshot)});
  }
  if (request.method !== 'PUT') return json({error:'Method not allowed'}, 405);
  const token = (request.headers.get('Authorization') || '').replace(/^Bearer /, '');
  if (!UUID.test(token)) return json({error:'Scorekeeper key required'}, 403);
  if (Number(request.headers.get('Content-Length')) > MAX_BYTES) return json({error:'Table too large'}, 413);
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > MAX_BYTES) return json({error:'Table too large'}, 413);
  let body;
  try { body = JSON.parse(raw); } catch { return json({error:'Invalid JSON'}, 400); }
  if (!body || !UUID.test(body.stamp) || !Number.isSafeInteger(body.revision) || body.revision < 0 ||
      !Array.isArray(body.state?.players) || !body.state?.games?.length || !Array.isArray(body.state.games)) {
    return json({error:'Invalid table'}, 400);
  }
  const key = await digest(token), snapshot = JSON.stringify(body.state);
  const write = body.revision === 0
    ? db.prepare('INSERT INTO score_tables (id, editor_hash, stamp, snapshot) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO NOTHING')
        .bind(id, key, body.stamp, snapshot)
    : db.prepare('UPDATE score_tables SET revision = revision + 1, stamp = ?, snapshot = ? WHERE id = ? AND editor_hash = ? AND revision = ?')
        .bind(body.stamp, snapshot, id, key, body.revision);
  const result = await write.run();
  if (result.meta.changes) return json({revision:body.revision + 1});
  const row = await db.prepare('SELECT revision, stamp, editor_hash FROM score_tables WHERE id = ?').bind(id).first();
  if (!row || row.editor_hash !== key) return json({error:'Scorekeeper key required'}, 403);
  if (row.stamp === body.stamp) return json({revision:row.revision});
  return json({error:'Table has changed'}, 409);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/tables/')) {
      const id = url.pathname.slice('/api/tables/'.length);
      if (!UUID.test(id)) return json({error:'Invalid table link'}, 404);
      const origin = request.headers.get('Origin');
      if (origin && origin !== url.origin && origin !== pagesOrigin) return json({error:'Unknown origin'}, 403);
      const response = request.method === 'OPTIONS' ? new Response(null, {status:204}) : await handleTable(request, env.DB, id);
      if (origin === pagesOrigin) {
        response.headers.set('Access-Control-Allow-Origin', pagesOrigin);
        response.headers.set('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
        response.headers.set('Vary', 'Origin');
      }
      return response;
    }
    const name = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    if (!Object.hasOwn(ASSETS, name)) return new Response('Not found', {status:404});
    return new Response(ASSETS[name], {headers:{
      'Content-Type':name.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/javascript; charset=utf-8',
      'Cache-Control':'no-cache', 'Referrer-Policy':'no-referrer'
    }});
  }
};
