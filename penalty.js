// A penalty is a ledger entry during the current hand. Only a win or draw finishes it.
const PENALTIES = {
  short: {label:'Below minimum fan · 不夠番喊糊', points:8},
  falseWin: {label:'Invalid winning hand · 詐糊', points:16}
};
function penaltyRate(type) {
  const value = state.penalties?.[type];
  return Number.isSafeInteger(value) && value > 0 && value <= 1000000 ? value : PENALTIES[type].points;
}
function penaltySettings() {
  return Object.entries(PENALTIES).map(([id, def]) => `<div class="field"><label for="fine-${id}">${def.label} · Points to each opponent 每家收取分數</label>
    <input type="number" id="fine-${id}" data-fine="${id}" inputmode="numeric" min="1" max="1000000" step="1" required value="${penaltyRate(id)}"></div>`).join('');
}
function savePenaltySetting(input) {
  if (!input.reportValidity()) return;
  state.penalties = {...state.penalties, [input.dataset.fine]:input.valueAsNumber};
  save(); render();
}
function penaltyRules() {
  return `<p>A complete hand below the ${O().minFan}-fan minimum costs ${penaltyRate('short')} points per opponent. Calling a win with an invalid hand costs ${penaltyRate('falseWin')} per opponent.</p>
  <p lang="zh-Hant">牌型成立但不足 ${O().minFan} 番就喊糊，每家收 ${penaltyRate('short')} 分；牌型不成立卻喊糊，算詐糊，每家收 ${penaltyRate('falseWin')} 分。</p>
  <p>A beginner’s first call of either kind is free once per table. The same hand continues. 新手在本桌第一次犯以上任何一項可免罰，兩項合計一次。記錄後繼續本局。</p>`;
}
function penaltyHistory(h) {
  const label = PENALTIES[h.reason]?.label || 'Penalty · 罰分';
  return `<b>${esc(pname(h.offender))}</b><span>${label}</span><span class="fanpill">${h.waived ? 'Beginner waiver · 新手免罰' : Number(h.each) + ' pts each · 每家所得'}</span>`;
}
const penaltyDialog = (() => {
  const dialog = document.getElementById('penalty-dialog');
  const form = dialog.querySelector('form'), submit = form.querySelector('[type=submit]');
  const who = form.querySelector('#penalty-player'), type = form.querySelector('#penalty-type');
  const experience = form.querySelector('#penalty-new');
  let gameId, fromHand = false;

  function entry() {
    const g = game(), pid = who.value, reason = type.value, person = player(pid);
    if (g.id !== gameId || !g.seats.includes(pid) || !person || !Object.hasOwn(PENALTIES,reason)) return null;
    if (reason === 'short' && O().minFan === 0) return null;
    const beginner = person.beginner ?? (experience.value ? experience.value === 'true' : null);
    if (typeof beginner !== 'boolean') return null;
    const first = !state.games.some(game => game.hands.some(h => h.kind === 'penalty' && h.offender === pid));
    const waived = beginner && first, each = waived ? 0 : penaltyRate(reason);
    const deltas = Object.fromEntries(g.seats.map(id => [id, id === pid ? -3 * each : each]));
    return {kind:'penalty', reason, offender:pid, waived, each, deltas, round:tableState(g).round};
  }
  function refresh() {
    if (game().id !== gameId || (fromHand && !sheetOpen)) { dialog.close(); return; }
    const person = player(who.value), unknown = person && typeof person.beginner !== 'boolean';
    $('penalty-experience').hidden = !unknown;
    experience.required = !!unknown;
    const h = entry(), preview = $('penalty-preview');
    submit.disabled = !h || ro() || liveTable.locked;
    if (!h) { preview.textContent = ''; return; }
    const explanation = h.waived
      ? 'First mistaken call at this table. No points change. 本桌首次誤喊，新手免罰。'
      : esc(pname(h.offender)) + ' pays ' + (h.each * 3) + ' points · 共付 ' + (h.each * 3) + ' 分';
    preview.innerHTML = '<p>' + explanation + '</p><div class="deltas">' + game().seats.map(pid =>
      '<span>' + esc(pname(pid)) + ' <b class="amt ' + cls(h.deltas[pid]) + '">' + signed(h.deltas[pid]) + '</b></span>').join('') + '</div>';
  }
  function open(reason) {
    fromHand = reason === 'short' && !!draft && sheetOpen;
    const g = game(); gameId = g.id;
    who.innerHTML = '<option value="">Choose a player · 選擇玩家</option>' + g.seats.map(pid =>
      '<option value="' + esc(pid) + '">' + esc(pname(pid)) + '</option>').join('');
    who.value = fromHand ? draft.winner : '';
    who.disabled = type.disabled = fromHand;
    type.options[0].disabled = O().minFan === 0;
    type.value = O().minFan === 0 ? 'falseWin' : 'short';
    experience.value = ''; dialog.showModal(); refresh();
  }
  who.addEventListener('change', () => { experience.value = ''; });
  form.addEventListener('change', refresh);
  document.getElementById('penalty-cancel').addEventListener('click', () => dialog.close());
  form.addEventListener('submit', event => {
    event.preventDefault();
    const h = entry();
    if (!dialog.open || !h || ro() || liveTable.locked) return;
    const person = player(h.offender);
    if (typeof person.beginner !== 'boolean') person.beginner = experience.value === 'true';
    game().hands.push(h);
    dialog.close();
    if (fromHand) { draft = null; closeHand(); }
    save(); render();
    toast(h.waived ? 'Beginner waiver recorded · 已記錄新手免罰' : 'Penalty recorded · 已記錄罰分', true);
  });
  return {open, refresh};
})();
