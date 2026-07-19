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
  };
  for (let i = 1; i <= 6; i++) {
    paths['chapter' + i] = `assets/art/chapters/chapter-${i}.webp`;
    paths['skill' + i] = `assets/art/effects/hat-skill-${i}.webp`;
    paths['boss' + i] = `assets/art/bosses/boss-${i}.webp`;
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

