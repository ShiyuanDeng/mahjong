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
    if (!profile || (profile.pid && typeof profile.beginner !== 'boolean') || dialog().open) show();
  }
  function show() {
    const el = dialog(), form = el.querySelector('form'), opening = !el.open;
    const seats = game().seats, ts = tableState(game());
    if (opening) {
      form.elements.name.value = profile?.name || '';
      form.elements.experience.value = typeof profile?.beginner === 'boolean' ? String(profile.beginner) : '';
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
    experienceField();
    el.querySelector('.arrival-close').hidden = !profile || !!profile.pid && typeof profile.beginner !== 'boolean';
    if (opening) el.showModal();
  }
  function experienceField() {
    const playing = $('arrival-seat').value !== 'watch';
    $('arrival-experience').required = playing;
    $('join-experience').hidden = !playing;
  }
  async function join(e) {
    e.preventDefault();
    if (sending) return;
    const form = e.target, name = form.elements.name.value.trim(), choice = form.elements.seat.value;
    const err = $('join-error');
    if (!name) { err.textContent = 'Enter your name · 請輸入名字'; form.elements.name.focus(); return; }
    let pid = choice === 'watch' ? null : choice;
    const selected = player(pid), experience = form.elements.experience.value;
    if (pid && !['true','false'].includes(experience)) { form.elements.experience.focus(); return; }
    const beginner = pid ? experience === 'true' : undefined;
    if (pid && (!selected || !game().seats.includes(pid))) { err.textContent = 'Seats changed. Choose again. · 座位已變更，請重新選擇。'; show(); return; }
    if (pid && !selected.openSeat && selected.name.toLocaleLowerCase() !== name.toLocaleLowerCase()) {
      err.textContent = 'Choose your named seat, an open seat, or Watch. · 請選自己的座位、空位或觀戰。';
      return;
    }
    if (pid && (selected.openSeat || selected.beginner !== beginner) && liveTable.active && !liveTable.online) {
      err.textContent = 'Reconnect to take an open seat. · 請連線後入座。'; return;
    }
    sending = true;
    form.querySelector('[type=submit]').disabled = true;
    try {
      if (pid && (selected.openSeat || selected.beginner !== beginner)) {
        if (liveTable.active) {
          await liveTable.claimSeat(pid, name, beginner);
        } else if (!ro()) {
          selected.name = name; selected.openSeat = false; selected.beginner = beginner; state.example = false; save();
        }
      }
      remember({name, pid, beginner}); dialog().close(); render();
    } catch (error) {
      err.textContent = error.message === '409' ? 'That seat was taken. Choose another. · 已有人入座，請另選。' : 'Could not join. Try again. · 暫時無法入座，請再試。';
    } finally { sending = false; form.querySelector('[type=submit]').disabled = false; }
  }
  return {ensure, show, bottom, join, remember, experienceField, get profile(){ load(); return profile; }};
})();

// Cast the two named people first. The other chairs keep their original character
// when players swap seats or the dealer rotates.
function seatedCharacters(seats) {
  const cast = new Map(), available = new Set([0, 1, 2, 3]);
  function assign(pid, role) {
    if (!cast.has(pid) && available.delete(role)) cast.set(pid, role);
  }
  for (const pid of seats) {
    const name = pname(pid).trim().toLowerCase();
    if (name === 'sean') assign(pid, 0);
    if (name === 'fleece' || name === 'fleece johnson') assign(pid, 1);
  }
  for (const pid of seats) assign(pid, ['p1','p2','p3','p4'].indexOf(pid));
  for (const pid of seats) if (!cast.has(pid)) assign(pid, available.values().next().value);
  return seats.map(pid => cast.get(pid));
}

// Each endpoint is on the felt, a little inside its wooden rail. Coordinates
// are thousandths of the original photograph, ordered from farthest to nearest.
const sideRackLines = {
  wide: {
    east:  {far:[259,705,555], near:[107,853,745]},
    south: {far:[325,670,410], near:[237,755,650]},
    west:  {far:[305,682,480], near:[190,803,700]},
    north: {far:[334,684,530], near:[214,800,750]}
  },
  phone: {
    east:  {far:[172,825,320], near:[33,966,430]},
    south: {far:[275,698,325], near:[109,871,473]},
    west:  {far:[207,790,355], near:[52,948,483]},
    north: {far:[284,721,315], near:[61,936,481]}
  }
};

