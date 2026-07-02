const CACHE_VERSION = "pollen-destroy-survivor-v0.41.1";
const APP_SHELL = [
  "./",
  "index.html",
  "style.css",
  "manifest.webmanifest",
  "brand-splash.js",
  "game.js",
  "version.json",
  "assets/brand/keishis-entrance-logo.png",
  "assets/brand/sweet-wind-jingle.mp3",
  "assets/icons/pollen-survivor-192.png",
  "assets/icons/pollen-survivor-512.png",
  "assets/backgrounds/stage1_pollen_sando.png",
  "assets/backgrounds/stage2_hinoki_road.jpg",
  "assets/backgrounds/stage3_autumn_pollen_road.png",
  "assets/backgrounds/site_backdrop_pollen_lords.png",
  "assets/stage4/background.png",
  "assets/stage4/shirakaba-priest.png",
  "assets/stage4/shirakaba-cut-in.png",
  "assets/stage4/enemy-small.png",
  "assets/stage4/enemy-medium.png",
  "assets/stage4/enemy-large.png",
  "assets/stage4/decorative-snowflakes.png",
  "assets/stage5/final-layered-worldscape.jpg",
  "assets/stage5/daikafun-taikun.png",
  "assets/stage5/daikafun-taikun-cutin.png",
  "assets/stage5/daikafun-daijin.png",
  "assets/stage5/daikafun-daijin-cutin.png",
  "assets/stage5/nameless-abyss.png",
  "assets/audio/stage5/route-sugi-hinoki.mp3",
  "assets/audio/stage5/route-ragweed-shirakaba.mp3",
  "assets/audio/stage5/taikun-theme.mp3",
  "assets/audio/stage5/daijin-theme.mp3",
  "assets/audio/stage5/abyss-first.mp3",
  "assets/audio/stage5/abyss-second.mp3",
  "assets/audio/ending-theme.mp3",
  "assets/audio/stage1_spring_pollen_path.mp3",
  "assets/audio/boss_suginomikoto.mp3",
  "assets/audio/stage2_theme.mp3",
  "assets/audio/boss2_theme.mp3",
  "assets/audio/bgm/stage3_theme.mp3",
  "assets/audio/bgm/boss3_theme.mp3",
  "assets/audio/stage4.mp3",
  "assets/audio/shirakaba-boss.mp3",
  "assets/characters/player.png",
  "assets/characters/shion/player.png",
  "assets/characters/shion/cut-in.png",
  "assets/characters/suginomikoto.png",
  "assets/characters/hinoki_shogun.png",
  "assets/characters/lord_ragweed.png",
  "assets/enemies/pollen_enemies.png",
  "assets/enemies/hinoki_enemies.png",
  "assets/enemies/stage3_enemies.png",
  "assets/cutin/haou_slipper_nova.png",
  "assets/cutin/suginomikoto_divine_attack.png",
  "assets/cutin/hinoki_shogun_divine_attack.png",
  "assets/cutin/lord_ragweed_cutin.png",
  "assets/audio/se/item_p_small.wav",
  "assets/audio/se/item_p_large.wav",
  "assets/audio/se/power_up.wav",
  "assets/audio/se/power_max.wav",
  "assets/audio/se/follower_add.wav",
  "assets/audio/se/cutin_haou_start.wav",
  "assets/audio/se/cutin_haou_impact.wav",
  "assets/audio/se/slipper_nova_charge.wav",
  "assets/audio/se/slipper_nova_fire.wav",
  "assets/audio/se/slipper_nova_end.wav",
  "assets/audio/se/cutin_suginomikoto_start.wav",
  "assets/audio/se/divine_bell.wav",
  "assets/audio/se/pollen_charge.wav",
  "assets/audio/se/pollen_release.wav",
  "assets/audio/se/infinite_scatter.wav",
  "assets/audio/se/player_hit.wav",
  "assets/audio/se/pichuun.wav",
  "assets/audio/se/menu_move.wav",
  "assets/audio/se/menu_decide.wav",
  "assets/audio/se/menu_cancel.wav",
  "assets/audio/se/graze.wav",
  "assets/audio/se/countdown_tick.wav",
  "assets/audio/se/time_up.wav",
  "assets/audio/se/spell_success.wav",
  "assets/audio/se/spell_failed.wav",
  "assets/audio/se/bonus_release.wav",
  "assets/audio/se/point_item.wav"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("index.html")))
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});
