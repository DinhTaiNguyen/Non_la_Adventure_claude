/* =====================================================================
   Nón Lá Love Adventure — config, constants, costumes, i18n, save data
   ===================================================================== */
window.NLA = window.NLA || {};

NLA.CONST = {
  VIEW_W: 1280, VIEW_H: 720,
  GRAVITY: 2300,
  MOVE_SPEED: 262,
  MOVE_SPEED_GIRL: 252,
  JUMP_V: 780,
  JUMP_V_GIRL: 760,
  PLAYER_W: 30, PLAYER_H: 56,
  COYOTE: 0.10, JUMP_BUFFER: 0.12,
  GUST_CD: 0.9, LIGHT_CD: 1.0, LOTUS_CD: 0.7,
  SHIELD_MAX: 4.0, SHIELD_REGEN: 1.1,
  GUST_RANGE: 280, LIGHT_RANGE: 165,
  HANDS_DIST: 80,
  LOVE_MAX: 100,
  LOVE_LEVELS: [15, 35, 55, 75, 95],
  HAT_SPECIAL_COST: 42,
  HAT_SPECIAL_REGEN: 7.5,
  HAT_XP_LEVELS: [0, 40, 100, 180, 280, 400],
};

/* love gain amounts */
NLA.LOVE = {
  lantern: 4, puzzle: 6, memory: 10, checkpoint: 8,
  save: 6, heartPair: 5, assist: 2, dispel: 1,
};

/* Online play uses direct WebRTC when possible. Strict routers and mobile
   carriers need TURN. A deployment can inject short-lived TURN credentials
   through window.NLA_TURN_SERVERS before config.js loads, or provide an
   endpoint through window.NLA_TURN_ENDPOINT which returns { iceServers: [] }.
   Never place permanent private credentials in this public repository. */
NLA.NETWORK = {
  version: 2,
  turnEndpoint: window.NLA_TURN_ENDPOINT || '',
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
  ].concat(Array.isArray(window.NLA_TURN_SERVERS) ? window.NLA_TURN_SERVERS : []),
};

/* ---------------- costumes (palette swaps) ---------------- */
NLA.COSTUMES = [
  { id: 'classic', need: 0,
    boy:  { robe1:'#2e6fd8', robe2:'#1a3f8f', trim:'#f5c96b', pants:'#f5efe2', hat:'#e8c98a', band:'#2e6fd8', hair:'#241a18' },
    girl: { robe1:'#ff9db5', robe2:'#e06a8e', trim:'#fff3dc', pants:'#fff6ea', hat:'#efd8a4', band:'#ff9db5', hair:'#241a18', flower:'#ffd1dc' } },
  { id: 'flower', need: 10,
    boy:  { robe1:'#7db5e8', robe2:'#4a7fc0', trim:'#ffe9b3', pants:'#f2f7ff', hat:'#f0e0b0', band:'#e06a8e', hair:'#241a18', hatFlower:'#ff9db5' },
    girl: { robe1:'#ffd1dc', robe2:'#f5a3bd', trim:'#fff', pants:'#fff', hat:'#f5e6c0', band:'#e06a8e', hair:'#2c1f1c', flower:'#ff7fa5', hatFlower:'#ff5c8a' } },
  { id: 'lantern', need: 25,
    boy:  { robe1:'#d8452e', robe2:'#9c2a1e', trim:'#ffd76b', pants:'#3a2431', hat:'#e8b56b', band:'#d8452e', hair:'#241a18' },
    girl: { robe1:'#ff6b5c', robe2:'#d8452e', trim:'#ffe9b3', pants:'#fff0e0', hat:'#efc98a', band:'#ffd76b', hair:'#241a18', flower:'#ffd76b' } },
  { id: 'lotus', need: 40,
    boy:  { robe1:'#3fb8ae', robe2:'#25867f', trim:'#d0fff9', pants:'#eafffc', hat:'#dcd2a0', band:'#3fb8ae', hair:'#241a18' },
    girl: { robe1:'#a3e8d8', robe2:'#5ec9b4', trim:'#fff', pants:'#f0fff9', hat:'#e5d8a8', band:'#ff9db5', hair:'#2c1f1c', flower:'#ffb3c8', hatFlower:'#ff9db5' } },
  { id: 'tet', need: 60,
    boy:  { robe1:'#e03535', robe2:'#a81f24', trim:'#ffd935', pants:'#fff3dc', hat:'#eec06b', band:'#ffd935', hair:'#241a18' },
    girl: { robe1:'#ffd935', robe2:'#f0a92e', trim:'#e03535', pants:'#fff6d8', hat:'#f0d290', band:'#e03535', hair:'#241a18', flower:'#e03535' } },
  { id: 'bamboo', need: 80,
    boy:  { robe1:'#6da845', robe2:'#47702c', trim:'#e8dcb0', pants:'#efe8d0', hat:'#d5c48c', band:'#47702c', hair:'#241a18' },
    girl: { robe1:'#b5d98a', robe2:'#8ab55c', trim:'#fff8e0', pants:'#fffbe8', hat:'#e0d09c', band:'#8ab55c', hair:'#2c1f1c', flower:'#f5efc0' } },
  { id: 'wedding', need: -1, /* unlocked by finishing the story */
    boy:  { robe1:'#c8102e', robe2:'#8e0b20', trim:'#ffd700', pants:'#fff8ec', hat:'#f2ce7e', band:'#ffd700', hair:'#241a18' },
    girl: { robe1:'#ff2e4f', robe2:'#c8102e', trim:'#ffd700', pants:'#fff8ec', hat:'#f7dfa5', band:'#ffd700', hair:'#241a18', flower:'#ffd700', veil:true } },
  { id: 'modern', need: 105,
    boy:  { robe1:'#2c3550', robe2:'#1b2237', trim:'#ffffff', pants:'#e8ecf5', hat:'#e0d5b0', band:'#ffffff', hair:'#241a18' },
    girl: { robe1:'#ffffff', robe2:'#dfe6f0', trim:'#2c3550', pants:'#fff', hat:'#ece2c0', band:'#2c3550', hair:'#2c1f1c', flower:'#ffffff' } },
];

