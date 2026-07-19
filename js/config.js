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
  LOVE_BURST_COST: 35,
  LOVE_BURST_RADIUS: 410,
  REVIVE_DIST: 94,
  REVIVE_TIME: 1.45,
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
    loveBurstName: 'TWIN LANTERN', loveBurstHint: 'Spend 35 Love for a powerful two-hero attack',
    loveReady: 'READY · F', loveBurstCast: '💞 Twin Lantern Resonance! Love becomes shared power.',
    loveBurstNeedCharge: 'Build {LOVE} more Love to use Twin Lantern.', loveBurstTooFar: 'Move closer to your partner first.',
    loveBurstNeedPartner: 'Revive your partner before using the collaboration move.',
    partnerDown: 'Your partner is down — stand close and HOLD 💞 (H) to revive!',
    partnerRescued: 'Partner rescued! Two Hearts restored · +6 Love',
    rescuePrompt: 'HOLD H / 💞 TO RESCUE', reviving: 'RESTORING THEIR LIGHT…',
    progressSaved: 'Journey saved — boat and puzzle positions remembered.',
    checkpointRestored: 'Both heroes restored at the last safe journey point.',
    playSolo: 'Play Solo', local2p: '2 Players · One Keyboard', online: 'Play Online Together 💞',
    wardrobe: 'Wardrobe', howto: 'How to Play', back: 'Back', select: 'Select',
    menuFoot: 'A cozy Vietnamese fairytale about love & light ✨',
    pickChar: 'Choose your character', boyDesc: 'Wind blade · Reflecting shield · Nón Lá magic', girlDesc: 'Light pulse · Lotus healing · Nón Lá magic',
    soloHint: 'Your partner follows you — press Tab / 🔄 to swap anytime.',
    chooseLevel: 'Choose a chapter', allChaptersOpen: 'Every chapter is open — choose the journey you want tonight.',
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
    touchHands: 'Hold to revive partner', touchSwitch: 'Switch character', touchHeart: 'Send a heart emote', touchSpecial: 'Nón Lá special',
    touchGuide: 'Slide anywhere on the left to walk. HOLD 💞 beside a fallen partner to revive. Use TWIN LANTERN at 35 Love.',
    spiritMonster: 'Restless spirit', spiritMagic: 'spirit magic', hatMastery: 'Nón Lá Mastery', bossPhase: 'Phase',
    hatSkillName1: 'Golden Rim', hatSkillName2: 'Moon-River Return', hatSkillName3: 'Thánh Gióng Bamboo Gale',
    hatSkillName4: 'Lotus Halo', hatSkillName5: 'Bronze Dragon Seal', hatSkillName6: 'Twin-Star Tempest',
    guardianName1: 'Lantern Alley Guardian', guardianName2: 'Moonwater Guardian', guardianName3: 'Bamboo Mask Guardian',
    guardianName4: 'Lotus Mist Guardian', guardianName5: 'Shadow of Occupation', guardianName6: 'Spectral Yuan–Mongol Vanguard',
    bossName1: 'Ashen Lantern Moth', bossName2: 'Moonwater Serpent', bossName3: 'Ancient Bamboo Shade',
    bossName4: 'Lotus Eclipse Crane', bossName5: 'Corrupted Bronze Sentinel', bossName6: 'The Hollow Monsoon',
    guardianAwakes: '⚔ {NAME} blocks the road — use Wind, Light and reflected magic!',
    bossAwakes: '👑 {NAME} awakens with three forms of magic!', guardianPurified: 'Guardian purified — its light joins your nón lá.',
    bossPurified: '✨ {NAME} is free from the cold wind!', hatMasteryUp: '△ Nón Lá Mastery {RANK} — {SKILL} unlocked!',
    bossCastVolley: 'Fan of wandering flames', bossCastWave: 'Earth-running spirit wave',
    bossCastRain: 'Falling sky seals — keep moving!', bossCastRing: 'Eight-direction magic ring',
    questGuardian: 'Quest: purify {NAME}', questBoss: 'Quest: defeat {NAME}', questLanterns: 'Quest: light the remaining key lanterns',
    questExit: 'Quest complete: reach the arch together', bossBlocksExit: 'The chapter boss still guards the way!',
    questChapter1: 'Quest: relight the craft street · purify {NAME}',
    questChapter2: 'Quest: guide the moon boat · purify {NAME}',
    questChapter3: 'Quest: protect rice and bamboo · purify {NAME}',
    questChapter4: 'Quest: keep the lotus promise · purify {NAME}',
    questChapter5: 'Quest: awaken the bronze memory · purify {NAME}',
    questChapter6: 'Quest: unite every lantern · purify {NAME}',
    questStart1: 'SILK & FLAME 1/4 · Wake the first craft lantern with Light',
    questExplore1: 'SILK & FLAME 2/4 · Solve Wind, crate and healing mechanisms · {LIT}/{TOTAL} lights',
    questGuardian1: 'SILK & FLAME 3/4 · Purify {NAME} · reflect its ember fan',
    questBoss1: 'SILK & FLAME 4/4 · Calm {NAME} · dodge ash, answer with Nón Lá',
    questStart2: 'RIVER RHYTHM 1/4 · Board together · Wind sails, Light wakes hoa đăng',
    questExplore2: 'RIVER RHYTHM 2/4 · Light each flotilla and sail through the rope gates · {LIT}/{TOTAL} beacons',
    questGuardian2: 'RIVER RHYTHM 3/4 · Purify {NAME} · shield the moon-wave',
    questBoss2: 'RIVER RHYTHM 4/4 · Read {NAME}’s water rings and return their light',
    questStart3: 'VILLAGE PROMISE 1/4 · Heal the first bridge and greet the buffalo-rice village',
    questExplore3: 'VILLAGE PROMISE 2/4 · Grow lotus paths, protect bamboo and find keepsakes · {LIT}/{TOTAL} lights',
    questGuardian3: 'VILLAGE PROMISE 3/4 · Purify {NAME} · move between bamboo rain',
    questBoss3: 'VILLAGE PROMISE 4/4 · Face {NAME} with Thánh Gióng’s everyday courage',
    questStart4: 'LOTUS OATH 1/4 · Grow a safe lotus path and shield the first moon gust',
    questExplore4: 'LOTUS OATH 2/4 · Cross the lake and reunite heart-lantern pairs · {LIT}/{TOTAL} lights',
    questGuardian4: 'LOTUS OATH 3/4 · Purify {NAME} · reflect the feather crescent',
    questBoss4: 'LOTUS OATH 4/4 · Follow the safe gaps in {NAME}’s eclipse magic',
    questStart5: 'ANCESTRAL ECHO 1/4 · Wake the first bronze brazier with Light',
    questExplore5: 'ANCESTRAL ECHO 2/4 · Solve the seals, preserve the jars and reach the upper plate · {LIT}/{TOTAL}',
    questGuardian5: 'ANCESTRAL ECHO 3/4 · Purify {NAME} without turning memory into hatred',
    questBoss5: 'ANCESTRAL ECHO 4/4 · Read {NAME}’s drum rings, then break the cold seal',
    questStart6: 'ONE FESTIVAL 1/4 · Heal the first lantern and carry its light forward',
    questExplore6: 'ONE FESTIVAL 2/4 · Unite village lights and rebuild the final wind bridge · {LIT}/{TOTAL}',
    questGuardian6: 'ONE FESTIVAL 3/4 · Purify {NAME} · shield the monsoon formation',
    questBoss6: 'ONE FESTIVAL 4/4 · Combine Wind, Light, Shield and Nón Lá against {NAME}',
    questFinalChannel: 'FESTIVAL BLESSING · Stand on both pedestals and hold both powers',
    itemCodexKicker: 'FIELD CODEX · PICKUP BENEFITS', itemCodexTitle: 'Lantern Satchel',
    itemCodexHint: 'Every keepsake grants a different immediate benefit and still counts as a wardrobe charm.',
    returnAdventure: 'Return to adventure',
    itemName_lantern: 'Silk Lantern', itemName_petal: 'Lotus Petal', itemName_leaf: 'Bamboo Leaf',
    itemName_envelope: 'Lucky Envelope', itemName_banhchung: 'Bánh Chưng', itemName_star: 'Star Lantern',
    itemName_hat: 'Nón Lá Token', itemName_candle: 'Hoa Đăng Ward',
    itemBenefit_lantern: '+2 Love · +1 wardrobe charm', itemBenefit_petal: 'Heal the weakest hero · refresh Light if healthy',
    itemBenefit_leaf: 'Recharge Wind Blade and Shield', itemBenefit_envelope: '+3 Love · +1 wardrobe charm',
    itemBenefit_banhchung: 'Restore one Heart to both heroes', itemBenefit_star: 'Restore 18 Nón Lá energy to both',
    itemBenefit_hat: 'Fully charge both Nón Lá energy bars', itemBenefit_candle: 'Two-second spirit ward for both heroes',
    itemUse_lantern: 'Silk Lantern: +2 Love and +1 wardrobe charm.',
    itemUse_petal: 'Lotus Petal: heals the most injured hero or refreshes Light when both are healthy.',
    itemUse_leaf: 'Bamboo Leaf: recharges the Wind Blade and the reflecting shield.',
    itemUse_envelope: 'Lucky Envelope: +3 Love and +1 wardrobe charm.',
    itemUse_banhchung: 'Bánh Chưng: restores one Heart to both heroes.',
    itemUse_star: 'Star Lantern: restores 18 Nón Lá energy to both heroes.',
    itemUse_hat: 'Nón Lá Token: fully restores both Nón Lá energy bars.',
    itemUse_candle: 'Hoa Đăng: grants both heroes a two-second spirit ward.',
    itemGain_lantern: '+2 Love · Silk lantern', itemGain_petal: '+1 Heart · Lotus petal',
    itemGain_leaf: 'Wind + Shield recharged', itemGain_envelope: '+3 Love · Lucky envelope',
    itemGain_banhchung: 'Both heroes healed', itemGain_star: '+18 Nón Lá energy',
    itemGain_hat: 'Nón Lá fully charged', itemGain_candle: 'Spirit ward · 2 seconds',
    bonusLantern: 'Bonus lantern restored! +2 ✨ +1 💗',
    hatNotReady: 'Nón Lá magic is recharging…', playerRevived: 'Lantern courage restored at the checkpoint 💛',
    culture_buffaloRice: '🌾 Buffalo & rice — patient strength and the harvest have sustained village life for generations. Cultural keepsake found!',
    culture_hammock: '🧶 The woven hammock is a quiet place for stories, rest and family memories beneath the bamboo.',
    culture_sandals: '🩴 Dép tổ ong — the familiar honeycomb rubber sandals became a humble symbol of practical everyday life.',
    culture_bauda: '🏺 A Bàu Đá earthenware jar records Bình Định craft and regional heritage. It is a story object, not a drinkable power-up.',
    culture_chuoi: '🍌 This chuối hột infusion jar is preserved as village lore and botanical tradition; the heroes collect its story, not its alcohol.',
    culture_giong: '🎋 The bamboo sings with Thánh Gióng’s legend: courage grows when ordinary things are lifted to protect one’s home. Mastery gained!',
    lvName1: 'Hội An Lantern Street', lvName2: 'Moon River Boat Ride', lvName3: 'Bamboo Bridge Village',
    lvName4: 'Lotus Lake Promise', lvName5: 'Ancient Temple of Lanterns', lvName6: 'The Great Lantern Festival',
    lvValue1: 'Giữ nghề, giữ lửa · Craft & memory', lvValue2: 'Thuận lòng, thuận nước · One rhythm',
    lvValue3: 'Tre Việt kiên cường · Courage', lvValue4: 'Sen thanh, tình bền · Faithfulness',
    lvValue5: 'Uống nước nhớ nguồn · Gratitude', lvValue6: 'Đồng lòng · Stronger together',
    costume_classic: 'Classic Festival Áo Dài', costume_flower: 'Nón Lá Flower', costume_lantern: 'Hội An Lantern',
    costume_lotus: 'Lotus Lake', costume_tet: 'Tết Celebration', costume_bamboo: 'Bamboo Village',
    costume_wedding: 'Vietnamese Wedding', costume_modern: 'Modern Couple',
    loveLv0: 'New Sparks', loveLv1: 'Hand in Hand', loveLv2: 'Shared Lantern Light', loveLv3: 'Double Nón Lá Shield',
    loveLv4: 'Love Wind Jump', loveLv5: 'Festival Blessing',
    loveUp1: '💞 Love Level 1 — Hand in Hand! Walk close together and your bond keeps you safe in the dark.',
    loveUp2: '💞 Love Level 2 — Shared Lantern Light! Your glow is bigger together.',
    loveUp3: '💞 Love Level 3 — Double Nón Lá Shield! The shield covers you both, stronger.',
    loveUp4: '💞 Love Level 4 — Love Wind Jump! Stand together, HOLD 💞 (H) and jump to soar as one.',
    loveUp5: '💞 Love Level 5 — Festival Blessing! Nearby lanterns glow for you.',
    tipMove: 'Walk with the movement keys — stay close together!',
    tipJump: 'Jump over the crates.', tipLight: 'Girl: press her power near the lantern to light it ✨',
    tipWind: 'Boy: press his power to blow wind — swing the hanging lantern low, then the girl lights it!',
    tipPush: 'Boy: walk into the crate to push it onto the golden plate.',
    tipLotus: 'Girl: use her 2nd power near sparkling water to grow a lotus platform 🌸',
    tipHands: 'Walk under the arch close together — your bond blesses the checkpoint 💗',
    tipMemory: 'Stand together under the big lantern…',
    tipBridge: 'Boy: stand on the wind mark & HOLD power to make a wind bridge. Girl: cross & step on the plate!',
    tipShield: 'Boy: HOLD his 2nd power to shield you both from wind and spirits 🛡',
    tipBoat: 'All aboard! Boy: blow wind to sail the boat ⛵ Girl: light the floating candles to open the rope gates.',
    tipHeal: 'Girl: her light heals broken things — lanterns, bridges, statues 💗',
    tipChannel: 'Stand on the two pedestals and BOTH HOLD your powers to wake the Great Lantern!',
    tipTogetherGate: 'Some gates open only when you stand close together 💑',
    promptLight: 'Light ✨', promptWind: 'Wind 🌀', promptLotus: 'Lotus 🌸', promptShield: 'Shield 🛡',
    promptHands: 'Stay close 💗', promptRelease: 'Let go', promptSwap: 'Swap', promptChannel: 'HOLD to channel ✨',
    promptRevive: 'HOLD 💞 to revive your partner',
    exitNeed: 'Light the key lanterns first! 🏮',
    exitReady: 'The way is open — walk on together! ➜',
    fellWater: 'Splash! 💦', partnerSaved: 'saved you! +💗',
    helpKeys: `<h5>🕹 Keyboard — Player 1 (Boy · {BOY})</h5>
<p><span class="kbd">A</span><span class="kbd">D</span> move · <span class="kbd">W</span> jump · <span class="kbd">E</span> Wind Blade · <span class="kbd">Q</span> hold Shield · <span class="kbd">R</span> Nón Lá special</p>
<h5>🕹 Keyboard — Player 2 (Girl · {GIRL})</h5>
<p><span class="kbd">◀</span><span class="kbd">▶</span> move · <span class="kbd">▲</span> jump · <span class="kbd">O</span> Light Pulse · <span class="kbd">P</span> Lotus · <span class="kbd">I</span> Nón Lá special</p>
<h5>💞 Together</h5>
<p>Walk close together and your bond forms by itself 💗 · <span class="kbd">H</span> HOLD beside a fallen partner to revive them; at Love Lv4, HOLD + jump = Love Wind Jump · <span class="kbd">F</span> spend 35 Love on Twin Lantern Resonance · <span class="kbd">Tab</span> swap character (solo) · <span class="kbd">Esc</span> pause</p>
<h5>🌀 {BOY} (boy)</h5><p>Wind damages and pushes spirits, moves lanterns, boats and crates. Hold Shield to protect both players and reflect boss magic back at its caster.</p>
<h5>✨ {GIRL} (girl)</h5><p>Light damages shadow spirits, wakes lanterns and heals broken things. Lotus creates safe platforms while her aura reveals the dark.</p>
<h5>△ Nón Lá Mastery</h5><p>Purifying spirits grows shared Nón Lá Mastery through six Vietnamese-inspired skills. Use the special only when its gold energy bar is ready.</p>
<h5>👑 Chapter quest</h5><p>Light key lanterns, purify the guardian, then defeat the chapter boss. Bosses have multiple phases: dodge marked attacks, reflect magic with Shield, and answer with Wind, Light and Nón Lá skills.</p>
<h5>🌾 Cultural discoveries</h5><p>Walk near glowing village keepsakes to record their short stories and grow Nón Lá Mastery. The 🌾 counter shows how many remain. Historical enemies are magical memory-shadows of past invasion and occupation, not depictions of people living today.</p>
<h5>✦ Collectible benefits</h5><p>Every floating keepsake has a real power: lanterns and envelopes add Love; lotus petals and bánh chưng heal; bamboo leaves recharge Wind and Shield; stars and nón lá refill special energy; hoa đăng grants a short spirit ward. Open the ✦ Lantern Satchel during play for the full guide.</p>
<h5>📱 Phones & touch controls</h5>
<p>Put one thumb anywhere on the left side, slide to walk and lift it to stop. <span class="kbd">↑</span> jumps. The labelled powers change with your character. Tap <span class="kbd">△</span> for Nón Lá magic when its gold meter is full.</p>
<p>Tap <span class="kbd">🤝</span> to hold hands; HOLD it beside a fallen partner to revive them. <span class="kbd">🔄</span> swaps character in solo play. The glowing TWIN LANTERN button spends 35 Love on your shared attack. <span class="kbd">💗</span> remains a friendly emote.</p>
<p>For two people on phones, use “Play Online Together”.</p>
<h5>💗 Love icons</h5><p>The heart above the centre lantern is the Love Meter. Helping, reviving, lighting key lanterns and matching heart pairs fill it. At 35 Love, press <span class="kbd">F</span> or the TWIN LANTERN button while both heroes are alive and near each other: it heals both, destroys enemy magic and releases a powerful shared wave. Spending Love never removes already unlocked Love Levels.</p>`,
    namesTitle: '✏️ Your names',
    intro: [
      'Long ago, in the ancient town of Hội An,\nevery lantern held a tiny warm flame of memory. 🏮',
      'But one night, a strange cold wind swept the town…\nand carried every flame far away.\nThe town lost its color. The river lost its song.',
      '{BOY} and {GIRL} — two young hearts with magical nón lá —\npromised each other one thing:\n“Together, we will bring the light home.” 💞',
    ],
    lvIntro1: 'Chapter 1 — Lantern Street\nRestore the lanterns, learn your Nón Lá magic, purify the alley guardian, then face the Ashen Lantern Moth.',
    lvIntro2: 'Chapter 2 — Moon River\nSail the Thu Bồn river, light the floating candles and master Moon-River Return before the serpent wakes.',
    lvIntro3: 'Chapter 3 — Bamboo Village\nHelp the buffalo-and-rice village, discover its hammock and dép tổ ong keepsakes, then receive Thánh Gióng’s Bamboo Gale.',
    lvIntro4: 'Chapter 4 — Lotus Lake\nCross the moonlit water, shield each other from shadow birds and challenge the Lotus Eclipse Crane.',
    lvIntro5: 'Chapter 5 — Ancient Temple\nPreserve the Bàu Đá and chuối hột story jars, read the bronze seals, then dispel a cold-wind shadow of historical occupation.',
    lvIntro6: 'Final Chapter — Thánh Gióng’s Blessing\nA legendary bamboo light strengthens both nón lá. Purify the wind-made echo of the Yuan–Mongol invasion, then survive the Hollow Monsoon’s three phases.',
    lvStory1: [
      'Hội An’s lantern makers say a beautiful light needs many patient hands. Every silk rib carries a family craft, and every flame carries someone’s memory.',
      '{BOY} steadies the lantern frames while {GIRL} wakes their light. Their first lesson is simple: love shines brightest when each person makes room for the other. 💞',
    ],
    lvStory2: [
      'The Thu Bồn river has carried traders, songs and families for generations. Tonight its hoa đăng will move only when Wind and Light learn the same rhythm.',
      'Take turns: one guides the boat, one opens the river gates. Do not race ahead—the moon keeps its clearest reflection when both of you are aboard. 🌙',
    ],
    lvStory3: [
      'Beside the rice fields, the buffalo works without hurry and bamboo bends without breaking. The village teaches quiet strength before any battle begins.',
      'When the cold wind reaches the grove, Thánh Gióng’s legend stirs in an ordinary bamboo stalk: courage is not anger—it is standing together to protect home. 🎋',
    ],
    lvStory4: [
      'The lotus rises clean from dark mud. The elders call it a reminder that hardship need not change a good heart.',
      '{BOY} must shelter the path while {GIRL} grows each lotus step. Their promise is not to be fearless, but to keep returning for one another. 🌸',
    ],
    lvStory5: [
      'Bronze-drum patterns remember harvests, birds, rivers and ancestors. The Bàu Đá and chuối hột jars here are records of regional craft—not items for the heroes to drink.',
      'The cold wind can imitate memories of occupation, but it cannot own them. Read the seals, honor the source, and purify the shadow without turning history into hatred.',
    ],
    lvStory6: [
      'Families from every chapter gather beneath one sky of lanterns. Different crafts, rivers and villages become one festival when everyone offers a little light.',
      'The final storm has many spells. Answer them as a couple: shield, heal, reflect, then release both Nón Lá lights together. Đồng lòng makes the impossible path open. ✨',
    ],
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
    loveBurstName: 'SONG ĐĂNG', loveBurstHint: 'Dùng 35 Tình Yêu cho tuyệt kỹ phối hợp',
    loveReady: 'SẴN SÀNG · F', loveBurstCast: '💞 Song Đăng Cộng Hưởng! Tình yêu hóa thành sức mạnh chung.',
    loveBurstNeedCharge: 'Cần thêm {LOVE} Tình Yêu để dùng Song Đăng.', loveBurstTooFar: 'Hãy đến gần người ấy trước.',
    loveBurstNeedPartner: 'Hãy cứu người ấy trước khi dùng tuyệt kỹ phối hợp.',
    partnerDown: 'Người ấy đã ngã — đến gần và GIỮ 💞 (H) để cứu!',
    partnerRescued: 'Đã cứu người ấy! Hồi hai Tim · +6 Tình Yêu',
    rescuePrompt: 'GIỮ H / 💞 ĐỂ CỨU', reviving: 'ĐANG GỌI ÁNH SÁNG TRỞ LẠI…',
    progressSaved: 'Đã lưu hành trình — ghi nhớ vị trí thuyền và câu đố.',
    checkpointRestored: 'Cả hai hồi phục tại điểm hành trình an toàn gần nhất.',
    playSolo: 'Chơi một mình', local2p: '2 người · Một bàn phím', online: 'Chơi Online cùng nhau 💞',
    wardrobe: 'Tủ đồ', howto: 'Cách chơi', back: 'Quay lại', select: 'Chọn',
    menuFoot: 'Một chuyện cổ tích Việt Nam ấm áp về tình yêu và ánh sáng ✨',
    pickChar: 'Chọn nhân vật của bạn', boyDesc: 'Đao gió · Khiên phản phép · Phép Nón Lá', girlDesc: 'Xung ánh sáng · Sen chữa lành · Phép Nón Lá',
    soloHint: 'Người ấy sẽ đi theo bạn — nhấn Tab / 🔄 để đổi vai bất cứ lúc nào.',
    chooseLevel: 'Chọn chương', allChaptersOpen: 'Tất cả chương đều mở — tối nay hai bạn muốn đi chuyến nào?',
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
    touchHands: 'Giữ để cứu người ấy', touchSwitch: 'Đổi vai', touchHeart: 'Gửi biểu tượng tim', touchSpecial: 'Tuyệt kỹ Nón Lá',
    touchGuide: 'Kéo ở bất kỳ đâu bên trái để đi. GIỮ 💞 cạnh người đã ngã để cứu. Dùng SONG ĐĂNG khi đủ 35 Tình Yêu.',
    spiritMonster: 'Linh hồn lạc lối', spiritMagic: 'linh thuật', hatMastery: 'Tinh thông Nón Lá', bossPhase: 'Giai đoạn',
    hatSkillName1: 'Viền Vàng', hatSkillName2: 'Trăng Sông Hồi Quy', hatSkillName3: 'Gió Tre Thánh Gióng',
    hatSkillName4: 'Hào Quang Hoa Sen', hatSkillName5: 'Ấn Rồng Trống Đồng', hatSkillName6: 'Bão Song Tinh',
    guardianName1: 'Hộ Vệ Hẻm Đèn', guardianName2: 'Hộ Vệ Thủy Nguyệt', guardianName3: 'Hộ Vệ Mặt Nạ Tre',
    guardianName4: 'Hộ Vệ Sương Sen', guardianName5: 'Bóng Đô Hộ', guardianName6: 'Ảo Ảnh Tiền Quân Nguyên–Mông',
    bossName1: 'Bướm Đèn Tro Tàn', bossName2: 'Giao Long Thủy Nguyệt', bossName3: 'Bóng Tre Ngàn Năm',
    bossName4: 'Hạc Sen Nguyệt Thực', bossName5: 'Vệ Thần Trống Đồng Sa Ngã', bossName6: 'Bão Rỗng Hắc Phong',
    guardianAwakes: '⚔ {NAME} chặn đường — dùng Gió, Ánh sáng và phản lại phép!',
    bossAwakes: '👑 {NAME} thức tỉnh với ba loại phép!', guardianPurified: 'Đã thanh tẩy hộ vệ — ánh sáng hòa vào nón lá.',
    bossPurified: '✨ {NAME} đã được giải thoát khỏi gió lạnh!', hatMasteryUp: '△ Tinh thông Nón Lá {RANK} — mở khóa {SKILL}!',
    bossCastVolley: 'Quạt lửa lang thang', bossCastWave: 'Linh lực chạy dọc mặt đất',
    bossCastRain: 'Ấn trời rơi — tiếp tục di chuyển!', bossCastRing: 'Vòng phép tám hướng',
    questGuardian: 'Nhiệm vụ: thanh tẩy {NAME}', questBoss: 'Nhiệm vụ: đánh bại {NAME}', questLanterns: 'Nhiệm vụ: thắp những đèn chính còn lại',
    questExit: 'Hoàn thành: cùng nhau đến cổng', bossBlocksExit: 'Trùm chương vẫn đang canh giữ lối đi!',
    questChapter1: 'Nhiệm vụ: thắp phố nghề · thanh tẩy {NAME}',
    questChapter2: 'Nhiệm vụ: dẫn thuyền trăng · thanh tẩy {NAME}',
    questChapter3: 'Nhiệm vụ: giữ lúa và tre · thanh tẩy {NAME}',
    questChapter4: 'Nhiệm vụ: giữ lời hứa sen · thanh tẩy {NAME}',
    questChapter5: 'Nhiệm vụ: đánh thức ký ức đồng · thanh tẩy {NAME}',
    questChapter6: 'Nhiệm vụ: hợp sáng muôn đèn · thanh tẩy {NAME}',
    questStart1: 'LỤA & LỬA 1/4 · Dùng Ánh Sáng đánh thức chiếc đèn nghề đầu tiên',
    questExplore1: 'LỤA & LỬA 2/4 · Giải cơ chế Gió, thùng và chữa lành · {LIT}/{TOTAL} đèn',
    questGuardian1: 'LỤA & LỬA 3/4 · Thanh tẩy {NAME} · phản lại quạt lửa',
    questBoss1: 'LỤA & LỬA 4/4 · Xoa dịu {NAME} · né tro và đáp trả bằng Nón Lá',
    questStart2: 'NHỊP SÔNG 1/4 · Cùng lên thuyền · Gió đẩy thuyền, Ánh Sáng gọi hoa đăng',
    questExplore2: 'NHỊP SÔNG 2/4 · Thắp từng cụm hoa đăng và qua cổng dây · {LIT}/{TOTAL} đèn dẫn',
    questGuardian2: 'NHỊP SÔNG 3/4 · Thanh tẩy {NAME} · dùng Khiên chắn sóng trăng',
    questBoss2: 'NHỊP SÔNG 4/4 · Đọc vòng nước của {NAME} rồi trả ánh sáng về sông',
    questStart3: 'LỜI HỨA LÀNG 1/4 · Chữa cây cầu đầu và gặp làng trâu-lúa',
    questExplore3: 'LỜI HỨA LÀNG 2/4 · Mọc cầu sen, giữ tre và tìm kỷ vật · {LIT}/{TOTAL} đèn',
    questGuardian3: 'LỜI HỨA LÀNG 3/4 · Thanh tẩy {NAME} · di chuyển giữa mưa lá tre',
    questBoss3: 'LỜI HỨA LÀNG 4/4 · Đối diện {NAME} bằng dũng khí bình dị của Thánh Gióng',
    questStart4: 'LỜI THỀ SEN 1/4 · Mọc lối sen an toàn và dùng Khiên đỡ cơn gió trăng đầu',
    questExplore4: 'LỜI THỀ SEN 2/4 · Qua hồ và ghép đôi đèn tim · {LIT}/{TOTAL} đèn',
    questGuardian4: 'LỜI THỀ SEN 3/4 · Thanh tẩy {NAME} · phản lại lưỡi liềm lông hạc',
    questBoss4: 'LỜI THỀ SEN 4/4 · Tìm khoảng an toàn trong phép nguyệt thực của {NAME}',
    questStart5: 'TIẾNG VỌNG TỔ TIÊN 1/4 · Dùng Ánh Sáng nhóm lò đồng đầu tiên',
    questExplore5: 'TIẾNG VỌNG TỔ TIÊN 2/4 · Giải ấn, giữ chum và lên bệ cao · {LIT}/{TOTAL}',
    questGuardian5: 'TIẾNG VỌNG TỔ TIÊN 3/4 · Thanh tẩy {NAME} mà không biến ký ức thành hận thù',
    questBoss5: 'TIẾNG VỌNG TỔ TIÊN 4/4 · Đọc vòng trống của {NAME}, rồi phá ấn gió lạnh',
    questStart6: 'CHUNG MỘT LỄ HỘI 1/4 · Chữa chiếc đèn đầu và mang ánh sáng đi tiếp',
    questExplore6: 'CHUNG MỘT LỄ HỘI 2/4 · Hợp ánh làng quê và dựng cầu gió cuối · {LIT}/{TOTAL}',
    questGuardian6: 'CHUNG MỘT LỄ HỘI 3/4 · Thanh tẩy {NAME} · dùng Khiên chống thế trận bão',
    questBoss6: 'CHUNG MỘT LỄ HỘI 4/4 · Kết hợp Gió, Ánh Sáng, Khiên và Nón Lá đấu {NAME}',
    questFinalChannel: 'PHÚC LÀNH LỄ HỘI · Đứng trên hai bệ và cùng giữ phép',
    itemCodexKicker: 'CẨM NANG · LỢI ÍCH VẬT PHẨM', itemCodexTitle: 'Túi Đèn Kỷ Vật',
    itemCodexHint: 'Mỗi kỷ vật cho một lợi ích tức thì khác nhau và vẫn tính là bùa mở trang phục.',
    returnAdventure: 'Trở lại cuộc phiêu lưu',
    itemName_lantern: 'Đèn Lụa', itemName_petal: 'Cánh Sen', itemName_leaf: 'Lá Tre',
    itemName_envelope: 'Bao Lì Xì', itemName_banhchung: 'Bánh Chưng', itemName_star: 'Đèn Ông Sao',
    itemName_hat: 'Ấn Nón Lá', itemName_candle: 'Hoa Đăng Hộ Thể',
    itemBenefit_lantern: '+2 Tình Yêu · +1 bùa trang phục', itemBenefit_petal: 'Hồi người yếu nhất · làm mới Ánh Sáng khi khỏe',
    itemBenefit_leaf: 'Hồi Đao Gió và Khiên', itemBenefit_envelope: '+3 Tình Yêu · +1 bùa trang phục',
    itemBenefit_banhchung: 'Hồi một Tim cho cả hai', itemBenefit_star: 'Hồi 18 năng lượng Nón Lá cho cả hai',
    itemBenefit_hat: 'Nạp đầy hai thanh Nón Lá', itemBenefit_candle: 'Hộ thể hai giây cho cả hai',
    itemUse_lantern: 'Đèn Lụa: +2 Tình Yêu và +1 bùa trang phục.',
    itemUse_petal: 'Cánh Sen: hồi máu người bị thương nhất hoặc làm mới Ánh Sáng khi cả hai khỏe.',
    itemUse_leaf: 'Lá Tre: hồi Đao Gió và năng lượng Khiên phản phép.',
    itemUse_envelope: 'Bao Lì Xì: +3 Tình Yêu và +1 bùa trang phục.',
    itemUse_banhchung: 'Bánh Chưng: hồi một Tim cho cả hai nhân vật.',
    itemUse_star: 'Đèn Ông Sao: hồi 18 năng lượng Nón Lá cho cả hai.',
    itemUse_hat: 'Ấn Nón Lá: nạp đầy hai thanh năng lượng Nón Lá.',
    itemUse_candle: 'Hoa Đăng: cho cả hai lớp hộ thể linh hồn trong hai giây.',
    itemGain_lantern: '+2 Tình Yêu · Đèn lụa', itemGain_petal: '+1 Tim · Cánh sen',
    itemGain_leaf: 'Đã hồi Gió + Khiên', itemGain_envelope: '+3 Tình Yêu · Lì xì',
    itemGain_banhchung: 'Cả hai đã hồi máu', itemGain_star: '+18 năng lượng Nón Lá',
    itemGain_hat: 'Nón Lá đã nạp đầy', itemGain_candle: 'Hộ thể linh hồn · 2 giây',
    bonusLantern: 'Thắp thêm đèn lồng! +2 ✨ +1 💗',
    hatNotReady: 'Phép Nón Lá đang hồi phục…', playerRevived: 'Dũng khí đèn lồng hồi phục tại điểm lưu 💛',
    culture_buffaloRice: '🌾 Trâu và lúa — sức bền hiền hòa cùng mùa gặt đã nuôi sống làng quê qua bao thế hệ. Đã tìm thấy kỷ vật!',
    culture_hammock: '🧶 Chiếc võng đan là nơi nghỉ ngơi, kể chuyện và giữ ký ức gia đình dưới rặng tre.',
    culture_sandals: '🩴 Dép tổ ong — đôi dép cao su quen thuộc, mộc mạc và thực tế trong đời sống thường ngày.',
    culture_bauda: '🏺 Chum Bàu Đá lưu lại câu chuyện nghề truyền thống và di sản Bình Định. Đây là kỷ vật, không phải vật phẩm để uống.',
    culture_chuoi: '🍌 Chum chuối hột được lưu giữ như chuyện làng và tri thức cây cỏ; hai nhân vật thu thập câu chuyện, không uống rượu.',
    culture_giong: '🎋 Tre ngân lên truyền thuyết Thánh Gióng: lòng can đảm lớn dậy khi điều bình dị được dùng để bảo vệ quê hương. Tăng tinh thông!',
    lvName1: 'Phố Đèn Lồng Hội An', lvName2: 'Thuyền Trăng Sông Thu Bồn', lvName3: 'Làng Cầu Tre',
    lvName4: 'Lời Hứa Hồ Sen', lvName5: 'Cổ Tự Đèn Lồng', lvName6: 'Đại Lễ Hội Đèn Lồng',
    lvValue1: 'Giữ nghề, giữ lửa · Ký ức', lvValue2: 'Thuận lòng, thuận nước · Nhịp chung',
    lvValue3: 'Tre Việt kiên cường · Dũng khí', lvValue4: 'Sen thanh, tình bền · Thủy chung',
    lvValue5: 'Uống nước nhớ nguồn · Biết ơn', lvValue6: 'Đồng lòng · Cùng mạnh mẽ',
    costume_classic: 'Áo dài lễ hội cổ điển', costume_flower: 'Nón lá cài hoa', costume_lantern: 'Đèn lồng Hội An',
    costume_lotus: 'Hồ sen', costume_tet: 'Tết sum vầy', costume_bamboo: 'Làng tre',
    costume_wedding: 'Áo dài cưới', costume_modern: 'Đôi bạn hiện đại',
    loveLv0: 'Tia lửa đầu tiên', loveLv1: 'Tay trong tay', loveLv2: 'Chung ánh đèn', loveLv3: 'Song nón lá hộ thể',
    loveLv4: 'Cú nhảy gió yêu', loveLv5: 'Phúc lành lễ hội',
    loveUp1: '💞 Tình yêu cấp 1 — Tay trong tay! Cứ đi cạnh nhau, sợi dây tình cảm sẽ tự gắn kết và che chở hai bạn trong bóng tối.',
    loveUp2: '💞 Tình yêu cấp 2 — Chung ánh đèn! Ánh sáng của hai bạn lớn hơn khi ở gần nhau.',
    loveUp3: '💞 Tình yêu cấp 3 — Song nón lá hộ thể! Khiên che chở cả hai, mạnh mẽ hơn.',
    loveUp4: '💞 Tình yêu cấp 4 — Cú nhảy gió yêu! Đứng cạnh nhau, GIỮ 💞 (H) rồi nhảy để cùng bay lên.',
    loveUp5: '💞 Tình yêu cấp 5 — Phúc lành lễ hội! Đèn lồng quanh bạn tự tỏa sáng.',
    tipMove: 'Di chuyển bằng phím — nhớ đi cạnh nhau nhé!',
    tipJump: 'Nhảy qua mấy thùng gỗ nào.', tipLight: 'Cô gái: nhấn phép gần đèn lồng để thắp sáng ✨',
    tipWind: 'Chàng trai: nhấn phép để thổi gió — đẩy đèn lồng treo xuống thấp, rồi cô gái thắp nó!',
    tipPush: 'Chàng trai: đi vào thùng gỗ để đẩy nó lên bệ vàng.',
    tipLotus: 'Cô gái: dùng phép thứ 2 gần mặt nước lấp lánh để mọc bệ hoa sen 🌸',
    tipHands: 'Cùng nhau bước dưới cổng — sợi dây tình cảm sẽ chúc phúc điểm lưu 💗',
    tipMemory: 'Hãy đứng cùng nhau dưới chiếc đèn lồng lớn…',
    tipBridge: 'Chàng trai: đứng lên dấu gió và GIỮ phép để tạo cầu gió. Cô gái: băng qua và đứng lên bệ!',
    tipShield: 'Chàng trai: GIỮ phép thứ 2 để che chắn cả hai khỏi gió và bóng tối 🛡',
    tipBoat: 'Lên thuyền nào! Chàng trai: thổi gió để thuyền trôi ⛵ Cô gái: thắp nến nổi để mở cổng dây.',
    tipHeal: 'Cô gái: ánh sáng của nàng chữa lành mọi thứ — đèn lồng, cây cầu, tượng đá 💗',
    tipChannel: 'Đứng lên hai bệ đá và CẢ HAI cùng GIỮ phép để đánh thức Đại Đèn Lồng!',
    tipTogetherGate: 'Có những cánh cổng chỉ mở khi hai bạn đứng thật gần nhau 💑',
    promptLight: 'Ánh sáng ✨', promptWind: 'Gió 🌀', promptLotus: 'Hoa sen 🌸', promptShield: 'Khiên 🛡',
    promptHands: 'Ở gần nhau nhé 💗', promptRelease: 'Buông tay', promptSwap: 'Đổi vai', promptChannel: 'GIỮ để truyền phép ✨',
    promptRevive: 'GIỮ 💞 để cứu người ấy',
    exitNeed: 'Hãy thắp đủ đèn lồng chính trước nhé! 🏮',
    exitReady: 'Đường đã mở — cùng nhau đi tiếp nào! ➜',
    fellWater: 'Ùm! 💦', partnerSaved: 'đã cứu bạn! +💗',
    helpKeys: `<h5>🕹 Bàn phím — Người chơi 1 ({BOY})</h5>
<p><span class="kbd">A</span><span class="kbd">D</span> di chuyển · <span class="kbd">W</span> nhảy · <span class="kbd">E</span> Đao Gió · <span class="kbd">Q</span> giữ Khiên · <span class="kbd">R</span> tuyệt kỹ Nón Lá</p>
<h5>🕹 Bàn phím — Người chơi 2 ({GIRL})</h5>
<p><span class="kbd">◀</span><span class="kbd">▶</span> di chuyển · <span class="kbd">▲</span> nhảy · <span class="kbd">O</span> Xung Ánh Sáng · <span class="kbd">P</span> Hoa Sen · <span class="kbd">I</span> tuyệt kỹ Nón Lá</p>
<h5>💞 Cùng nhau</h5>
<p>Đi cạnh nhau là sợi dây tình cảm tự gắn kết 💗 · <span class="kbd">H</span> GIỮ cạnh người đã ngã để hồi sinh; ở Tình yêu cấp 4, GIỮ + nhảy = Cú nhảy gió yêu · <span class="kbd">F</span> dùng 35 Tình Yêu thi triển Song Đăng · <span class="kbd">Tab</span> đổi vai (chơi một mình) · <span class="kbd">Esc</span> tạm dừng</p>
<h5>🌀 {BOY}</h5><p>Gió gây sát thương và đẩy linh hồn, đồng thời đẩy đèn lồng, thuyền và thùng gỗ. Giữ Khiên để bảo vệ cả hai và phản phép trùm.</p>
<h5>✨ {GIRL}</h5><p>Ánh sáng gây sát thương bóng tối, thắp đèn và chữa lành đồ vỡ. Hoa Sen tạo bệ an toàn và hào quang soi rõ bóng tối.</p>
<h5>△ Tinh thông Nón Lá</h5><p>Thanh tẩy linh hồn giúp tuyệt kỹ Nón Lá phát triển qua sáu cấp lấy cảm hứng Việt Nam. Chỉ dùng được khi thanh năng lượng vàng đã đầy.</p>
<h5>👑 Nhiệm vụ chương</h5><p>Thắp đèn chính, thanh tẩy hộ vệ rồi đánh bại trùm chương. Hãy né vùng cảnh báo, dùng Khiên phản phép, sau đó đáp trả bằng Gió, Ánh sáng và Nón Lá.</p>
<h5>🌾 Khám phá văn hóa</h5><p>Đi đến gần kỷ vật phát sáng để ghi lại câu chuyện và tăng Tinh thông Nón Lá. Bộ đếm 🌾 cho biết còn bao nhiêu kỷ vật. Kẻ địch lịch sử chỉ là bóng ký ức phép thuật về chiến tranh và thời đô hộ, không đại diện cho con người ngày nay.</p>
<h5>✦ Lợi ích vật phẩm</h5><p>Mỗi kỷ vật bay đều có công dụng: đèn và lì xì tăng Tình Yêu; cánh sen và bánh chưng hồi máu; lá tre hồi Gió và Khiên; sao và nón lá nạp tuyệt kỹ; hoa đăng cho hộ thể ngắn. Mở ✦ Túi Đèn Kỷ Vật khi chơi để xem đầy đủ.</p>
<h5>📱 Điện thoại & cảm ứng</h5>
<p>Đặt ngón tay ở bất kỳ đâu bên trái, kéo để đi và nhấc tay để dừng. <span class="kbd">↑</span> để nhảy. Các nút phép đổi theo nhân vật. Chạm <span class="kbd">△</span> để dùng Nón Lá khi thanh vàng đầy.</p>
<p>Chạm <span class="kbd">🤝</span> để nắm tay; GIỮ nút này cạnh người đã ngã để cứu. <span class="kbd">🔄</span> đổi nhân vật khi chơi một mình. Nút SONG ĐĂNG phát sáng dùng 35 Tình Yêu cho tuyệt kỹ chung. <span class="kbd">💗</span> vẫn là biểu cảm thân thiện.</p>
<p>Hai người chơi trên điện thoại hãy dùng “Chơi Online cùng nhau”.</p>
<h5>💗 Biểu tượng Tình Yêu</h5><p>Trái tim trên chiếc đèn giữa màn hình là Thang Tình Yêu. Giúp đỡ, cứu nhau, thắp đèn chính và ghép cặp đèn tim sẽ nạp thang. Khi đủ 35, nhấn <span class="kbd">F</span> hoặc nút SONG ĐĂNG lúc cả hai còn sống và ở gần nhau: kỹ năng hồi máu cả hai, xóa phép địch và tung sóng phối hợp cực mạnh. Tiêu Tình Yêu không làm mất cấp đã mở.</p>`,
    namesTitle: '✏️ Tên của hai bạn',
    intro: [
      'Ngày xưa, ở phố cổ Hội An,\nmỗi chiếc đèn lồng giữ một ngọn lửa ký ức nhỏ ấm áp. 🏮',
      'Nhưng một đêm nọ, cơn gió lạ lạnh lẽo quét qua phố…\ncuốn hết mọi ngọn lửa bay đi xa.\nPhố mất màu. Dòng sông quên tiếng hát.',
      '{BOY} và {GIRL} — hai trái tim trẻ với nón lá nhiệm màu —\nđã hứa với nhau một điều:\n“Cùng nhau, mình sẽ đưa ánh sáng về nhà.” 💞',
    ],
    lvIntro1: 'Chương 1 — Phố Đèn Lồng\nThắp lại đèn, học phép Nón Lá, thanh tẩy hộ vệ con hẻm rồi đối đầu Bướm Đèn Tro Tàn.',
    lvIntro2: 'Chương 2 — Sông Trăng\nChèo qua sông Thu Bồn, thắp nến nổi và làm chủ Trăng Sông Hồi Quy trước khi giao long thức giấc.',
    lvIntro3: 'Chương 3 — Làng Tre\nGiúp làng trâu-lúa, khám phá chiếc võng và dép tổ ong, rồi đón nhận Gió Tre Thánh Gióng.',
    lvIntro4: 'Chương 4 — Hồ Sen\nBăng qua mặt nước trăng, che chắn nhau khỏi chim bóng tối và thách đấu Hạc Sen Nguyệt Thực.',
    lvIntro5: 'Chương 5 — Cổ Tự\nGìn giữ chuyện chum Bàu Đá và chuối hột, đọc ấn trống đồng, rồi xua tan Bóng Đô Hộ do gió lạnh tạo ra.',
    lvIntro6: 'Chương cuối — Phúc Lành Thánh Gióng\nÁnh tre truyền thuyết cường hóa đôi nón lá. Thanh tẩy ảo ảnh cuộc xâm lược Nguyên–Mông, rồi vượt qua ba giai đoạn Bão Rỗng Hắc Phong.',
    lvStory1: [
      'Người làm đèn Hội An bảo rằng một ánh sáng đẹp cần nhiều bàn tay kiên nhẫn. Mỗi nan tre giữ một nghề nhà, mỗi ngọn lửa giữ một ký ức.',
      '{BOY} giữ khung đèn để {GIRL} gọi ánh sáng về. Bài học đầu tiên thật giản dị: tình yêu sáng nhất khi mỗi người biết nhường chỗ cho người kia. 💞',
    ],
    lvStory2: [
      'Sông Thu Bồn đã chở thương hồ, câu hát và bao thế hệ gia đình. Đêm nay hoa đăng chỉ trôi khi Gió và Ánh sáng tìm được cùng một nhịp.',
      'Hãy thay phiên: một người dẫn thuyền, một người mở cổng sông. Đừng bỏ người kia lại—trăng chỉ tròn bóng khi cả hai cùng ở trên thuyền. 🌙',
    ],
    lvStory3: [
      'Bên ruộng lúa, con trâu bền bỉ không vội; tre cúi mình mà không gãy. Làng quê dạy sức mạnh hiền hòa trước khi dạy cách chiến đấu.',
      'Khi gió lạnh chạm rặng tre, truyền thuyết Thánh Gióng thức trong một nhánh tre bình dị: dũng khí không phải giận dữ, mà là cùng nhau bảo vệ quê nhà. 🎋',
    ],
    lvStory4: [
      'Hoa sen vươn sạch từ bùn tối. Người xưa nhắc rằng gian khó không nhất thiết làm đổi một tấm lòng tốt.',
      '{BOY} che chở con đường để {GIRL} gọi từng bệ sen. Lời hứa của họ không phải không bao giờ sợ, mà là luôn quay lại bên nhau. 🌸',
    ],
    lvStory5: [
      'Hoa văn trống đồng nhớ mùa gặt, cánh chim, dòng sông và tổ tiên. Chum Bàu Đá, chuối hột ở đây ghi lại nghề vùng miền—không phải vật phẩm để nhân vật uống.',
      'Gió lạnh có thể bắt chước ký ức thời đô hộ nhưng không thể chiếm lấy ký ức ấy. Hãy đọc ấn, nhớ nguồn và thanh tẩy bóng tối mà không biến lịch sử thành hận thù.',
    ],
    lvStory6: [
      'Gia đình từ mọi chương tụ hội dưới một trời hoa đăng. Nghề khác nhau, sông làng khác nhau, nhưng góp mỗi người một ánh sáng sẽ thành đại lễ hội.',
      'Cơn bão cuối có nhiều phép. Hãy đáp lại như một đôi: che chắn, chữa lành, phản phép rồi cùng tung hai luồng Nón Lá. Đồng lòng thì đường khó cũng mở. ✨',
    ],
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
