/* Runtime art manifest. Images remain lazy: requesting an entry starts its
   download and the canvas renderer keeps its procedural fallback until ready. */
(function () {
  const base = document.baseURI;
  const paths = {
    lantern: 'assets/art/sprites/lantern-premium.webp',
    titleLarge: 'assets/art/ui/title-couple-1600.webp',
    titleSmall: 'assets/art/ui/title-couple-960.webp',
    portraitBoy: 'assets/art/ui/portrait-boy.webp',
    portraitGirl: 'assets/art/ui/portrait-girl.webp',
    characterSheet: 'assets/art/ui/character-sheet-v3.webp',
    characterBoySheet: 'assets/art/ui/character-boy-sheet.webp',
    characterGirlSheet: 'assets/art/ui/character-girl-sheet.webp',
    portraitBoySheet: 'assets/art/ui/portrait-boy-sheet.webp',
    portraitGirlSheet: 'assets/art/ui/portrait-girl-sheet.webp',
  };
  const itemKinds = ['lantern', 'petal', 'leaf', 'envelope', 'banhchung', 'star', 'hat', 'candle'];
  const lanternKinds = ['hoian', 'moon', 'bamboo', 'lotus', 'bronze', 'twin', 'heart', 'memory'];
  const abilityKinds = ['wind', 'shield', 'light', 'lotus', 'love-jump', 'resonance'];
  for (const kind of itemKinds) paths['item_' + kind] = `assets/art/items/${kind}.webp`;
  for (const kind of lanternKinds) paths['lantern_' + kind] = `assets/art/lanterns/${kind}.webp`;
  for (const kind of abilityKinds) paths['ability_' + kind] = `assets/art/abilities/${kind}.webp`;
  const uiKinds = ['love', 'rescue', 'checkpoint', 'quest', 'satchel', 'health', 'shield', 'mastery', 'wind', 'light', 'map', 'boss'];
  const propKinds = ['hoian-house', 'river-boat', 'village-house', 'lotus-pavilion', 'temple-gate', 'festival-stage',
    'checkpoint-arch', 'craft-stall', 'rope-gate', 'stone-lantern', 'helper-crate', 'quest-sign'];
  const coopKinds = ['revive-aura', 'rescue-hands', 'love-burst', 'twin-wave', 'checkpoint-spiral', 'couple-ward'];
  for (const kind of uiKinds) paths['ui_' + kind] = `assets/art/ui-kit/${kind}.webp`;
  for (const kind of propKinds) paths['prop_' + kind] = `assets/art/props/${kind}.webp`;
  for (const kind of coopKinds) paths['coop_' + kind] = `assets/art/coop-effects/${kind}.webp`;
  for (let i = 1; i <= 6; i++) {
    paths['chapter' + i] = `assets/art/chapters/chapter-${i}.webp`;
    paths['skill' + i] = `assets/art/effects/hat-skill-${i}.webp`;
    paths['boss' + i] = `assets/art/bosses/boss-${i}.webp`;
    paths['enemySkill' + i] = `assets/art/enemy-skills/chapter-${i}.webp`;
    paths['scene' + i] = `assets/art/scenery/chapter-${i}.webp`;
  }

  const cache = new Map();
  const url = key => new URL(paths[key] || key, base).href;
  function load(key) {
    if (!paths[key]) return null;
    if (!cache.has(key)) {
      const image = new Image();
      image.decoding = 'async';
      image.src = url(key);
      cache.set(key, image);
    }
    return cache.get(key);
  }

  NLA.art = {
    paths,
    url,
    load,
    get(key) {
      const image = load(key);
      return image && image.complete && image.naturalWidth > 0 ? image : null;
    },
    preload(keys) { for (const key of keys) load(key); },
  };
})();