/* ---------------- i18n ---------------- */
NLA.I18N = {
  en: {
    playSolo: 'Play Solo', local2p: '2 Players · One Keyboard', online: 'Play Online Together 💞',
    wardrobe: 'Wardrobe', howto: 'How to Play', back: 'Back', select: 'Select',
    menuFoot: 'A cozy Vietnamese fairytale about love & light ✨',
    pickChar: 'Choose your character', boyDesc: 'Wind blade · Reflecting shield · Nón Lá magic', girlDesc: 'Light pulse · Lotus healing · Nón Lá magic',
    soloHint: 'Your partner follows you — press Tab / 🔄 to swap anytime.',
    chooseLevel: 'Choose a chapter',
    onlineTitle: 'Play Together Online 💞',
    onlineHint: 'One person creates a room and shares the 4-letter code. Direct play works worldwide; a configured TURN relay carries the game through strict routers and mobile networks.',
    onlinePickHint: 'Pick who YOU play — your partner gets the other.',
    hostGame: 'Create a room 💌', joinGame: 'Join', shareCode: 'Share this code with your love:',
    loadingOnline: 'Preparing worldwide online play…', connecting: 'Finding a path across the world…', waitingPartner: 'Room ready — waiting for your partner…',
    partnerJoined: 'Your partner is here! 💗 Starting…', joinFail: 'Could not reach that room. Check the code, keep the host page open, then try again.',
    netLost: 'Connection drifted away 🌬 — partner is now guided by lantern spirits.',
    needPeer: 'Online play needs internet (PeerJS could not load).',
    relayReady: '🌏 Worldwide relay ready — strict networks can connect.',
    relayMissing: '⚠ Direct connection only. Add TURN relay credentials before overseas play for reliable connection.',
    retryingOnline: 'The first path was blocked — trying another route…',
    connectedDirect: 'Connected directly across the world 💞', connectedRelay: 'Connected through the worldwide relay 💞',
    paused: 'Paused 🌙', resume: 'Resume', restart: 'Restart chapter', backToMenu: 'Back to menu',
    continue: 'Continue ➜', keepGoing: 'Keep it in our hearts 💗',
    memoryTitle: 'A warm memory returns…',
    levelClear: 'Chapter complete! 🎆', nextChapter: 'Next chapter ➜',
    statTime: 'Time', statCharms: 'Charms found', statLove: 'Love grown', statMemories: 'Memories',
    locked: 'Locked', unlockedAt: 'charms to unlock', weddingNeed: 'Finish the story to unlock',
    charmsOwned: 'Charms collected', rotate: 'Please rotate your phone to landscape 💛',
    touchMoveLeft: 'Move left', touchMoveRight: 'Move right', touchJump: 'Jump',
    touchWind: 'Wind', touchShield: 'Shield', touchLight: 'Light', touchLotus: 'Lotus',
    touchHands: 'Hold hands', touchSwitch: 'Switch character', touchHeart: 'Send a heart emote', touchSpecial: 'Nón Lá special',
    touchGuide: 'Left: slide to walk. Tap △ Nón Lá when its gold meter is ready. 💗 is only a friendly emote.',
    spiritMonster: 'Restless spirit', spiritMagic: 'spirit magic', hatMastery: 'Nón Lá Mastery', bossPhase: 'Phase',
    hatSkillName1: 'Golden Rim', hatSkillName2: 'Moon-River Return', hatSkillName3: 'Bamboo Gale Ring',
    hatSkillName4: 'Lotus Halo', hatSkillName5: 'Bronze Dragon Seal', hatSkillName6: 'Twin-Star Tempest',
    guardianName1: 'Lantern Alley Guardian', guardianName2: 'Moonwater Guardian', guardianName3: 'Bamboo Mask Guardian',
    guardianName4: 'Lotus Mist Guardian', guardianName5: 'Bronze Drum Guardian', guardianName6: 'Festival Gate Guardian',
    bossName1: 'Ashen Lantern Moth', bossName2: 'Moonwater Serpent', bossName3: 'Ancient Bamboo Shade',
    bossName4: 'Lotus Eclipse Crane', bossName5: 'Corrupted Bronze Sentinel', bossName6: 'The Hollow Monsoon',
    guardianAwakes: '⚔ {NAME} blocks the road — use Wind, Light and reflected magic!',
    bossAwakes: '👑 {NAME} awakens with three forms of magic!', guardianPurified: 'Guardian purified — its light joins your nón lá.',
    bossPurified: '✨ {NAME} is free from the cold wind!', hatMasteryUp: '△ Nón Lá Mastery {RANK} — {SKILL} unlocked!',
    bossCastVolley: 'Fan of wandering flames', bossCastWave: 'Earth-running spirit wave',
    bossCastRain: 'Falling sky seals — keep moving!', bossCastRing: 'Eight-direction magic ring',
    questGuardian: 'Quest: purify {NAME}', questBoss: 'Quest: defeat {NAME}', questLanterns: 'Quest: light the remaining key lanterns',
    questExit: 'Quest complete: reach the arch together', bossBlocksExit: 'The chapter boss still guards the way!',
    hatNotReady: 'Nón Lá magic is recharging…', playerRevived: 'Lantern courage restored at the checkpoint 💛',
    lvName1: 'Hội An Lantern Street', lvName2: 'Moon River Boat Ride', lvName3: 'Bamboo Bridge Village',
    lvName4: 'Lotus Lake Promise', lvName5: 'Ancient Temple of Lanterns', lvName6: 'The Great Lantern Festival',
    costume_classic: 'Classic Festival Áo Dài', costume_flower: 'Nón Lá Flower', costume_lantern: 'Hội An Lantern',
    costume_lotus: 'Lotus Lake', costume_tet: 'Tết Celebration', costume_bamboo: 'Bamboo Village',
    costume_wedding: 'Vietnamese Wedding', costume_modern: 'Modern Couple',
    loveLv0: 'New Sparks', loveLv1: 'Hand in Hand', loveLv2: 'Shared Lantern Light', loveLv3: 'Double Nón Lá Shield',
    loveLv4: 'Love Wind Jump', loveLv5: 'Festival Blessing',
    loveUp1: '💞 Love Level 1 — Hand-in-Hand Walk! Hold hands to stay safe in the dark.',
    loveUp2: '💞 Love Level 2 — Shared Lantern Light! Your glow is bigger together.',
    loveUp3: '💞 Love Level 3 — Double Nón Lá Shield! The shield covers you both, stronger.',
    loveUp4: '💞 Love Level 4 — Love Wind Jump! Jump while holding hands to soar together.',
    loveUp5: '💞 Love Level 5 — Festival Blessing! Nearby lanterns glow for you.',
    tipMove: 'Walk with the movement keys — stay close together!',
    tipJump: 'Jump over the crates.', tipLight: 'Girl: press her power near the lantern to light it ✨',
    tipWind: 'Boy: press his power to blow wind — swing the hanging lantern low, then the girl lights it!',
    tipPush: 'Boy: walk into the crate to push it onto the golden plate.',
    tipLotus: 'Girl: use her 2nd power near sparkling water to grow a lotus platform 🌸',
    tipHands: 'Stand close & press the hands key under the arch to hold hands 🤝',
    tipMemory: 'Stand together under the big lantern…',
    tipBridge: 'Boy: stand on the wind mark & HOLD power to make a wind bridge. Girl: cross & step on the plate!',
    tipShield: 'Boy: HOLD his 2nd power to shield you both from wind and spirits 🛡',
    tipBoat: 'All aboard! Boy: blow wind to sail the boat ⛵ Girl: light the floating candles to open the rope gates.',
    tipHeal: 'Girl: her light heals broken things — lanterns, bridges, statues 💗',
    tipChannel: 'Stand on the two pedestals and BOTH HOLD your powers to wake the Great Lantern!',
    tipTogetherGate: 'Some gates open only when you stand close together 💑',
    promptLight: 'Light ✨', promptWind: 'Wind 🌀', promptLotus: 'Lotus 🌸', promptShield: 'Shield 🛡',
    promptHands: 'Hold hands 🤝', promptRelease: 'Let go', promptSwap: 'Swap', promptChannel: 'HOLD to channel ✨',
    exitNeed: 'Light the key lanterns first! 🏮',
    exitReady: 'The way is open — walk on together! ➜',
    fellWater: 'Splash! 💦', partnerSaved: 'saved you! +💗',
    helpKeys: `<h5>🕹 Keyboard — Player 1 (Boy · {BOY})</h5>
<p><span class="kbd">A</span><span class="kbd">D</span> move · <span class="kbd">W</span> jump · <span class="kbd">E</span> Wind Blade · <span class="kbd">Q</span> hold Shield · <span class="kbd">R</span> Nón Lá special</p>
<h5>🕹 Keyboard — Player 2 (Girl · {GIRL})</h5>
<p><span class="kbd">◀</span><span class="kbd">▶</span> move · <span class="kbd">▲</span> jump · <span class="kbd">O</span> Light Pulse · <span class="kbd">P</span> Lotus · <span class="kbd">I</span> Nón Lá special</p>
<h5>💞 Together</h5>
<p><span class="kbd">H</span> hold hands (stand close) · <span class="kbd">Tab</span> swap character (solo) · <span class="kbd">1</span><span class="kbd">2</span><span class="kbd">3</span> emotes · <span class="kbd">Esc</span> pause</p>
<h5>🌀 {BOY} (boy)</h5><p>Wind damages and pushes spirits, moves lanterns, boats and crates. Hold Shield to protect both players and reflect boss magic back at its caster.</p>
<h5>✨ {GIRL} (girl)</h5><p>Light damages shadow spirits, wakes lanterns and heals broken things. Lotus creates safe platforms while her aura reveals the dark.</p>
<h5>△ Nón Lá Mastery</h5><p>Purifying spirits grows shared Nón Lá Mastery through six Vietnamese-inspired skills. Use the special only when its gold energy bar is ready.</p>
<h5>👑 Chapter quest</h5><p>Light key lanterns, purify the guardian, then defeat the chapter boss. Bosses have multiple phases: dodge marked attacks, reflect magic with Shield, and answer with Wind, Light and Nón Lá skills.</p>
<h5>📱 Phones & touch controls</h5>
<p>Put one thumb anywhere on the left side, slide to walk and lift it to stop. <span class="kbd">↑</span> jumps. The labelled powers change with your character. Tap <span class="kbd">△</span> for Nón Lá magic when its gold meter is full.</p>
<p><span class="kbd">🤝</span> toggles holding hands when you stand close. <span class="kbd">🔄</span> swaps character in solo play. <span class="kbd">💗</span> sends a friendly heart emote only — it does not add Love.</p>
<p>For two people on phones, use “Play Online Together”.</p>
<h5>💗 Love icons</h5><p>The heart above the centre lantern is the Love Meter. Help each other, light key lanterns and collect both matching heart lanterns to grow it; every pair gives +5 Love. Its five levels unlock co-op benefits such as safer hand-holding, brighter shared light, a stronger shield and a joint wind jump.</p>`,
    namesTitle: '✏️ Your names',
    intro: [
      'Long ago, in the ancient town of Hội An,\nevery lantern held a tiny warm flame of memory. 🏮',
      'But one night, a strange cold wind swept the town…\nand carried every flame far away.\nThe town lost its color. The river lost its song.',
      '{BOY} and {GIRL} — two young hearts with magical nón lá —\npromised each other one thing:\n“Together, we will bring the light home.” 💞',
    ],
    lvIntro1: 'Chapter 1 — Lantern Street\nRestore the lanterns, learn your Nón Lá magic, purify the alley guardian, then face the Ashen Lantern Moth.',
    lvIntro2: 'Chapter 2 — Moon River\nSail the Thu Bồn river, light the floating candles and master Moon-River Return before the serpent wakes.',
    lvIntro3: 'Chapter 3 — Bamboo Village\nRepair the village, protect its people and let the bamboo teach your spinning hat a stronger gale.',
    lvIntro4: 'Chapter 4 — Lotus Lake\nCross the moonlit water, shield each other from shadow birds and challenge the Lotus Eclipse Crane.',
    lvIntro5: 'Chapter 5 — Ancient Temple\nRead the bronze seals, combine Wind and Light, and free the temple sentinel from corruption.',
    lvIntro6: 'Final Chapter — The Great Lantern Festival\nEverything you learned leads here. Purify the final guardian and survive the Hollow Monsoon’s three phases.',
    memories: [
      'The first time we met, it rained over the old bridge.\nYou shared your nón lá with me,\nand we both got wet anyway. We laughed so hard. ☔',
      'You bought two bowls of cao lầu,\nand gave me all your crispy pork.\nI knew right then. 🍜',
      'We released a paper lantern on the river\nand you whispered a wish.\nYou never told me what it was… but you smiled at me.',
      'When I was scared of the storm,\nyou held my hand and said:\n“The wind is just the sky breathing. I’m here.” 🌬',
      'We planted a tiny lotus in a bowl.\nEveryone said it wouldn’t bloom.\nIt bloomed. 🌸',
      'Grandmother said: “Love is not fire, little ones.\nIt is a lantern — you must tend it every day,\nand it will light every road.” 🏮',
      'You danced badly at the festival.\nSo badly. I loved every second of it. 🎶',
      'We stood on the bridge and promised:\nwherever the wind blows us,\nwe blow back — together. 💞',
    ],
    ending: [
      'The Great Lantern breathes again…\nand its light runs like a golden river through every street. 🏮',
      'Every lantern remembers its flame.\nEvery house remembers its color.\nThe town remembers its song.',
      'And on the old bridge, under a sky of floating lights,\ntwo nón lá lean gently against each other.',
      'Love is not one strong hero.\nIt is two hearts, holding one light. 💞\n\n— The End —\n\nThank you for playing, and for tending your lantern.',
    ],
    endingUnlock: '👘 Wedding costumes unlocked in the Wardrobe!',
    villager: 'Thank you, young lights! 💛',
    stat_lanterns: 'lanterns',
  },

  vi: {
    playSolo: 'Chơi một mình', local2p: '2 người · Một bàn phím', online: 'Chơi Online cùng nhau 💞',
    wardrobe: 'Tủ đồ', howto: 'Cách chơi', back: 'Quay lại', select: 'Chọn',
    menuFoot: 'Một chuyện cổ tích Việt Nam ấm áp về tình yêu và ánh sáng ✨',
    pickChar: 'Chọn nhân vật của bạn', boyDesc: 'Đao gió · Khiên phản phép · Phép Nón Lá', girlDesc: 'Xung ánh sáng · Sen chữa lành · Phép Nón Lá',
    soloHint: 'Người ấy sẽ đi theo bạn — nhấn Tab / 🔄 để đổi vai bất cứ lúc nào.',
    chooseLevel: 'Chọn chương',
    onlineTitle: 'Chơi Online cùng nhau 💞',
    onlineHint: 'Một người tạo phòng và gửi mã 4 chữ. Kết nối trực tiếp hoạt động toàn cầu; TURN relay đã cấu hình sẽ giúp vượt qua mạng di động hoặc bộ định tuyến nghiêm ngặt.',
    onlinePickHint: 'Chọn nhân vật BẠN muốn chơi — người ấy sẽ nhận nhân vật còn lại.',
    hostGame: 'Tạo phòng 💌', joinGame: 'Vào', shareCode: 'Gửi mã này cho người ấy:',
    loadingOnline: 'Đang chuẩn bị kết nối toàn cầu…', connecting: 'Đang tìm đường kết nối qua thế giới…', waitingPartner: 'Phòng đã sẵn sàng — đang chờ người ấy…',
    partnerJoined: 'Người ấy đến rồi! 💗 Bắt đầu…', joinFail: 'Không thể kết nối tới phòng. Kiểm tra mã, giữ trang của chủ phòng mở rồi thử lại.',
    netLost: 'Kết nối bay theo gió mất rồi 🌬 — đèn lồng sẽ dẫn lối cho người ấy.',
    needPeer: 'Chơi online cần Internet (không tải được PeerJS).',
    relayReady: '🌏 Relay toàn cầu đã sẵn sàng — mạng nghiêm ngặt vẫn kết nối được.',
    relayMissing: '⚠ Hiện chỉ có kết nối trực tiếp. Hãy thêm TURN relay trước khi chơi xuyên quốc gia để ổn định.',
    retryingOnline: 'Đường đầu tiên bị chặn — đang thử một đường khác…',
    connectedDirect: 'Đã kết nối trực tiếp qua thế giới 💞', connectedRelay: 'Đã kết nối qua relay toàn cầu 💞',
    paused: 'Tạm dừng 🌙', resume: 'Chơi tiếp', restart: 'Chơi lại chương', backToMenu: 'Về menu',
    continue: 'Tiếp tục ➜', keepGoing: 'Giữ mãi trong tim 💗',
    memoryTitle: 'Một ký ức ấm áp trở về…',
    levelClear: 'Hoàn thành chương! 🎆', nextChapter: 'Chương tiếp ➜',
    statTime: 'Thời gian', statCharms: 'Bùa may mắn', statLove: 'Tình yêu lớn thêm', statMemories: 'Ký ức',
    locked: 'Chưa mở', unlockedAt: 'bùa để mở khóa', weddingNeed: 'Hoàn thành cốt truyện để mở',
    charmsOwned: 'Bùa đã thu thập', rotate: 'Hãy xoay ngang điện thoại nhé 💛',
    touchMoveLeft: 'Đi sang trái', touchMoveRight: 'Đi sang phải', touchJump: 'Nhảy',
    touchWind: 'Gió', touchShield: 'Khiên', touchLight: 'Ánh sáng', touchLotus: 'Hoa sen',
    touchHands: 'Nắm tay', touchSwitch: 'Đổi vai', touchHeart: 'Gửi biểu tượng tim', touchSpecial: 'Tuyệt kỹ Nón Lá',
    touchGuide: 'Bên trái: kéo để đi. Chạm △ Nón Lá khi thanh vàng đầy. 💗 chỉ là biểu tượng thân thiện.',
    spiritMonster: 'Linh hồn lạc lối', spiritMagic: 'linh thuật', hatMastery: 'Tinh thông Nón Lá', bossPhase: 'Giai đoạn',
    hatSkillName1: 'Viền Vàng', hatSkillName2: 'Trăng Sông Hồi Quy', hatSkillName3: 'Vòng Gió Tre',
    hatSkillName4: 'Hào Quang Hoa Sen', hatSkillName5: 'Ấn Rồng Trống Đồng', hatSkillName6: 'Bão Song Tinh',
    guardianName1: 'Hộ Vệ Hẻm Đèn', guardianName2: 'Hộ Vệ Thủy Nguyệt', guardianName3: 'Hộ Vệ Mặt Nạ Tre',
    guardianName4: 'Hộ Vệ Sương Sen', guardianName5: 'Hộ Vệ Trống Đồng', guardianName6: 'Hộ Vệ Cổng Lễ Hội',
    bossName1: 'Bướm Đèn Tro Tàn', bossName2: 'Giao Long Thủy Nguyệt', bossName3: 'Bóng Tre Ngàn Năm',
    bossName4: 'Hạc Sen Nguyệt Thực', bossName5: 'Vệ Thần Trống Đồng Sa Ngã', bossName6: 'Bão Rỗng Hắc Phong',
    guardianAwakes: '⚔ {NAME} chặn đường — dùng Gió, Ánh sáng và phản lại phép!',
    bossAwakes: '👑 {NAME} thức tỉnh với ba loại phép!', guardianPurified: 'Đã thanh tẩy hộ vệ — ánh sáng hòa vào nón lá.',
    bossPurified: '✨ {NAME} đã được giải thoát khỏi gió lạnh!', hatMasteryUp: '△ Tinh thông Nón Lá {RANK} — mở khóa {SKILL}!',
    bossCastVolley: 'Quạt lửa lang thang', bossCastWave: 'Linh lực chạy dọc mặt đất',
    bossCastRain: 'Ấn trời rơi — tiếp tục di chuyển!', bossCastRing: 'Vòng phép tám hướng',
    questGuardian: 'Nhiệm vụ: thanh tẩy {NAME}', questBoss: 'Nhiệm vụ: đánh bại {NAME}', questLanterns: 'Nhiệm vụ: thắp những đèn chính còn lại',
    questExit: 'Hoàn thành: cùng nhau đến cổng', bossBlocksExit: 'Trùm chương vẫn đang canh giữ lối đi!',
    hatNotReady: 'Phép Nón Lá đang hồi phục…', playerRevived: 'Dũng khí đèn lồng hồi phục tại điểm lưu 💛',
    lvName1: 'Phố Đèn Lồng Hội An', lvName2: 'Thuyền Trăng Sông Thu Bồn', lvName3: 'Làng Cầu Tre',
    lvName4: 'Lời Hứa Hồ Sen', lvName5: 'Cổ Tự Đèn Lồng', lvName6: 'Đại Lễ Hội Đèn Lồng',
    costume_classic: 'Áo dài lễ hội cổ điển', costume_flower: 'Nón lá cài hoa', costume_lantern: 'Đèn lồng Hội An',
    costume_lotus: 'Hồ sen', costume_tet: 'Tết sum vầy', costume_bamboo: 'Làng tre',
    costume_wedding: 'Áo dài cưới', costume_modern: 'Đôi bạn hiện đại',
    loveLv0: 'Tia lửa đầu tiên', loveLv1: 'Tay trong tay', loveLv2: 'Chung ánh đèn', loveLv3: 'Song nón lá hộ thể',
    loveLv4: 'Cú nhảy gió yêu', loveLv5: 'Phúc lành lễ hội',
    loveUp1: '💞 Tình yêu cấp 1 — Tay trong tay! Nắm tay để an toàn trong bóng tối.',
    loveUp2: '💞 Tình yêu cấp 2 — Chung ánh đèn! Ánh sáng của hai bạn lớn hơn khi ở gần nhau.',
    loveUp3: '💞 Tình yêu cấp 3 — Song nón lá hộ thể! Khiên che chở cả hai, mạnh mẽ hơn.',
    loveUp4: '💞 Tình yêu cấp 4 — Cú nhảy gió yêu! Nắm tay và nhảy để bay lên cùng nhau.',
    loveUp5: '💞 Tình yêu cấp 5 — Phúc lành lễ hội! Đèn lồng quanh bạn tự tỏa sáng.',
    tipMove: 'Di chuyển bằng phím — nhớ đi cạnh nhau nhé!',
    tipJump: 'Nhảy qua mấy thùng gỗ nào.', tipLight: 'Cô gái: nhấn phép gần đèn lồng để thắp sáng ✨',
    tipWind: 'Chàng trai: nhấn phép để thổi gió — đẩy đèn lồng treo xuống thấp, rồi cô gái thắp nó!',
    tipPush: 'Chàng trai: đi vào thùng gỗ để đẩy nó lên bệ vàng.',
    tipLotus: 'Cô gái: dùng phép thứ 2 gần mặt nước lấp lánh để mọc bệ hoa sen 🌸',
    tipHands: 'Đứng gần nhau và nhấn phím nắm tay dưới cổng nhé 🤝',
    tipMemory: 'Hãy đứng cùng nhau dưới chiếc đèn lồng lớn…',
    tipBridge: 'Chàng trai: đứng lên dấu gió và GIỮ phép để tạo cầu gió. Cô gái: băng qua và đứng lên bệ!',
    tipShield: 'Chàng trai: GIỮ phép thứ 2 để che chắn cả hai khỏi gió và bóng tối 🛡',
    tipBoat: 'Lên thuyền nào! Chàng trai: thổi gió để thuyền trôi ⛵ Cô gái: thắp nến nổi để mở cổng dây.',
    tipHeal: 'Cô gái: ánh sáng của nàng chữa lành mọi thứ — đèn lồng, cây cầu, tượng đá 💗',
    tipChannel: 'Đứng lên hai bệ đá và CẢ HAI cùng GIỮ phép để đánh thức Đại Đèn Lồng!',
    tipTogetherGate: 'Có những cánh cổng chỉ mở khi hai bạn đứng thật gần nhau 💑',
    promptLight: 'Ánh sáng ✨', promptWind: 'Gió 🌀', promptLotus: 'Hoa sen 🌸', promptShield: 'Khiên 🛡',
    promptHands: 'Nắm tay 🤝', promptRelease: 'Buông tay', promptSwap: 'Đổi vai', promptChannel: 'GIỮ để truyền phép ✨',
    exitNeed: 'Hãy thắp đủ đèn lồng chính trước nhé! 🏮',
    exitReady: 'Đường đã mở — cùng nhau đi tiếp nào! ➜',
    fellWater: 'Ùm! 💦', partnerSaved: 'đã cứu bạn! +💗',
    helpKeys: `<h5>🕹 Bàn phím — Người chơi 1 ({BOY})</h5>
<p><span class="kbd">A</span><span class="kbd">D</span> di chuyển · <span class="kbd">W</span> nhảy · <span class="kbd">E</span> Đao Gió · <span class="kbd">Q</span> giữ Khiên · <span class="kbd">R</span> tuyệt kỹ Nón Lá</p>
<h5>🕹 Bàn phím — Người chơi 2 ({GIRL})</h5>
<p><span class="kbd">◀</span><span class="kbd">▶</span> di chuyển · <span class="kbd">▲</span> nhảy · <span class="kbd">O</span> Xung Ánh Sáng · <span class="kbd">P</span> Hoa Sen · <span class="kbd">I</span> tuyệt kỹ Nón Lá</p>
<h5>💞 Cùng nhau</h5>
<p><span class="kbd">H</span> nắm tay (đứng gần) · <span class="kbd">Tab</span> đổi vai (chơi một mình) · <span class="kbd">1</span><span class="kbd">2</span><span class="kbd">3</span> biểu cảm · <span class="kbd">Esc</span> tạm dừng</p>
<h5>🌀 {BOY}</h5><p>Gió gây sát thương và đẩy linh hồn, đồng thời đẩy đèn lồng, thuyền và thùng gỗ. Giữ Khiên để bảo vệ cả hai và phản phép trùm.</p>
<h5>✨ {GIRL}</h5><p>Ánh sáng gây sát thương bóng tối, thắp đèn và chữa lành đồ vỡ. Hoa Sen tạo bệ an toàn và hào quang soi rõ bóng tối.</p>
<h5>△ Tinh thông Nón Lá</h5><p>Thanh tẩy linh hồn giúp tuyệt kỹ Nón Lá phát triển qua sáu cấp lấy cảm hứng Việt Nam. Chỉ dùng được khi thanh năng lượng vàng đã đầy.</p>
<h5>👑 Nhiệm vụ chương</h5><p>Thắp đèn chính, thanh tẩy hộ vệ rồi đánh bại trùm chương. Hãy né vùng cảnh báo, dùng Khiên phản phép, sau đó đáp trả bằng Gió, Ánh sáng và Nón Lá.</p>
<h5>📱 Điện thoại & cảm ứng</h5>
<p>Đặt ngón tay ở bất kỳ đâu bên trái, kéo để đi và nhấc tay để dừng. <span class="kbd">↑</span> để nhảy. Các nút phép đổi theo nhân vật. Chạm <span class="kbd">△</span> để dùng Nón Lá khi thanh vàng đầy.</p>
<p><span class="kbd">🤝</span> bật/tắt nắm tay khi đứng gần nhau. <span class="kbd">🔄</span> đổi nhân vật khi chơi một mình. <span class="kbd">💗</span> chỉ gửi biểu tượng trái tim thân thiện — không tăng Tình Yêu.</p>
<p>Hai người chơi trên điện thoại hãy dùng “Chơi Online cùng nhau”.</p>
<h5>💗 Biểu tượng Tình Yêu</h5><p>Trái tim trên chiếc đèn giữa màn hình là Thang Tình Yêu. Hãy giúp nhau, thắp đèn chính và nhặt đủ hai đèn tim cùng cặp để tăng thang; mỗi cặp được +5 Tình Yêu. Năm cấp sẽ mở lợi ích phối hợp như nắm tay an toàn hơn, ánh sáng chung sáng hơn, khiên mạnh hơn và cú nhảy gió cùng nhau.</p>`,
    namesTitle: '✏️ Tên của hai bạn',
    intro: [
      'Ngày xưa, ở phố cổ Hội An,\nmỗi chiếc đèn lồng giữ một ngọn lửa ký ức nhỏ ấm áp. 🏮',
      'Nhưng một đêm nọ, cơn gió lạ lạnh lẽo quét qua phố…\ncuốn hết mọi ngọn lửa bay đi xa.\nPhố mất màu. Dòng sông quên tiếng hát.',
      '{BOY} và {GIRL} — hai trái tim trẻ với nón lá nhiệm màu —\nđã hứa với nhau một điều:\n“Cùng nhau, mình sẽ đưa ánh sáng về nhà.” 💞',
    ],
    lvIntro1: 'Chương 1 — Phố Đèn Lồng\nThắp lại đèn, học phép Nón Lá, thanh tẩy hộ vệ con hẻm rồi đối đầu Bướm Đèn Tro Tàn.',
    lvIntro2: 'Chương 2 — Sông Trăng\nChèo qua sông Thu Bồn, thắp nến nổi và làm chủ Trăng Sông Hồi Quy trước khi giao long thức giấc.',
    lvIntro3: 'Chương 3 — Làng Tre\nSửa lại ngôi làng, bảo vệ mọi người và để tre dạy chiếc nón xoay thành vòng gió mạnh hơn.',
    lvIntro4: 'Chương 4 — Hồ Sen\nBăng qua mặt nước trăng, che chắn nhau khỏi chim bóng tối và thách đấu Hạc Sen Nguyệt Thực.',
    lvIntro5: 'Chương 5 — Cổ Tự\nĐọc những ấn trống đồng, phối hợp Gió với Ánh sáng và giải thoát vệ thần cổ tự.',
    lvIntro6: 'Chương cuối — Đại Lễ Hội Đèn Lồng\nMọi kỹ năng đều dẫn đến đây. Thanh tẩy hộ vệ cuối và sống sót qua ba giai đoạn của Bão Rỗng Hắc Phong.',
    memories: [
      'Lần đầu mình gặp nhau, mưa rơi trên cây cầu cổ.\nAnh che nón lá cho em,\nrồi cả hai vẫn ướt hết. Mình cười mãi thôi. ☔',
      'Anh mua hai tô cao lầu,\nrồi nhường em hết phần da heo giòn.\nEm biết ngay từ lúc đó. 🍜',
      'Mình thả đèn hoa đăng trên sông,\nanh thì thầm một điều ước.\nAnh chẳng bao giờ nói đó là gì… nhưng anh nhìn em cười.',
      'Khi em sợ cơn bão,\nanh nắm tay em và nói:\n“Gió chỉ là bầu trời đang thở thôi. Có anh đây.” 🌬',
      'Mình trồng một nhánh sen bé xíu trong chậu.\nAi cũng bảo nó sẽ không nở hoa.\nNó đã nở. 🌸',
      'Bà nói: “Tình yêu không phải ngọn lửa lớn, các con à.\nNó là chiếc đèn lồng — phải chăm mỗi ngày,\nrồi nó sẽ soi sáng mọi con đường.” 🏮',
      'Anh nhảy múa ở lễ hội, vụng ơi là vụng.\nVậy mà em yêu từng giây phút ấy. 🎶',
      'Mình đứng trên cầu và hứa:\ndù gió cuốn về đâu,\nmình sẽ cùng nhau thổi ngược lại. 💞',
    ],
    ending: [
      'Đại Đèn Lồng thở trở lại…\nánh sáng chảy như dòng sông vàng qua từng con phố. 🏮',
      'Mỗi chiếc đèn nhớ lại ngọn lửa của mình.\nMỗi ngôi nhà nhớ lại màu áo cũ.\nPhố cổ nhớ lại tiếng hát.',
      'Và trên cây cầu xưa, dưới bầu trời hoa đăng,\nhai chiếc nón lá khẽ tựa vào nhau.',
      'Tình yêu không phải một người hùng mạnh mẽ.\nLà hai trái tim, cùng giữ một ánh đèn. 💞\n\n— Hết —\n\nCảm ơn hai bạn đã chơi, và đã chăm chiếc đèn lồng của mình.',
    ],
    endingUnlock: '👘 Đã mở khóa áo dài cưới trong Tủ đồ!',
    villager: 'Cảm ơn hai ánh sáng nhỏ! 💛',
    stat_lanterns: 'đèn lồng',
  },
};

