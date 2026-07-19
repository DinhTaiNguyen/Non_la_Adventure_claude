/* =====================================================================
   levels.js — the six chapters of the adventure.
   Coordinates: world pixels. Ground top is usually y=840. World H=1000.
   Object kinds:
     stone   standing lantern   {x, y?, key, broken, brazier}
     wire    lantern sliding on a wire {x1,x2,y,pos,len,key}
     candle  floating candle    {x, group}
     ropegate river rope barrier {x, group, n}   opens when n candles of group lit
     box     pushable crate     {x}
     plate   pressure plate     {x, id}
     gate    door/barrier       {x, need:{plates:[],platesAny:[],lanterns:[],together,w}}
     plank   plate-built bridge {x, w, plate}
     brokenbridge girl-healable bridge {x, w}
     lotus   lotus platform spot {x}
     windmark wind-bridge pedestal {x, gapw}
     memory  big memory lantern {x, idx}
     checkpoint hand-hold arch  {x}
     heart   heart lantern      {x, y, pair}
     boat    wooden boat        {x, w}
     rocks   river rocks        {x}
     statue  healable statue    {x, id, key}
     villager NPC + lantern     {x, key}
     buffalo decor              {x}
     sign    floating tip       {x, tip}
     biglantern the finale      {x}
   Enemies: wisp {x,y}, birdzone {x,range}, bamboo {x}
   ===================================================================== */