function sideRack(layout, camera, right, mirrored) {
  const {far, near} = sideRackLines[layout][camera];
  const column = right !== mirrored ? 1 : 0;
  const x = point => mirrored ? 1000 - point[column] : point[column];
  const startX = x(far), startY = far[2], dx = (x(near) - startX) / 13, dy = (near[2] - startY) / 13;
  // A back face stands vertically. Only the row's baseline recedes along the rail.
  const height = layout === 'wide' ? 29 : 17, depth = right ? 6 : -6;
  const id = 'side-tile-' + layout + (right ? '-right' : '-left');
  const tile = `<g id="${id}" stroke="#344b39" stroke-width=".7" stroke-linejoin="round">
    <path fill="url(#tile-back-${layout})" d="M0,0 l${dx},${dy} v${-height} l${-dx},${-dy} Z"/>
    <path fill="#e0d8b5" d="M0,${-height} l${dx},${dy} l${depth},-2 l${-dx},${-dy} Z"/>
    <path fill="#43644a" d="M${dx},${dy} l${depth},-2 v${-height} l${-depth},2 Z"/>
  </g>`;
  const tiles = Array.from({length:13}, (_, i) => {
    const distance = .80 * i + .20 * i * i / 13;
    const scale = .80 + .20 * (2 * i + 1) / 13;
    return `<use href="#${id}" transform="translate(${startX + dx * distance} ${startY + dy * distance}) scale(${scale})"/>`;
  });
  return `<defs>${tile}</defs><g class="tile-row">${tiles.join('')}</g>`;
}

function tableScene(seats, bottom) {
  const cast = seatedCharacters(seats);
  const cameras = ['east','south','west','north'];
  // A plate shot from camera c shows cast (c + offset) % 4 at this position.
  const cameraAt = offset => cameras[(cast[(bottom + offset) % 4] - offset + 4) % 4];
  const centre = cameraAt(2), left = cameraAt(3), right = cameraAt(1);
  const centreIndex = cameras.indexOf(centre);
  const reverseLeft = cameras[(centreIndex + 2) % 4] === left;
  const reverseRight = cameras[(centreIndex + 2) % 4] === right;
  const reverse = Number(reverseLeft) + Number(reverseRight) >
    Number(left === centre) + Number(right === centre);

  function plate(camera, side, mirrored = false) {
    return `<picture class="scene-plate ${side}">
      <source media="(orientation: portrait)" srcset="scene-${camera}-phone.webp">
      <img src="scene-${camera}.webp" alt="" draggable="false"${mirrored ? ' class="mirrored"' : ''}></picture>`;
  }
  // Normal and reversed seating each use a single photograph. Other permutations
  // replace the one side that changed, keeping every face beside its actual name.
  const layers = [plate(centre, 'scene-base', reverse)];
  const replaceLeft = reverse ? !reverseLeft : left !== centre;
  const replaceRight = reverse ? !reverseRight : right !== centre;
  if (replaceLeft) layers.push(plate(left, 'scene-left'));
  if (replaceRight) layers.push(plate(right, 'scene-right'));
  for (const layout of ['wide', 'phone']) {
    layers.push(`<svg class="side-racks racks-${layout}" viewBox="0 0 1000 1000" preserveAspectRatio="none" focusable="false">
      <defs><linearGradient id="tile-back-${layout}" x2="0" y2="1">
        <stop stop-color="#8da488"/><stop offset=".16" stop-color="#497553"/><stop offset=".9" stop-color="#325941"/><stop offset=".94" stop-color="#dbd4b4"/>
      </linearGradient></defs>
      ${sideRack(layout, replaceLeft ? left : centre, false, !replaceLeft && reverse)}
      ${sideRack(layout, replaceRight ? right : centre, true, !replaceRight && reverse)}
    </svg>`);
  }
  return `<div class="table-photo" data-camera-seat="${centre}" aria-hidden="true">${layers.join('')}</div>`;
}

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
    liveTable.active || !sync.hosted ? commandTile('聊','Chat','聊天室','openChat',{tone:'jade'}) : '',
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