/* ---------------- save data ---------------- */
NLA.save = {
  data: null,
  load() {
    try { this.data = JSON.parse(localStorage.getItem('nonla_save')) || null; } catch (e) { this.data = null; }
    if (!this.data) this.data = {};
    const d = this.data;
    if (typeof d.unlocked !== 'number') d.unlocked = 1;
    if (typeof d.charms !== 'number') d.charms = 0;
    if (typeof d.lang !== 'string') d.lang = 'en';
    if (typeof d.music !== 'boolean') d.music = true;
    if (typeof d.sfx !== 'boolean') d.sfx = true;
    if (typeof d.costumeBoy !== 'string') d.costumeBoy = 'classic';
    if (typeof d.costumeGirl !== 'string') d.costumeGirl = 'classic';
    if (typeof d.finished !== 'boolean') d.finished = false;
    if (typeof d.hatXP !== 'number' || d.hatXP < 0) d.hatXP = 0;
    if (typeof d.nameBoy !== 'string' || !d.nameBoy.trim()) d.nameBoy = 'Joku';
    if (typeof d.nameGirl !== 'string' || !d.nameGirl.trim()) d.nameGirl = 'Jolie';
    return d;
  },
  store() { try { localStorage.setItem('nonla_save', JSON.stringify(this.data)); } catch (e) {} },
};