(function () {
  const GY = 840;   /* default ground top */
  const WY = 880;   /* water surface */

  function coins(x, y, n, gap, kinds) {
    const out = [];
    const K = kinds || ['lantern', 'petal', 'leaf', 'star', 'candle', 'envelope', 'banhchung', 'hat'];
    for (let i = 0; i < n; i++) {
      out.push({ x: x + i * gap, y: y - Math.sin((i / (n - 1 || 1)) * Math.PI) * 26, kind: K[i % K.length] });
    }
    return out;
  }

  const LEVELS = [

  /* ============ 1. Hội An Lantern Street ============ */
  {
    id: 1, theme: 'street', W: 6400, H: 1000, spawnX: 150, groundY: GY,
    introKey: 'lvIntro1',
    platforms: [
      { x: 0, y: GY, w: 2280, h: 160, type: 'ground' },
      { x: 2440, y: GY, w: 940, h: 160, type: 'ground' },
      { x: 3560, y: GY, w: 2840, h: 160, type: 'ground' },
      /* tutorial crates (static) */
      { x: 560, y: GY - 46, w: 56, h: 46, type: 'crate' },
      { x: 622, y: GY - 88, w: 56, h: 88, type: 'crate' },
      /* balconies */
      { x: 1800, y: 700, w: 170, h: 14, type: 'wood', oneWay: true },
      { x: 4980, y: 690, w: 170, h: 14, type: 'wood', oneWay: true },
      { x: 5240, y: 600, w: 150, h: 14, type: 'wood', oneWay: true },
    ],
    water: [{ x: 2280, w: 160, y: WY }],
    objects: [
      { k: 'sign', x: 260, tip: 'tipMove' },
      { k: 'sign', x: 500, tip: 'tipJump' },
      { k: 'sign', x: 700, tip: 'tipLight' },
      { k: 'stone', x: 790, id: 's1' },
      { k: 'gate', x: 920, id: 'gA', need: { lanterns: ['s1'] } },
      { k: 'sign', x: 1080, tip: 'tipPush' },
      { k: 'box', x: 1160, id: 'b1' },
      { k: 'plate', x: 1340, id: 'p1' },
      { k: 'gate', x: 1470, id: 'gB', need: { plates: ['p1'] } },
      { k: 'box', x: 1695, id: 'step_balcony_1', w: 58, h: 64, fixed: true, helper: true },
      { k: 'sign', x: 1720, tip: 'tipWind' },
      { k: 'wire', x1: 1840, x2: 2200, y: 560, pos: 2160, len: 80, id: 'h1', key: true },
      { k: 'gate', x: 2255, id: 'gC', need: { lanterns: ['h1'] } },
      { k: 'sign', x: 2200, tip: 'tipLotus' },
      { k: 'lotus', x: 2360, id: 'lo1' },
      { k: 'sign', x: 2560, tip: 'tipHeal' },
      { k: 'stone', x: 2700, id: 's2', broken: true, key: true },
      { k: 'sign', x: 2960, tip: 'tipHands' },
      { k: 'checkpoint', x: 3060 },
      { k: 'sign', x: 3260, tip: 'tipBridge' },
      { k: 'windmark', x: 3330, gapw: 230, id: 'w1' },
      { k: 'plank', x: 3380, w: 180, plate: 'p2', id: 'pl1' },
      { k: 'plate', x: 3650, id: 'p2' },
      { k: 'sign', x: 3900, tip: 'tipMemory' },
      { k: 'memory', x: 4020, idx: 0 },
      { k: 'sign', x: 4300, tip: 'tipTogetherGate' },
      { k: 'gate', x: 4430, id: 'gD', need: { together: true } },
      { k: 'wire', x1: 4700, x2: 5060, y: 540, pos: 4730, len: 80, id: 'h2', key: true },
      { k: 'box', x: 4900, id: 'step_balcony_2', w: 58, h: 72, fixed: true, helper: true },
      { k: 'heart', x: 5150, y: 700, pair: 1 }, { k: 'heart', x: 5330, y: 560, pair: 1 },
      { k: 'stone', x: 5540, id: 's3', key: true },
      { k: 'heart', x: 5720, y: 730, pair: 2 }, { k: 'heart', x: 5790, y: 730, pair: 2 },
    ],
    enemies: [
      { k: 'wisp', x: 2640, y: 740 }, { k: 'wisp', x: 2780, y: 700 },
      { k: 'wisp', x: 4560, y: 720 }, { k: 'wisp', x: 5900, y: 700 },
    ],
    collect: [].concat(
      coins(380, 790, 3, 60), coins(590, 700, 2, 60, ['star', 'lantern']),
      coins(1180, 770, 3, 70), coins(1830, 660, 3, 60, ['petal', 'star', 'petal']),
      coins(2290, 770, 3, 65, ['candle', 'petal', 'candle']),
      coins(2880, 780, 3, 70), coins(3390, 770, 3, 60, ['star', 'leaf', 'star']),
      coins(4150, 780, 3, 70), coins(5010, 640, 3, 60, ['envelope', 'star', 'envelope']),
      coins(5900, 780, 4, 60)
    ),
    fog: [],
    exit: { x: 6180 },
  },

  /* ============ 2. Moon River Boat Ride ============ */
  {
    id: 2, theme: 'river', W: 7200, H: 1000, spawnX: 160, groundY: GY,
    introKey: 'lvIntro2',
    platforms: [
      { x: 0, y: GY, w: 560, h: 160, type: 'wood' },        /* start dock */
      { x: 4150, y: GY, w: 500, h: 160, type: 'ground' },   /* mid island */
      { x: 6700, y: GY, w: 500, h: 160, type: 'wood' },     /* end dock */
    ],
    water: [
      { x: 560, w: 3590, y: WY },
      { x: 4650, w: 2050, y: WY },
    ],
    objects: [
      { k: 'sign', x: 300, tip: 'tipBoat' },
      { k: 'boat', x: 620, w: 230, id: 'boat' },
      { k: 'candle', x: 1500, group: 'c1' }, { k: 'candle', x: 1590, group: 'c1' }, { k: 'candle', x: 1680, group: 'c1' },
      { k: 'ropegate', x: 1880, group: 'c1', n: 3, id: 'r1' },
      { k: 'rocks', x: 2400 },
      { k: 'candle', x: 2900, group: 'c2' }, { k: 'candle', x: 2990, group: 'c2' }, { k: 'candle', x: 3080, group: 'c2' },
      { k: 'ropegate', x: 3300, group: 'c2', n: 3, id: 'r2' },
      { k: 'stone', x: 4340, id: 's1', key: true },
      { k: 'memory', x: 4430, idx: 1 },
      { k: 'checkpoint', x: 4530, boatX: 4430 },
      { k: 'heart', x: 4230, y: 730, pair: 1 }, { k: 'heart', x: 4590, y: 730, pair: 1 },
      { k: 'rocks', x: 5100 },
      { k: 'candle', x: 5400, group: 'c3' }, { k: 'candle', x: 5490, group: 'c3' }, { k: 'candle', x: 5580, group: 'c3' },
      { k: 'ropegate', x: 5800, group: 'c3', n: 3, id: 'r3' },
      { k: 'stone', x: 6820, id: 's2', key: true },
    ],
    enemies: [
      { k: 'wisp', x: 1950, y: 700 }, { k: 'wisp', x: 3500, y: 680 },
      { k: 'wisp', x: 4300, y: 700 }, { k: 'wisp', x: 6050, y: 690 },
    ],
    collect: [].concat(
      coins(900, 780, 3, 90, ['candle', 'petal', 'candle']),
      coins(1450, 750, 4, 80),
      coins(2200, 770, 3, 90, ['star', 'candle', 'star']),
      coins(2850, 750, 4, 80),
      coins(3700, 770, 3, 90),
      coins(4250, 760, 4, 90, ['lantern', 'petal', 'star', 'petal']),
      coins(4900, 770, 3, 90, ['candle', 'star', 'candle']),
      coins(5350, 750, 4, 80),
      coins(6200, 770, 4, 90)
    ),
    fog: [],
    exit: { x: 6980 },
  },

  /* ============ 3. Bamboo Bridge Village ============ */
  {
    id: 3, theme: 'village', W: 6800, H: 1000, spawnX: 150, groundY: GY,
    introKey: 'lvIntro3',
    platforms: [
      { x: 0, y: GY, w: 1200, h: 160, type: 'ground' },
      { x: 1420, y: GY, w: 1180, h: 160, type: 'ground' },
      { x: 2820, y: GY, w: 1430, h: 160, type: 'ground' },
      { x: 4430, y: GY, w: 270, h: 160, type: 'ground' },
      { x: 4920, y: GY, w: 1880, h: 160, type: 'ground' },
      /* bamboo lookouts */
      { x: 950, y: 690, w: 150, h: 12, type: 'bamboo', oneWay: true },
      { x: 2350, y: 680, w: 160, h: 12, type: 'bamboo', oneWay: true },
      { x: 3550, y: 660, w: 170, h: 12, type: 'bamboo', oneWay: true },
      { x: 5350, y: 680, w: 160, h: 12, type: 'bamboo', oneWay: true },
    ],
    water: [
      { x: 1200, w: 220, y: WY },   /* paddy 1 — broken bridge */
      { x: 2600, w: 220, y: WY },   /* paddy 2 — lotus */
      { x: 4700, w: 220, y: WY },   /* paddy 3 — broken bridge */
    ],
    objects: [
      { k: 'sign', x: 300, tip: 'tipHeal' },
      { k: 'box', x: 870, id: 'step_lookout_1', w: 58, h: 72, fixed: true, helper: true },
      { k: 'stone', x: 700, id: 's1' },
      { k: 'brokenbridge', x: 1200, w: 220, id: 'bb1' },
      { k: 'buffalo', x: 1620 },
      { k: 'culture', kind: 'buffaloRice', x: 1710, id: 'culture_buffalo_rice', xp: 4 },
      { k: 'bamboo', x: 1850, id: 'fb1' },
      { k: 'villager', x: 2200, id: 'v1', key: true },
      { k: 'box', x: 2260, id: 'step_lookout_2', w: 58, h: 72, fixed: true, helper: true },
      { k: 'heart', x: 2400, y: 640, pair: 1 }, { k: 'heart', x: 2480, y: 640, pair: 1 },
      { k: 'lotus', x: 2660, id: 'lo1' }, { k: 'lotus', x: 2770, id: 'lo2' },
      { k: 'box', x: 3040, id: 'b1' },
      { k: 'plate', x: 3210, id: 'p1' },
      { k: 'gate', x: 3330, id: 'gA', need: { plates: ['p1'] } },
      { k: 'bamboo', x: 3450, id: 'fb2' },
      { k: 'box', x: 3460, id: 'step_lookout_3', w: 58, h: 96, fixed: true, helper: true },
      { k: 'checkpoint', x: 3620 },
      { k: 'villager', x: 3750, id: 'v2', key: true },
      { k: 'culture', kind: 'hammock', x: 3890, id: 'culture_hammock', xp: 4 },
      { k: 'memory', x: 4060, idx: 2 },
      { k: 'windmark', x: 4310, gapw: 240, id: 'w1' },
      { k: 'plank', x: 4340, w: 180, plate: 'p2', id: 'pl1' },
      { k: 'plate', x: 4530, id: 'p2' },
      { k: 'brokenbridge', x: 4700, w: 220, id: 'bb2' },
      { k: 'buffalo', x: 5080 },
      { k: 'box', x: 5260, id: 'step_lookout_4', w: 58, h: 72, fixed: true, helper: true },
      { k: 'bamboo', x: 5220, id: 'fb3' },
      { k: 'culture', kind: 'sandals', x: 5290, id: 'culture_sandals', xp: 4 },
      { k: 'villager', x: 5600, id: 'v3', key: true },
      { k: 'heart', x: 5850, y: 700, pair: 2 }, { k: 'heart', x: 5930, y: 700, pair: 2 },
      { k: 'gate', x: 6200, id: 'gB', need: { together: true } },
      { k: 'memory', x: 6380, idx: 7 },
    ],
    enemies: [
      { k: 'wisp', x: 1550, y: 720 }, { k: 'wisp', x: 2930, y: 700 },
      { k: 'wisp', x: 4600, y: 680 }, { k: 'wisp', x: 5450, y: 710 },
    ],
    collect: [].concat(
      coins(400, 780, 4, 70, ['leaf', 'lantern', 'leaf', 'star']),
      coins(980, 650, 3, 55, ['leaf', 'star', 'leaf']),
      coins(1230, 760, 3, 70, ['petal', 'candle', 'petal']),
      coins(2000, 780, 3, 70),
      coins(2380, 640, 3, 55, ['banhchung', 'star', 'banhchung']),
      coins(2630, 760, 3, 70, ['petal', 'leaf', 'petal']),
      coins(3580, 620, 3, 60, ['leaf', 'star', 'leaf']),
      coins(4340, 760, 3, 70),
      coins(4730, 760, 3, 70, ['candle', 'leaf', 'candle']),
      coins(5380, 640, 3, 55, ['envelope', 'star', 'envelope']),
      coins(6000, 780, 3, 70)
    ),
    fog: [],
    exit: { x: 6600 },
  },

  /* ============ 4. Lotus Lake Promise ============ */
  {
    id: 4, theme: 'lake', W: 6200, H: 1000, spawnX: 150, groundY: GY,
    introKey: 'lvIntro4', bigMoon: true,
    windWaves: { period: 13, warn: 1.6, dur: 2.2, force: -300 },
    platforms: [
      { x: 0, y: GY, w: 500, h: 160, type: 'ground' },
      { x: 1450, y: GY, w: 200, h: 160, type: 'stone' },
      { x: 2550, y: GY, w: 300, h: 160, type: 'stone' },
      { x: 3900, y: GY, w: 200, h: 160, type: 'stone' },
      { x: 5700, y: GY, w: 500, h: 160, type: 'ground' },
    ],
    water: [
      { x: 500, w: 950, y: WY },
      { x: 1650, w: 900, y: WY },
      { x: 2850, w: 1050, y: WY },
      { x: 4100, w: 1600, y: WY },
    ],
    objects: [
      { k: 'sign', x: 280, tip: 'tipShield' },
      { k: 'lotus', x: 650 }, { k: 'lotus', x: 830 }, { k: 'lotus', x: 1010 }, { k: 'lotus', x: 1190 }, { k: 'lotus', x: 1340 },
      { k: 'stone', x: 1550, id: 's1', key: true },
      { k: 'heart', x: 1490, y: 700, pair: 1 }, { k: 'heart', x: 1610, y: 700, pair: 1 },
      { k: 'lotus', x: 1750 }, { k: 'lotus', x: 1930 }, { k: 'lotus', x: 2110 }, { k: 'lotus', x: 2290 }, { k: 'lotus', x: 2450 },
      { k: 'stone', x: 2640, id: 's2', key: true, broken: true },
      { k: 'checkpoint', x: 2700 },
      { k: 'memory', x: 2780, idx: 3 },
      { k: 'lotus', x: 2950 }, { k: 'lotus', x: 3130 }, { k: 'lotus', x: 3310 }, { k: 'lotus', x: 3490 }, { k: 'lotus', x: 3670 },
      { k: 'heart', x: 3310, y: 690, pair: 2 }, { k: 'heart', x: 3490, y: 690, pair: 2 },
      { k: 'lotus', x: 4200 }, { k: 'lotus', x: 4380 }, { k: 'lotus', x: 4560 }, { k: 'lotus', x: 4740 },
      { k: 'lotus', x: 4920 }, { k: 'lotus', x: 5100 }, { k: 'lotus', x: 5280 }, { k: 'lotus', x: 5460 },
      { k: 'stone', x: 5860, id: 's3', key: true },
      { k: 'memory', x: 5960, idx: 5 },
    ],
    enemies: [
      { k: 'wisp', x: 900, y: 690 }, { k: 'wisp', x: 2000, y: 680 },
      { k: 'birdzone', x: 1900, range: 700 },
      { k: 'birdzone', x: 3400, range: 700 },
      { k: 'wisp', x: 3300, y: 660 },
      { k: 'birdzone', x: 4800, range: 800 },
      { k: 'wisp', x: 5000, y: 680 },
    ],
    collect: [].concat(
      coins(650, 750, 4, 90, ['petal', 'candle', 'petal', 'star']),
      coins(1760, 740, 4, 90, ['petal', 'star', 'candle', 'petal']),
      coins(2960, 740, 4, 90),
      coins(4210, 740, 5, 90, ['petal', 'candle', 'star', 'petal', 'candle']),
      coins(5000, 730, 4, 90),
      coins(5750, 770, 4, 70)
    ),
    fog: [{ x: 2850, w: 1050 }],
    exit: { x: 6050 },
  },

  /* ============ 5. Ancient Temple of Lanterns ============ */
  {
    id: 5, theme: 'temple', W: 6600, H: 1000, spawnX: 150, groundY: GY,
    introKey: 'lvIntro5',
    platforms: [
      { x: 0, y: GY, w: 6600, h: 160, type: 'stone' },
      /* steps & beams */
      { x: 1250, y: GY - 50, w: 130, h: 50, type: 'stone' },
      { x: 3450, y: 640, w: 200, h: 16, type: 'wood', oneWay: true },
      { x: 3250, y: 520, w: 150, h: 16, type: 'wood', oneWay: true },
      /* vertical section */
      { x: 4250, y: 700, w: 150, h: 14, type: 'wood', oneWay: true },
      { x: 4470, y: 580, w: 150, h: 14, type: 'wood', oneWay: true },
      { x: 4690, y: 460, w: 170, h: 14, type: 'wood', oneWay: true },
      { x: 4930, y: 560, w: 150, h: 14, type: 'wood', oneWay: true },
    ],
    water: [],
    objects: [
      { k: 'stone', x: 800, id: 'br1', key: true, brazier: true },
      { k: 'box', x: 1330, id: 'b1' },
      { k: 'plate', x: 1560, id: 'p1' },
      { k: 'gate', x: 1720, id: 'gA', need: { plates: ['p1'] }, temple: true },
      { k: 'stone', x: 2080, id: 'br2', key: true, brazier: true, broken: true },
      { k: 'culture', kind: 'bauda', x: 2290, id: 'culture_bauda', xp: 5 },
      { k: 'sign', x: 2350, tip: 'tipTogetherGate' },
      { k: 'gate', x: 2500, id: 'gB', need: { together: true }, temple: true },
      { k: 'heart', x: 3000, y: 720, pair: 1 }, { k: 'heart', x: 3160, y: 720, pair: 1 },
      { k: 'box', x: 3375, id: 'step_temple_beam', w: 60, h: 108, fixed: true, helper: true },
      { k: 'stone', x: 3540, y: 640, id: 'br3', key: true, brazier: true },
      { k: 'statue', x: 3900, id: 'st1' },
      { k: 'gate', x: 4080, id: 'gC', need: { lanterns: ['st1'] }, temple: true },
      { k: 'box', x: 4170, id: 'step_temple_tower', w: 58, h: 64, fixed: true, helper: true },
      { k: 'plate', x: 4740, y: 460, id: 'p2' },
      { k: 'gate', x: 5040, id: 'gD', need: { platesAny: ['p2', 'p3'] }, temple: true },
      { k: 'plate', x: 5170, id: 'p3' },
      { k: 'memory', x: 5330, idx: 4 },
      { k: 'culture', kind: 'chuoi', x: 5385, id: 'culture_chuoi', xp: 5 },
      { k: 'checkpoint', x: 5450 },
      { k: 'stone', x: 5650, id: 'br4', key: true, brazier: true },
      { k: 'heart', x: 5850, y: 700, pair: 2 }, { k: 'heart', x: 5930, y: 700, pair: 2 },
    ],
    enemies: [
      { k: 'wisp', x: 1150, y: 720 },
      { k: 'wisp', x: 2700, y: 700 }, { k: 'wisp', x: 2900, y: 730 }, { k: 'wisp', x: 3100, y: 690 },
      { k: 'birdzone', x: 4600, range: 500 },
      { k: 'wisp', x: 5900, y: 700 },
    ],
    collect: [].concat(
      coins(400, 780, 4, 70, ['envelope', 'lantern', 'envelope', 'star']),
      coins(1300, 720, 3, 70),
      coins(1950, 780, 3, 70, ['envelope', 'star', 'envelope']),
      coins(2700, 770, 4, 80, ['candle', 'star', 'candle', 'star']),
      coins(3270, 480, 3, 60, ['star', 'envelope', 'star']),
      coins(3700, 780, 3, 70),
      coins(4280, 660, 2, 60, ['envelope', 'star']),
      coins(4500, 540, 2, 60, ['star', 'envelope']),
      coins(4720, 420, 3, 55, ['banhchung', 'star', 'banhchung']),
      coins(5500, 780, 3, 70),
      coins(6100, 780, 3, 70)
    ),
    fog: [{ x: 2600, w: 750 }],
    exit: { x: 6380 },
  },

  /* ============ 6. The Great Lantern Festival ============ */
  {
    id: 6, theme: 'finale', W: 5600, H: 1000, spawnX: 140, groundY: GY,
    introKey: 'lvIntro6', dark: true,
    platforms: [
      { x: 0, y: GY, w: 2200, h: 160, type: 'ground' },
      { x: 2360, y: GY, w: 740, h: 160, type: 'ground' },
      { x: 3280, y: GY, w: 2320, h: 160, type: 'ground' },
      { x: 1330, y: 700, w: 160, h: 14, type: 'wood', oneWay: true },
    ],
    water: [{ x: 2200, w: 160, y: WY }],
    objects: [
      { k: 'stone', x: 500, id: 's1', key: true, broken: true },
      { k: 'wire', x1: 1050, x2: 1400, y: 550, pos: 1080, len: 80, id: 'h1', key: true },
      { k: 'box', x: 1250, id: 'step_festival_stage', w: 58, h: 64, fixed: true, helper: true },
      { k: 'culture', kind: 'giong', x: 1515, id: 'culture_giong', xp: 10 },
      { k: 'villager', x: 1900, id: 'v1', key: true },
      { k: 'lotus', x: 2280, id: 'lo1' },
      { k: 'stone', x: 2600, id: 's2', key: true },
      { k: 'windmark', x: 3050, gapw: 230, id: 'w1' },
      { k: 'plank', x: 3100, w: 180, plate: 'p1', id: 'pl1' },
      { k: 'plate', x: 3370, id: 'p1' },
      { k: 'stone', x: 3560, id: 's3', key: true, broken: true },
      { k: 'gate', x: 4000, id: 'gA', need: { together: true } },
      { k: 'heart', x: 4550, y: 720, pair: 1 }, { k: 'heart', x: 4630, y: 720, pair: 1 },
      { k: 'checkpoint', x: 4700 },
      { k: 'memory', x: 4790, idx: 6 },
      { k: 'sign', x: 4950, tip: 'tipChannel' },
      { k: 'biglantern', x: 5200, id: 'big' },
    ],
    enemies: [
      { k: 'wisp', x: 700, y: 720 }, { k: 'wisp', x: 1600, y: 700 },
      { k: 'wisp', x: 2500, y: 710 }, { k: 'wisp', x: 2700, y: 680 },
      { k: 'birdzone', x: 3500, range: 600 },
      { k: 'wisp', x: 4200, y: 700 }, { k: 'wisp', x: 4350, y: 730 },
    ],
    collect: [].concat(
      coins(350, 780, 3, 70),
      coins(900, 780, 3, 70, ['candle', 'star', 'candle']),
      coins(1360, 660, 3, 55, ['star', 'lantern', 'star']),
      coins(2230, 760, 3, 60, ['petal', 'candle', 'petal']),
      coins(2800, 780, 3, 70),
      coins(3400, 770, 3, 70, ['envelope', 'star', 'envelope']),
      coins(4200, 780, 3, 70),
      coins(4900, 780, 3, 70, ['lantern', 'star', 'lantern'])
    ),
    fog: [{ x: 4100, w: 500 }],
    exit: null, /* finale ends via the big lantern */
  },
  ];

  /* count key lanterns per level */
  LEVELS.forEach(lv => {
    lv.required = lv.objects.filter(o => o.key).length;
  });

  NLA.LEVELS = LEVELS;
})();
