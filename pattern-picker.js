// Each tile uses the same compact notation as the rule guide (m, p, s = characters, dots, bamboo).
// Rack artwork is decorative; the adjoining bilingual text describes the scoring feature.
const MJ_GLYPHS = {
  m: ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'],
  E: '東', S: '南', W: '西', N: '北', C: '中', F: '發',
  flower: ['梅', '蘭', '菊', '竹'], season: ['春', '夏', '秋', '冬']
};
const MJ_MARKS = [
  [],
  [[50,50]],
  [[50,29],[50,71]],
  [[25,22],[50,50],[75,78]],
  [[28,27],[72,27],[28,73],[72,73]],
  [[25,24],[75,24],[50,50],[25,76],[75,76]],
  [[28,20],[72,20],[28,50],[72,50],[28,80],[72,80]],
  [[21,14],[50,26],[79,38],[28,58],[72,58],[28,84],[72,84]],
  [[29,15],[71,15],[29,38],[71,38],[29,62],[71,62],[29,85],[71,85]],
  [[21,21],[50,21],[79,21],[21,50],[50,50],[79,50],[21,79],[50,79],[79,79]]
];
function mahjongTileFace(code){
  const tile = (kind, face) => '<span class="mj-face mj-' + kind + '" aria-hidden="true">' + face + '</span>';
  if (code === 'back') return tile('back', '');
  if (code === 'P') return tile('white', '<i></i>');
  if (/^[ESWNCF]$/.test(code)) return tile('honour mj-' + code, '<b>' + MJ_GLYPHS[code] + '</b>');
  const rank = Number(code[0]), suit = code[1];
  if (/^[1-4][ft]$/.test(code)) {
    const flower = suit === 'f';
    return tile(flower ? 'flower' : 'season', '<small>' + rank + '</small><i class="mj-bloom"></i><b>' + MJ_GLYPHS[flower ? 'flower' : 'season'][rank - 1] + '</b>');
  }
  if (!/^[1-9][mps]$/.test(code)) return '';
  if (suit === 'm') return tile('character', '<small>' + rank + '</small><b>' + MJ_GLYPHS.m[rank] + '</b><i>萬</i>');
  if (suit === 's' && rank === 1) return tile('sparrow','<small>1</small><i class="mj-bird"><i></i></i>');
  let marks = '';
  MJ_MARKS[rank].forEach(([x,y], i) => {
    let ink = suit === 'p' ? 'blue' : 'green';
    if (suit === 'p') {
      if (rank === 1 || rank === 3 && i === 1 || rank === 5 && i === 2 || rank >= 6 && i < 3) ink = 'red';
      else if (rank === 2 && i === 0 || rank === 3 && i === 0 || rank === 9 && i > 5) ink = 'green';
    } else if (rank === 5 && i === 2 || rank === 7 && i < 3 || rank === 9 && i % 3 === 1) ink = 'red';
    marks += '<i class="mj-mark mj-ink-' + ink + '" style="--x:' + x + '%;--y:' + y + '%"></i>';
  });
  return tile((suit === 'p' ? 'dots' : 'bamboo') + ' mj-rank-' + rank, '<span class="mj-marks">' + marks + '</span>');
}

const PICKER_GROUPS = [
  {id:'shape', en:'Shapes', zh:'牌型'},
  {id:'honour', en:'Honours', zh:'字牌'},
  {id:'flower', en:'Flowers', zh:'花牌'},
  {id:'win', en:'Win bonuses', zh:'和法'},
  {id:'limit', en:'Limit hands', zh:'爆棚'}
];

