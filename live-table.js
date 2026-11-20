// Each room has its own cache. The link contains only the read capability.
const liveTable = (() => {
  const query = new URLSearchParams(location.search);
  const lastKey = 'mahjong-last-owned-table';
  const storage = {
    get(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
    put(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  };
  const host = location.hostname === 'shiyuandeng.github.io'
    ? 'https://mahjong-table-scores.loosebeaver2.chatgpt.site' : location.origin;
  let id = query.has('table') ? query.get('table') : storage.get(lastKey);
  const valid = value => typeof value === 'string' && /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/.test(value);
  let revision = 0, token, pending, writing = false, reading = false, ready = false, online = false;
  let notice = '', storageError = false;
  const key = suffix => 'mahjong-room-' + id + '-' + suffix;
  const url = () => host + '/api/tables/' + id;
  const link = () => {
    const u = new URL(location.href);
    u.search = ''; u.searchParams.set('table', id); u.hash = 'table';
    return u;
  };
  function cache(suffix, value) {
    try { storage.put(key(suffix), value); }
    catch { storageError = true; }
  }
  function restore() {
    if (!id) return null;
    token = storage.get(key('editor'));
    pending = token && storage.get(key('pending'));
    const saved = storage.get(key('cache'));
    revision = saved?.revision || 0;
    return pending?.state || saved?.state || null;
  }
  function install(snapshot) {
    state = fixState(snapshot);
    draft = null; closeHand();
    seatDraft = null; $('seatsheet').hidden = true;
  }
  function redraw() { if (state) refresh(); }
  async function read() {
    if (!id || !valid(id) || reading || writing || pending) return;
    reading = true;
    const before = revision;
    try {
      const result = await fetch(url() + '?since=' + revision, {cache:'no-store', signal:AbortSignal.timeout(10000)});
      if (!result.ok) throw new Error(String(result.status));
      const data = await result.json();
      if (pending || writing || revision !== before) return;
      const changed = !online || !ready || !!data.state;
      if (data.state) {
        install(data.state);
        revision = data.revision; cache('cache', {revision, state});
      }
      online = ready = true;
      if (changed) redraw();
    } catch (err) {
      if (pending || writing || revision !== before) return;
      const msg = err.message === '404' ? 'Table link not found · 找不到這個牌桌' : '';
      const changed = online || notice !== msg;
      online = false; notice = msg;
      if (changed || !ready) redraw();
    } finally { reading = false; }
  }
  async function flushPending() {
    if (!pending || writing) return;
    writing = true;
    try {
      const response = await fetch(url(), {method:'PUT', headers:{Authorization:'Bearer ' + token, 'Content-Type':'application/json'},
        body:JSON.stringify(pending), signal:AbortSignal.timeout(12000)});
      if (response.status === 409 || response.status === 403) {
        // A second scorekeeper tab saved first. Keep the rejected entry for recovery.
        cache('unsent', pending);
        notice = 'Another tab changed the table. Check History before entering your hand again. 另一分頁已更新，請先核對牌局紀錄。';
        if (response.status === 403) { token = null; cache('editor', null); }
        pending = null; cache('pending', null); ready = false; revision = 0;
      } else {
        if (!response.ok) throw new Error(String(response.status));
        const result = await response.json();
        revision = result.revision; online = ready = true; notice = '';
        cache('cache', {revision, state:pending.state}); pending = null; cache('pending', null);
      }
    } catch (err) {
      online = false;
      if (err.message === '413') notice = 'This table is too large to share. · 牌局紀錄超出容量。';
    } finally {
      writing = false; redraw();
      if (!ready && !pending) read();
    }
  }
  function saveChange() {
    pending = {revision, stamp:crypto.randomUUID(), state:JSON.parse(JSON.stringify(state))};
    cache('pending', pending);
    flushPending();
  }
  function start() {
    if (!id) return;
    if (!valid(id)) { notice = 'Invalid table link · 牌桌連結無效'; redraw(); return; }
    if (!query.has('table')) history.replaceState(null, '', link());
    const tick = () => pending ? flushPending() : read();
    tick();
    setInterval(() => { if (!document.hidden) tick(); }, 3000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
    window.addEventListener('online', tick);
  }
  function create() {
    if (id) return;
    id = crypto.randomUUID(); token = crypto.randomUUID();
    try {
      storage.put(key('editor'), token);
      storage.put(lastKey, id);
    } catch {
      id = token = null;
      toast('Allow browser storage to keep your scorekeeper key. · 請允許瀏覽器儲存記分權限。');
      return;
    }
    history.replaceState(null, '', link()); saveChange(); start(); redraw();
  }
  async function copyLink() {
    try { await navigator.clipboard.writeText(link().href); toast('Table link copied · 已複製觀戰連結'); }
    catch { window.prompt('Copy this table link · 請複製牌桌連結', link().href); }
  }
  function status() {
    if (notice) return notice;
    if (storageError) return 'Device storage unavailable · 無法儲存在此裝置';
    if (pending) return online || writing ? 'Saving to the table… · 正在同步…' : 'Saved on this phone. Retrying… · 已儲存在手機，等待同步…';
    if (online) return token ? 'Live · Scorekeeper · 即時記分' : 'Live · Watching · 即時觀戰';
    if (revision) return 'Offline · Last saved scores · 離線，顯示上次分數';
    return 'Waiting for shared scores… · 等待牌桌資料…';
  }
  return {
    get active() { return id !== null && id !== undefined; },
    get viewer() { return !!id && !token; },
    get locked() { return this.active && (!token || !ready || !!pending); },
    get available() { return revision > 0 || !!pending; },
    get shareable() { return revision > 0; },
    get online() { return online; },
    restore, start, create, copyLink, saveChange, status
  };
})();
