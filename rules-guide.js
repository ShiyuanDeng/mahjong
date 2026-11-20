// Mandarin explanations use the traditional characters printed on this table's tiles.
const HK_GUIDE = {
  notes: {
    en: 'This table uses Hong Kong scoring with house choices. A dealer win or draw keeps the dealer in place. Concealed hands and flower replacement wins can earn a house bonus. Each hand has one winner and uses the payment split in Setup, including when a kong is robbed.',
    zh: '本桌採用港式計番。按本桌約定，莊家和牌或流局時連莊；門前清與補花自摸可各加一番。每局只記一位贏家，搶槓也按設定中的放銃方式付分。'
  },
  sources: [
    {en:'CityU Students’ Union tournament rules, sections 3–4 (Chinese PDF)', zh:'香港城市大學學生會賽例，第 3 至 4 節（中文 PDF）', url:'https://files.cityusu.hk/files/events/mj2023_rules.pdf'},
    {en:'Victoria Mahjong Club · Hong Kong payout variants and beginner’s guide', zh:'維多利亞麻將俱樂部 · 港式付分方式與入門指南（英文）', url:'https://victoriamahjongclub.com/resources'}
  ],
  glossary: [
    {en:'A regular win needs four sets and a pair. Each set can be a chow, pung or kong. Thirteen orphans and flower wins have their own shapes.', zh:'一般和牌要有四組面子和一對將牌。面子可以是順子、刻子或槓子。十三么和花糊另有和牌條件。'},
    {en:'Chow = three consecutive numbers in one suit. Pung = three identical tiles. Kong = four identical tiles declared together. Pair = two identical tiles.', zh:'順子是同花色連續三張數牌；刻子是三張相同的牌；槓子是四張相同且已開槓的牌；將牌是兩張相同的牌。'},
    {en:'The suits are characters (萬), dots (筒) and bamboo (索). Honours are the four winds and the red, green and white dragons (中、發、白).', zh:'數牌有萬、筒、索三種花色。字牌包括東、南、西、北四種風牌，以及中、發、白三種三元牌。'},
    {en:'Fan measure the value of a hand. The payment table converts fan to the points each player gains or loses.', zh:'番數表示一副牌的價值。查付分表，就知道每位玩家實際得分或失分多少。'}
  ],
  patterns: {
    zimo: {desc:'自己摸到和牌所需的最後一張牌。一般和牌選「自摸」後會自動加一番；花糊另有固定番數。'},
    menqing: {desc:'和牌前沒有吃、碰或明槓，可以有暗槓。', extra:'這是本桌加番項目。和別人打出的牌也可以算門前清。'},
    qianggang: {desc:'別人把第四張相同的牌加到已碰出的刻子上，而這張牌正好讓你和牌。', extra:'記分時選擇加槓的人作為放銃者。'},
    gangshang: {desc:'開槓後補進的牌正好讓你和牌。', extra:'自摸的一番照算。'},
    haidi: {desc:'摸到牌牆的最後一張牌，並用這張牌和牌。', extra:'自摸的一番照算。'},
    huashang: {desc:'摸到花牌後，補進的牌正好讓你和牌。', extra:'這是本桌加番項目，自摸的一番照算。'},
    pinghu: {desc:'四組順子加一對將牌。將牌可以是字牌。'},
    duidui: {desc:'四組刻子或槓子，加一對將牌。'},
    hunyise: {desc:'只用一種花色的數牌，並且含有風牌或三元牌。'},
    qingyise: {desc:'所有牌都是同一種花色的數牌。'},
    hunyaojiu: {desc:'四組刻子或槓子加一對將牌。全手只有一、九和字牌，且同時有數牌和字牌。', extra:'勾選後會自動加計對對糊，兩項合計四番。'},
    dragon: {desc:'中、發、白的刻子或槓子，每組一番。', extra:'若有兩種三元牌的刻子或槓子，另一種正好作將，請選「小三元」。'},
    seatwind: {desc:'用自己座位的風牌組成刻子或槓子。可從牌桌查看目前的座風。', extra:'圖中以坐南的玩家為例。'},
    roundwind: {desc:'用本圈的風牌組成刻子或槓子。', extra:'座風與圈風相同時，門風和圈風都可以勾選，合計兩番。'},
    xiaosanyuan: {desc:'兩種三元牌各成刻子或槓子，第三種作將。', extra:'五番已包含兩組三元牌的番數。'},
    dasanyuan: {desc:'中、發、白各有一組刻子或槓子。', extra:'八番已包含三組三元牌的番數。'},
    xiaosixi: {desc:'三種風牌各成刻子或槓子，第四種風牌作將。'},
    wuhua: {desc:'整局沒有拿到任何花牌或季節牌。'},
    zhenghua: {desc:'花牌或季節牌的號碼與座位相符：東一、南二、西三、北四。', extra:'花牌與季節牌各可計一張，最多兩番。'},
    yitaihua: {desc:'集齊梅、蘭、菊、竹四種花牌，或春、夏、秋、冬四種季節牌。', extra:'另勾選一次「正花」，加上同組中對應座位的那張牌，合計兩番。'},
    qihua: {desc:'摸到第七張花牌或季節牌後，可以在補牌前立即宣告和牌。', extra:'記分時選「自摸」。整局共三番，已包含花牌與自摸。'},
    shisanyao: {desc:'三種花色的一和九、四種風牌，以及中、發、白各一張。其中任一種再有一張作將。'},
    jiulian: {desc:'用同一花色湊成一一一二三四五六七八九九九，再加一張同花色的數牌，整手保持門清。'},
    kankan: {desc:'四組暗刻加一對將牌，全手沒有開槓。單吊將牌可和別人的棄牌；要完成第四組刻子則必須自摸。又稱「四暗刻」。'},
    dasixi: {desc:'東、南、西、北各有一組刻子或槓子，另有一對將牌。'},
    ziyise: {desc:'整手和牌只用風牌和三元牌。'},
    qingyaojiu: {desc:'整手和牌只用數牌的一和九。'},
    shiba: {desc:'開出四組槓子，再加一對將牌，共十八張牌。'},
    gangshanggang: {desc:'連續開兩個槓，第二次槓後補進的牌正好讓你和牌。兩槓之間不能補花。'},
    tianhu: {desc:'莊家起手的十四張牌就能和牌，記作自摸。'},
    dihu: {desc:'閒家用莊家打出的第一張牌和牌。'},
    bahua: {desc:'集齊四張花牌和四張季節牌，宣告自摸，按番數上限計分。'}
  }
};