// Compact examples highlight the distinguishing tile or event. The rule button opens the full hand.
const PATTERN_ART = {
  menqing: ['~~~', 'No exposed sets', '全手未吃碰明槓'],
  qianggang: ['CCC C', 'Claim the added tile', '和別人加槓的牌'],
  gangshang: ['2222s 5p', 'Win on the replacement', '槓後補牌和牌'],
  haidi: ['~ 6s', 'Draw the last tile', '摸到牌牆最後一張'],
  huashang: ['1f 4m', 'Win after a flower', '補花後和牌'],
  pinghu: ['123m 456s', 'Four runs and a pair', '四順一對'],
  duidui: ['333p 777s', 'Four triplets or kongs and a pair', '四組刻子或槓加一對'],
  hunyise: ['234s FF', 'One suit with honours', '一種花色加字牌'],
  qingyise: ['123p 999p', 'One suit throughout', '全手同一花色'],
  hunyaojiu: ['111m 99s E', 'Only terminals and honours', '只用一、九和字牌'],
  dragon: ['CCC', 'Three matching dragons', '同種三元牌成刻或槓'],
  xiaosanyuan: ['CCC FFF PP', 'Two dragon sets and a dragon pair', '兩種三元牌成刻，第三種作將'],
  dasanyuan: ['CCC FFF PPP', 'All three dragon sets', '中、發、白各成刻或槓'],
  xiaosixi: ['EEE SSS WWW NN', 'Three wind sets and a wind pair', '三種風牌成刻，第四種作將'],
  wuhua: ['∅', 'No flowers or seasons', '沒有花牌或季節牌'],
  yitaihua: ['1f 2f 3f 4f', 'All four flowers or all four seasons', '集齊四花或四季'],
  qihua: ['1f 2f 3f 4f 1t 2t 3t', 'Win on your seventh flower', '摸到第七張花牌即和'],
  shisanyao: ['19m 19p 19s', 'Every terminal and honour, one repeated', '一九字牌各一張，再重複一張'],
  jiulian: ['111m 2345678m 999m', 'Concealed base plus one of the same suit', '同色門清，再加一張同色牌'],
  kankan: ['555s ~~~', 'Four concealed triplets and a pair', '四組暗刻加一對'],
  dasixi: ['EEE SSS WWW NNN', 'All four wind sets', '四種風牌各成刻或槓'],
  ziyise: ['SSS FFF', 'Every tile is a wind or dragon', '全手只有風牌和三元牌'],
  qingyaojiu: ['111p 999m', 'Only ones and nines', '全手只用一、九'],
  shiba: ['4444s 7777p', 'Four kongs and a pair', '四組槓加一對'],
  gangshanggang: ['2222s 4444p 6m', 'Win after two consecutive kongs', '連開兩槓後補牌和牌'],
  tianhu: ['~ ~ ~ 1s', 'Dealer wins on the opening deal', '莊家起手十四張即和'],
  dihu: ['~ ~ E', 'Win on the dealer’s first discard', '和莊家打出的第一張牌'],
  bahua: ['1f 2f 3f 4f 1t 2t 3t 4t', 'All eight flowers and seasons', '集齊四花四季']
};

function patternArt(p, d){
  const g = game(), table = tableState(g);
  const seat = (g.seats.indexOf(d.winner) - table.dealer + 4) % 4;
  const winds = 'ESWN', wind = R().winds[seat];
  if (p.id === 'seatwind') return [winds[seat].repeat(3), 'Your seat wind · ' + wind.en, '座風為' + wind.zh];
  if (p.id === 'roundwind') {
    const round = R().winds[table.round];
    return [winds[table.round].repeat(3), 'Round wind · ' + round.en, '本圈圈風為' + round.zh];
  }
  if (p.id === 'zhenghua') return [(seat + 1) + 'f ' + (seat + 1) + 't', 'Seat ' + (seat + 1) + ' · count each match', wind.zh + '家，每張對應花牌各計一番'];
  return PATTERN_ART[p.id] || [p.ex || '~', p.en, p.zh];
}

function illustratedRack(example){
  if (example === '∅') return '<span class="mj-empty" aria-hidden="true">' + mahjongTileFace('1f') + '</span>';
  return example.split(' ').map(token => {
    const suited = token.match(/^(\d+)([mpstf])$/);
    const codes = suited ? [...suited[1]].map(n => n + suited[2]) : [...token].map(c => c === '~' ? 'back' : c);
    return '<span class="mj-set">' + codes.map(mahjongTileFace).join('') + '</span>';
  }).join('');
}