NLA.lang = () => NLA.I18N[NLA.save.data && NLA.save.data.lang || 'en'];

NLA.hatRank = () => {
  const xp = Math.max(0, Number(NLA.save.data && NLA.save.data.hatXP) || 0);
  let rank = 1;
  for (let i = 1; i < NLA.CONST.HAT_XP_LEVELS.length; i++) {
    if (xp >= NLA.CONST.HAT_XP_LEVELS[i]) rank = i + 1;
  }
  return Math.min(6, rank);
};

/* character names (default Joku & Jolie, players can rename) */
NLA.name = (who) => {
  const d = NLA.save.data || {};
  return who === 'boy' ? (d.nameBoy || 'Joku') : (d.nameGirl || 'Jolie');
};

/* replace {BOY}/{GIRL} placeholders with the chosen names */
NLA.fmt = (v) => {
  if (typeof v === 'string') return v.replace(/\{BOY\}/g, NLA.name('boy')).replace(/\{GIRL\}/g, NLA.name('girl'));
  if (Array.isArray(v)) return v.map(NLA.fmt);
  return v;
};
NLA.t = (key) => {
  const raw = NLA.lang()[key] !== undefined ? NLA.lang()[key] : (NLA.I18N.en[key] !== undefined ? NLA.I18N.en[key] : key);
  return NLA.fmt(raw);
};

NLA.costumeFor = (who) => {
  const id = who === 'boy' ? NLA.save.data.costumeBoy : NLA.save.data.costumeGirl;
  const c = NLA.COSTUMES.find(c => c.id === id) || NLA.COSTUMES[0];
  return c[who];
};

/* ---------------- tiny utils ---------------- */
NLA.util = {
  clamp: (v, a, b) => v < a ? a : (v > b ? b : v),
  lerp: (a, b, t) => a + (b - a) * t,
  dist: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
  rand: (a, b) => a + Math.random() * (b - a),
  irand: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
  pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
  /* deterministic pseudo-random from seed (for background variety) */
  seeded(seed) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; },
  ease: (t) => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  fmtTime(sec) { const m = Math.floor(sec / 60), s = Math.floor(sec % 60); return m + ':' + String(s).padStart(2, '0'); },
};
