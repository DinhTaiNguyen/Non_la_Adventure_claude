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
};

/* love gain amounts */
NLA.LOVE = {
  lantern: 4, puzzle: 6, memory: 10, checkpoint: 8,
  save: 6, heartPair: 5, assist: 2, dispel: 1,
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
    pickChar: 'Choose your character', boyDesc: 'Wind · Shield · Strength', girlDesc: 'Light · Lotus · Healing',
    soloHint: 'Your partner follows you — press Tab / 🔄 to swap anytime.',
    chooseLevel: 'Choose a chapter',
    onlineTitle: 'Play Together Online 💞',
    onlineHint: 'One of you creates a room, the other joins with the 4-letter code. Works on phones and computers, anywhere in the world!',
    onlinePickHint: 'Pick who YOU play — your partner gets the other.',
    hostGame: 'Create a room 💌', joinGame: 'Join', shareCode: 'Share this code with your love:',
    connecting: 'Lighting the connection lantern…', waitingPartner: 'Waiting for your partner to join…',
    partnerJoined: 'Your partner is here! 💗 Starting…', joinFail: 'Could not find that room. Check the code?',
    netLost: 'Connection drifted away 🌬 — partner is now guided by lantern spirits.',
    needPeer: 'Online play needs internet (PeerJS could not load).',
    paused: 'Paused 🌙', resume: 'Resume', restart: 'Restart chapter', backToMenu: 'Back to menu',
    continue: 'Continue ➜', keepGoing: 'Keep it in our hearts 💗',
    memoryTitle: 'A warm memory returns…',
    levelClear: 'Chapter complete! 🎆', nextChapter: 'Next chapter ➜',
    statTime: 'Time', statCharms: 'Charms found', statLove: 'Love grown', statMemories: 'Memories',
    locked: 'Locked', unlockedAt: 'charms to unlock', weddingNeed: 'Finish the story to unlock',
    charmsOwned: 'Charms collected', rotate: 'Please rotate your phone to landscape 💛',
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
<p><span class="kbd">A</span><span class="kbd">D</span> move · <span class="kbd">W</span> jump · <span class="kbd">E</span> wind power · <span class="kbd">Q</span> hold = shield</p>
<h5>🕹 Keyboard — Player 2 (Girl · {GIRL})</h5>
<p><span class="kbd">◀</span><span class="kbd">▶</span> move · <span class="kbd">▲</span> jump · <span class="kbd">O</span> light power · <span class="kbd">P</span> lotus platform</p>
<h5>💞 Together</h5>
<p><span class="kbd">H</span> hold hands (stand close) · <span class="kbd">Tab</span> swap character (solo) · <span class="kbd">1</span><span class="kbd">2</span><span class="kbd">3</span> emotes · <span class="kbd">Esc</span> pause</p>
<h5>🌀 {BOY} (boy)</h5><p>Wind moves lanterns, boats and crates. He can push heavy things, shield the couple, and channel a wind bridge on wind marks.</p>
<h5>✨ {GIRL} (girl)</h5><p>Light wakes lanterns and opens gates. She heals broken things, grows lotus platforms on sparkling water, and her aura reveals the dark.</p>
<h5>🏮 Goal</h5><p>Light the key lanterns of each chapter, grow your Love Meter by helping each other, then reach the festival arch together.</p>
<h5>📱 Phones</h5><p>Touch buttons appear automatically. For two players use “Play Online Together”.</p>`,
    namesTitle: '✏️ Your names',
    intro: [
      'Long ago, in the ancient town of Hội An,\nevery lantern held a tiny warm flame of memory. 🏮',
      'But one night, a strange cold wind swept the town…\nand carried every flame far away.\nThe town lost its color. The river lost its song.',
      '{BOY} and {GIRL} — two young hearts with magical nón lá —\npromised each other one thing:\n“Together, we will bring the light home.” 💞',
    ],
    lvIntro1: 'Chapter 1 — Lantern Street\nThe old yellow houses sleep in grey. Let’s wake the first lanterns… together.',
    lvIntro2: 'Chapter 2 — Moon River\nA little wooden boat waits on the Thu Bồn river. The moon will watch over us.',
    lvIntro3: 'Chapter 3 — Bamboo Village\nThe village is preparing the festival, but the bridges are broken. Let’s help everyone.',
    lvIntro4: 'Chapter 4 — Lotus Lake\nUnder the biggest moon, the lotus lake sleeps. Shadow birds circle above… stay close to me.',
    lvIntro5: 'Chapter 5 — Ancient Temple\nThe old temple keeps the deepest flame. Its gates only trust those who trust each other.',
    lvIntro6: 'Final Chapter — The Great Lantern Festival\nThe whole town is dark. One giant lantern remains. Everything we learned… it was for tonight.',
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
    pickChar: 'Chọn nhân vật của bạn', boyDesc: 'Gió · Khiên · Sức mạnh', girlDesc: 'Ánh sáng · Hoa sen · Chữa lành',
    soloHint: 'Người ấy sẽ đi theo bạn — nhấn Tab / 🔄 để đổi vai bất cứ lúc nào.',
    chooseLevel: 'Chọn chương',
    onlineTitle: 'Chơi Online cùng nhau 💞',
    onlineHint: 'Một người tạo phòng, người kia nhập mã 4 chữ để vào. Chơi được trên điện thoại và máy tính, ở bất cứ đâu!',
    onlinePickHint: 'Chọn nhân vật BẠN muốn chơi — người ấy sẽ nhận nhân vật còn lại.',
    hostGame: 'Tạo phòng 💌', joinGame: 'Vào', shareCode: 'Gửi mã này cho người ấy:',
    connecting: 'Đang thắp đèn kết nối…', waitingPartner: 'Đang chờ người ấy vào phòng…',
    partnerJoined: 'Người ấy đến rồi! 💗 Bắt đầu…', joinFail: 'Không tìm thấy phòng. Kiểm tra lại mã nhé?',
    netLost: 'Kết nối bay theo gió mất rồi 🌬 — đèn lồng sẽ dẫn lối cho người ấy.',
    needPeer: 'Chơi online cần Internet (không tải được PeerJS).',
    paused: 'Tạm dừng 🌙', resume: 'Chơi tiếp', restart: 'Chơi lại chương', backToMenu: 'Về menu',
    continue: 'Tiếp tục ➜', keepGoing: 'Giữ mãi trong tim 💗',
    memoryTitle: 'Một ký ức ấm áp trở về…',
    levelClear: 'Hoàn thành chương! 🎆', nextChapter: 'Chương tiếp ➜',
    statTime: 'Thời gian', statCharms: 'Bùa may mắn', statLove: 'Tình yêu lớn thêm', statMemories: 'Ký ức',
    locked: 'Chưa mở', unlockedAt: 'bùa để mở khóa', weddingNeed: 'Hoàn thành cốt truyện để mở',
    charmsOwned: 'Bùa đã thu thập', rotate: 'Hãy xoay ngang điện thoại nhé 💛',
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
<p><span class="kbd">A</span><span class="kbd">D</span> di chuyển · <span class="kbd">W</span> nhảy · <span class="kbd">E</span> phép gió · <span class="kbd">Q</span> giữ = khiên</p>
<h5>🕹 Bàn phím — Người chơi 2 ({GIRL})</h5>
<p><span class="kbd">◀</span><span class="kbd">▶</span> di chuyển · <span class="kbd">▲</span> nhảy · <span class="kbd">O</span> phép ánh sáng · <span class="kbd">P</span> bệ hoa sen</p>
<h5>💞 Cùng nhau</h5>
<p><span class="kbd">H</span> nắm tay (đứng gần) · <span class="kbd">Tab</span> đổi vai (chơi một mình) · <span class="kbd">1</span><span class="kbd">2</span><span class="kbd">3</span> biểu cảm · <span class="kbd">Esc</span> tạm dừng</p>
<h5>🌀 {BOY}</h5><p>Gió đẩy đèn lồng, thuyền và thùng gỗ. Chàng đẩy được vật nặng, che khiên cho cả hai, và tạo cầu gió trên dấu gió.</p>
<h5>✨ {GIRL}</h5><p>Ánh sáng đánh thức đèn lồng và mở cổng. Nàng chữa lành đồ vỡ, mọc bệ hoa sen trên nước lấp lánh, và hào quang soi rõ bóng tối.</p>
<h5>🏮 Mục tiêu</h5><p>Thắp các đèn lồng chính của mỗi chương, nuôi lớn Thang Tình Yêu bằng cách giúp đỡ nhau, rồi cùng đến cổng lễ hội.</p>
<h5>📱 Điện thoại</h5><p>Nút cảm ứng tự hiện. Hai người chơi hãy dùng “Chơi Online cùng nhau”.</p>`,
    namesTitle: '✏️ Tên của hai bạn',
    intro: [
      'Ngày xưa, ở phố cổ Hội An,\nmỗi chiếc đèn lồng giữ một ngọn lửa ký ức nhỏ ấm áp. 🏮',
      'Nhưng một đêm nọ, cơn gió lạ lạnh lẽo quét qua phố…\ncuốn hết mọi ngọn lửa bay đi xa.\nPhố mất màu. Dòng sông quên tiếng hát.',
      '{BOY} và {GIRL} — hai trái tim trẻ với nón lá nhiệm màu —\nđã hứa với nhau một điều:\n“Cùng nhau, mình sẽ đưa ánh sáng về nhà.” 💞',
    ],
    lvIntro1: 'Chương 1 — Phố Đèn Lồng\nNhững ngôi nhà vàng cổ đang ngủ trong màu xám. Cùng nhau thắp những chiếc đèn đầu tiên nhé.',
    lvIntro2: 'Chương 2 — Sông Trăng\nMột chiếc thuyền gỗ nhỏ đợi trên sông Thu Bồn. Ánh trăng sẽ dõi theo đôi mình.',
    lvIntro3: 'Chương 3 — Làng Tre\nLàng đang chuẩn bị lễ hội, nhưng những cây cầu đã gãy. Mình giúp mọi người nào.',
    lvIntro4: 'Chương 4 — Hồ Sen\nDưới vầng trăng lớn nhất, hồ sen đang ngủ. Chim bóng tối lượn trên cao… ở gần em nhé.',
    lvIntro5: 'Chương 5 — Cổ Tự\nNgôi chùa cổ giữ ngọn lửa sâu thẳm nhất. Cổng chùa chỉ tin những ai biết tin nhau.',
    lvIntro6: 'Chương cuối — Đại Lễ Hội Đèn Lồng\nCả phố chìm trong bóng tối. Chỉ còn một chiếc đèn lồng khổng lồ. Mọi điều mình học… là để dành cho đêm nay.',
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
    if (typeof d.nameBoy !== 'string' || !d.nameBoy.trim()) d.nameBoy = 'Joku';
    if (typeof d.nameGirl !== 'string' || !d.nameGirl.trim()) d.nameGirl = 'Jolie';
    return d;
  },
  store() { try { localStorage.setItem('nonla_save', JSON.stringify(this.data)); } catch (e) {} },
};

NLA.lang = () => NLA.I18N[NLA.save.data && NLA.save.data.lang || 'en'];

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
