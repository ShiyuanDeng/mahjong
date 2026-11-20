// The viewpoint belongs to this browser and table. Scores and seat winds belong to the game.
const mySeat = (() => {
  let profile, room, sending = false, optionsKey = '';
  const dialog = () => $('arrival');
  function remember(value) {
    profile = value; room = liveTable.roomId;
    try { localStorage.setItem('mahjong-chair-' + room, JSON.stringify(value)); } catch {}
  }
  function load() {
    if (room === liveTable.roomId) return;
    room = liveTable.roomId;
    try { profile = JSON.parse(localStorage.getItem('mahjong-chair-' + room)); } catch { profile = null; }
  }
  function bottom() {
    load();
    const seats = game().seats;
    return profile && seats.includes(profile.pid) ? seats.indexOf(profile.pid) : 0;
  }
  function ensure() {
    load();
    if (liveTable.active && !liveTable.available || sync.mode === 'connecting') return;
    if (!profile || dialog().open) show();
  }
  function show() {
    const el = dialog(), form = el.querySelector('form'), opening = !el.open;
    const seats = game().seats, ts = tableState(game());
    if (opening) {
      form.elements.name.value = profile?.name || '';
      $('join-error').textContent = '';
      optionsKey = '';
    }
    const wind = i => R().winds[(i - ts.dealer + 4) % 4];
    const options = seats.map((id,i) => {
      const p = player(id), w = wind(i);
      return `<option value="${esc(id)}">${w.en} ${w.zh} · ${p.openSeat ? 'Open seat 空位' : esc(p.name)}</option>`;
    }).join('');
    if (options !== optionsKey) {
      const previous = !opening && form.elements.seat.value;
      form.elements.seat.innerHTML = options + '<option value="watch">Watch the table · 觀戰</option>';
      form.elements.seat.value = previous && (previous === 'watch' || seats.includes(previous)) ? previous :
        profile?.pid && seats.includes(profile.pid) ? profile.pid : seats.find(id => player(id).openSeat) || 'watch';
      optionsKey = options;
    }
    el.querySelector('.arrival-close').hidden = !profile;
    if (opening) el.showModal();
  }
  async function join(e) {
    e.preventDefault();
    if (sending) return;
    const form = e.target, name = form.elements.name.value.trim(), choice = form.elements.seat.value;
    const err = $('join-error');
    if (!name) { err.textContent = 'Enter your name · 請輸入名字'; form.elements.name.focus(); return; }
    let pid = choice === 'watch' ? null : choice;
    const selected = player(pid);
    if (pid && (!selected || !game().seats.includes(pid))) { err.textContent = 'Seats changed. Choose again. · 座位已變更，請重新選擇。'; show(); return; }
    if (pid && !selected.openSeat && selected.name.toLocaleLowerCase() !== name.toLocaleLowerCase()) {
      err.textContent = 'Choose your named seat, an open seat, or Watch. · 請選自己的座位、空位或觀戰。';
      return;
    }
    if (pid && selected.openSeat && liveTable.active && !liveTable.online) {
      err.textContent = 'Reconnect to take an open seat. · 請連線後入座。'; return;
    }
    sending = true;
    form.querySelector('[type=submit]').disabled = true;
    try {
      if (pid && selected.openSeat) {
        if (liveTable.active) {
          await liveTable.claimSeat(pid, name);
        } else if (!ro()) {
          selected.name = name; selected.openSeat = false; state.example = false; save();
        }
      }
      remember({name, pid}); dialog().close(); render();
    } catch (error) {
      err.textContent = error.message === '409' ? 'That seat was taken. Choose another. · 已有人入座，請另選。' : 'Could not join. Try again. · 暫時無法入座，請再試。';
    } finally { sending = false; form.querySelector('[type=submit]').disabled = false; }
  }
  return {ensure, show, bottom, join, remember, get profile(){ load(); return profile; }};
})();

function commandTile(glyph, en, zh, target, options = {}) {
  const label = en + ' · ' + zh;
  const inside = `<i aria-hidden="true">${glyph}</i><b>${en}</b><small lang="zh-Hant">${zh}</small>`;
  const attrs = `class="command-tile ${options.tone || ''}" aria-label="${label}"`;
  return target.startsWith('#') ? `<a ${attrs} href="${target}">${inside}</a>` :
    `<button ${attrs} data-a="${target}" ${options.disabled ? 'disabled' : ''}>${inside}</button>`;
}
function actionRack() {
  const actions = [
    ro() ? '' : commandTile('局','New game','新牌局','openSeats',{tone:'ruby'}),
    commandTile('榜','Leaders','排行榜','#leaderboard',{tone:'jade'}),
    commandTile('記','History','牌局紀錄','#history'),
    commandTile('番','Rules','玩法','#rules',{tone:'ruby'}),
    commandTile('設','Setup','設定','#setup',{tone:'jade'}),
    liveTable.shareable ? commandTile('享','Copy link','複製連結','copyTableLink') :
      !liveTable.active && !sync.hosted ? commandTile('享','Share','共享牌桌','createLiveTable') : ''
  ];
  return `<nav class="hand-rack" aria-label="Table actions · 桌面操作"><div class="rack-tiles">
    <span class="rack-bookend" aria-hidden="true">${['1m','2m','3m'].map(mahjongTileFace).join('')}</span>
    ${actions.join('')}
    <span class="rack-bookend" aria-hidden="true">${['1p','2p','3p'].map(mahjongTileFace).join('')}</span>
    </div><div class="rack-ledge" aria-hidden="true"></div></nav>`;
}