function patternCard(p, d){
  const n = d.picks[p.id] || 0, ok = allowed(p, d), counter = p.max > 1;
  const [example, en, zh] = patternArt(p, d), name = esc(p.en) + ' ' + esc(p.zh);
  const constraint = !ok && (p.id === 'tianhu' ? 'Dealer self-draw only · 僅限莊家自摸' :
    p.id === 'dihu' ? 'Dealer’s first discard only · 僅限莊家首張棄牌' :
    p.needs === 'self' ? 'Self-draw only · 限自摸' : 'Discard only · 限放銃');
  const art = '<span class="pc-art" aria-hidden="true">' + illustratedRack(example) + '</span>';
  const label = '<span class="pc-names"><strong>' + esc(p.en) + '</strong><span lang="zh-Hant">' + esc(p.zh) + '</span></span>';
  const explain = '<span class="pc-caption">' + esc(en) + '<span lang="zh-Hant">' + esc(zh) + '</span></span>';
  const main = art + label + explain + (constraint ? '<span class="pc-restrict">' + constraint + '</span>' : '');
  const attributes = counter ? 'data-a="inc" aria-label="Add ' + name + ' 加一"' : 'data-a="pick" aria-pressed="' + !!n + '"';
  const li = '<button class="pc-main pat-main" ' + attributes + ' data-id="' + p.id + '" ' +
    (!ok || (counter && n >= p.max) ? 'disabled' : '') + '>' + main + '</button>';
  const step = counter ? '<span class="pc-step"><button data-a="dec" data-id="' + p.id + '" aria-label="One fewer ' + name + ' 減一" ' + (n ? '' : 'disabled') + '>−</button><output aria-label="' + name + ' count 數量">' + n + '</output><button data-a="inc" data-id="' + p.id + '" aria-label="One more ' + name + ' 加一" ' + (ok && n < p.max ? '' : 'disabled') + '>+</button></span>' : '';
  return '<article class="pc-card' + (n ? ' is-picked' : '') + (!ok ? ' unavailable' : '') + '">' + li +
    '<div class="pc-tools"><span class="pc-fan">' + fanLabel(p.fan) + '</span>' + step + '<button class="pc-info" data-a="info" data-id="' + p.id + '" aria-label="Explain ' + name + ' 查看說明">i</button></div></article>';
}

function patternPickerHTML(r, d){
  const group = d.pickerGroup || 'shape';
  const tabs = [...PICKER_GROUPS, {id:'adjust', en:'Adjust', zh:'加減'}];
  const filters = tabs.map(g => {
    const count = g.id === 'adjust' ? d.adj : r.patterns.filter(p => p.group === g.id).reduce((sum,p) => sum + (d.picks[p.id] || 0), 0);
    return `<button data-a="pickerGroup" data-id="${g.id}" aria-pressed="${g.id === group}">${g.en} <span lang="zh-Hant">${g.zh}</span>${count ? ` <b class="pick-count">${count}</b>` : ''}</button>`;
  }).join('');
  const field = group === 'adjust'
    ? `<div class="adj"><span><b>House adjustment 自訂加減番</b><br>Adjust by table agreement. 依本桌約定加減番。</span>
          <span class="step"><button data-a="adj" data-n="-1" aria-label="One fan less 減一番" ${d.adj <= -9 ? 'disabled' : ''}>−</button><output>${signed(d.adj)}</output><button data-a="adj" data-n="1" aria-label="One fan more 加一番" ${d.adj >= 13 ? 'disabled' : ''}>+</button></span></div>`
    : `<div class="pc-grid">${r.patterns.filter(p => p.group === group).map(p => patternCard(p, d)).join('')}</div>`;
  return `<section class="pc-picker" aria-label="Scoring patterns 計番牌型">
    <div class="pc-filter" role="group" aria-label="Pattern categories 牌型分類">${filters}</div>
    <div class="sheet-body scoring-field" tabindex="0" aria-label="Pattern tiles 選擇牌型">${field}</div></section>`;
}
