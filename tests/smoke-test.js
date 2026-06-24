const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const gradient = { addColorStop() {} };
const drawingContext = new Proxy({
  measureText(text) { return { width: String(text).length * 10 }; },
  createLinearGradient() { return gradient; },
  createRadialGradient() { return gradient; },
}, {
  get(target, property) {
    if (property in target) return target[property];
    return () => {};
  },
  set(target, property, value) {
    target[property] = value;
    return true;
  },
});

function createElement(id = "") {
  const listeners = new Map();
  return {
    id,
    listeners,
    classList: {
      values: new Set(),
      add(value) { this.values.add(value); },
      remove(value) { this.values.delete(value); },
      toggle(value) {
        if (this.values.has(value)) {
          this.values.delete(value);
          return false;
        }
        this.values.add(value);
        return true;
      },
      contains(value) { return this.values.has(value); },
    },
    attributes: {},
    hidden: false,
    textContent: "",
    innerHTML: "",
    width: id === "gameCanvas" ? 450 : 0,
    height: id === "gameCanvas" ? 800 : 0,
    addEventListener(name, handler) {
      if (!listeners.has(name)) listeners.set(name, []);
      listeners.get(name).push(handler);
    },
    dispatch(name, event = {}) {
      for (const handler of listeners.get(name) || []) handler(event);
    },
    setAttribute(name, value) { this.attributes[name] = value; },
    appendChild() {},
    getBoundingClientRect() { return { left: 0, top: 0, width: 450, height: 800 }; },
    getContext() { return drawingContext; },
    setPointerCapture() {},
  };
}

const elements = new Map();
[
  "gameCanvas",
  "slowButton",
  "spellButton",
  "menuButton",
  "updateToggle",
  "updateBody",
  "appVersion",
  "updateStatus",
  "updateList",
  "checkUpdateButton",
  "reloadUpdateButton",
].forEach((id) => elements.set(id, createElement(id)));
const updatePanel = createElement("updatePanel");

class ImageStub {
  constructor() {
    this.width = 1280;
    this.height = 853;
  }
  set src(value) {
    this._src = value;
    if (this.onload) this.onload();
  }
  get src() {
    return this._src;
  }
}

class AudioStub {
  constructor() {
    this.currentTime = 0;
    this.volume = 1;
    this.loop = false;
  }
  play() { return Promise.resolve(); }
  pause() {}
}

const localStorageData = new Map();
const sandbox = {
  console,
  URLSearchParams,
  Image: ImageStub,
  Audio: AudioStub,
  location: { search: "?debug=1", protocol: "http:", pathname: "/" },
  navigator: { getGamepads: () => [] },
  localStorage: {
    getItem(key) { return localStorageData.get(key) || null; },
    setItem(key, value) { localStorageData.set(key, value); },
  },
  fetch: async () => ({
    ok: true,
    json: async () => ({ version: "0.17.0", updates: [] }),
  }),
  caches: { keys: async () => [] },
  requestAnimationFrame() {},
  setTimeout,
  clearTimeout,
  document: {
    getElementById(id) { return elements.get(id); },
    querySelector(selector) { return selector === ".update-panel" ? updatePanel : null; },
    createElement() { return createElement(); },
  },
};
sandbox.window = {
  addEventListener() {},
  matchMedia: () => ({ matches: true }),
};
sandbox.window.window = sandbox.window;

const source = fs.readFileSync(path.join(__dirname, "..", "game.js"), "utf8");
vm.runInNewContext(source, sandbox, { filename: "game.js" });

const game = sandbox.window.__POLLEN_GAME__;
assert.ok(game, "debug game hook should be available");
assert.equal(updatePanel.classList.contains("is-closed"), true, "mobile update panel should start closed");

game.start(false, false);
game.dialogue.active = false;
game.playerSpellCooldown = 0;
assert.equal(game.player.hitPoint.y, game.player.y - 6, "player hit point should sit between the previous chest and lower positions");
game.life.lives = 3;
game.player.invincible = 0;
game.enemyBullets = [{ x: game.player.hitPoint.x, y: game.player.hitPoint.y, r: 1 }];
game.resolveCollisions();
assert.equal(game.life.lives, 2, "enemy bullet collision should use the chest hit point");
game.life.lives = 3;
game.player.invincible = 0;
game.enemyBullets = [];

const canvas = elements.get("gameCanvas");
canvas.dispatch("pointermove", {
  pointerType: "mouse",
  clientX: 330,
  clientY: 500,
});
assert.equal(game.input.mouseActive, true, "mouse movement should enable mouse control");
assert.equal(game.input.touchX, 330, "mouse movement should update target x");
assert.equal(game.input.touchY, 500, "mouse movement should update target y");

let contextPrevented = false;
canvas.dispatch("contextmenu", {
  preventDefault() { contextPrevented = true; },
});
assert.equal(contextPrevented, true, "canvas context menu should be suppressed");

let rightClickPrevented = false;
canvas.dispatch("pointerdown", {
  button: 2,
  pointerType: "mouse",
  preventDefault() { rightClickPrevented = true; },
});
assert.equal(rightClickPrevented, true, "right click should be consumed by the game");
assert.equal(game.playerSpellCount, 2, "right click should activate Slipper Nova once");
game.endPlayerSpell();
game.playerSpellCooldown = 0;
game.playerSpellCount = 3;

for (let i = 0; i < 3; i += 1) {
  game.activatePlayerSpell();
  assert.equal(game.playerSpellCount, 2 - i);
  assert.equal(game.playerSpellActive, true);
  game.endPlayerSpell();
  game.playerSpellCooldown = 0;
}
game.activatePlayerSpell();
assert.equal(game.playerSpellCount, 0, "spell count must stay at zero");
assert.equal(game.playerSpellActive, false, "spell must not activate at zero count");

game.input.fire = true;
const bulletCount = game.playerBullets.length;
game.player.cooldown = 0;
game.player.update(game.input, game.playerBullets);
assert.ok(game.playerBullets.length > bulletCount, "normal shot must still work after spells are exhausted");

game.playerSpellCount = 0;
game.life.lives = 3;
game.power.value = 10;
game.syncFollowers();
game.player.invincible = 0;
game.player.hit(game);
assert.equal(game.life.lives, 2, "hit should reduce one stock");
assert.equal(game.playerSpellCount, 3, "losing a stock should refill spells");
assert.equal(game.power.value, 5, "hit should reduce power by one follower tier");
game.syncFollowers();
assert.equal(game.followers.length, 1, "one follower should remain after power loss");

game.enemies = [];
game.spawnedWaves = new Set();
game.state.time = 119;
game.spawnStageEnemies();
assert.equal(game.enemies.length, 0);
game.state.time = 120;
game.spawnStageEnemies();
const firstWaveCount = game.enemies.length;
assert.ok(firstWaveCount > 0, "first wave should spawn");
game.spawnStageEnemies();
assert.equal(game.enemies.length, firstWaveCount, "same wave must not spawn twice");

game.enemyBullets = [];
for (let i = 0; i < 300; i += 1) {
  game.spawnEnemyBullet({ offscreen: () => false });
}
assert.equal(game.enemyBullets.length, 150, "normal bullet cap should be enforced");

game.power.value = 20;
game.syncFollowers();
assert.equal(game.followers.length, 4, "maximum power should deploy four followers");
const followerShotStart = game.playerBullets.length;
game.shootFollowers();
assert.equal(game.playerBullets.length - followerShotStart, 4, "all followers should shoot once");
game.playerSpellActive = true;
game.playerSpellTimer = 30;
assert.equal(game.getFollowerSpellBeams().length, 4, "followers should add four small spell beams");
game.endPlayerSpell();

game.powerItems = [];
game.pointItems = [];
game.destroyEnemy({ type: "large", x: 200, y: 200, destroyed: false, hp: 1, scoreValue: 1000 });
assert.ok(game.powerItems.length >= 1, "large pollen should always drop a power item");
assert.equal(game.pointItems.length, 1, "large pollen should drop one point item");
const collectible = game.powerItems[0];
collectible.x = 60;
collectible.y = 420;
game.player.x = 220;
game.player.y = 160;
const autoCollectDistance = Math.hypot(collectible.x - game.player.hitPoint.x, collectible.y - game.player.hitPoint.y);
collectible.update(game.player);
assert.equal(collectible.autoCollect, true, "top 20 percent should enable automatic item collection");
assert.ok(
  Math.hypot(collectible.x - game.player.hitPoint.x, collectible.y - game.player.hitPoint.y) < autoCollectDistance,
  "automatically collected item should move toward the player"
);
collectible.x = game.player.x;
collectible.y = game.player.y;
game.power.value = 0;
let powerSoundHook = null;
game.audio.onPowerItem = (detail) => {
  powerSoundHook = detail;
};
game.resolveCollisions();
assert.equal(game.powerItems.includes(collectible), false, "collected power item should be removed immediately");
assert.equal(collectible.collected, true, "collected flag should be set");
assert.equal(game.power.value, 1, "power value should increase once");
assert.equal(game.followers.length, 1, "first power stage should deploy one follower");
assert.equal(powerSoundHook.amount, 1, "power item sound hook should receive item amount");
assert.equal(powerSoundHook.stageChanged, true, "power item sound hook should receive stage change state");
assert.equal(game.collectPowerItem(collectible), false, "same power item must not be collected twice");
assert.equal(game.power.value, 1, "duplicate collection must not increase power");

const shotCounts = [];
for (let stage = 0; stage <= 4; stage += 1) {
  const shots = [];
  game.player.shoot(shots, stage);
  shotCounts.push(shots.length);
}
assert.deepEqual(shotCounts, [1, 2, 3, 3, 5], "shot count should visibly increase by power stage");

game.powerItems = [];
game.pointItems = [];
game.destroyEnemy({ type: "large", x: game.player.x, y: game.player.y, destroyed: false, hp: 1, scoreValue: 1000 });
const maxItem = game.powerItems[0];
const pointItem = game.pointItems[0];
pointItem.x = 60;
pointItem.y = 420;
game.powerItems = [maxItem];
game.power.value = game.power.max;
const maxScoreBefore = game.score.value;
game.resolveCollisions();
assert.equal(game.power.value, game.power.max, "power should never exceed maximum");
assert.ok(game.score.value > maxScoreBefore, "power item at maximum should convert to score");
assert.equal(game.powerItems.length, 0, "max-power item should also be removed immediately");

pointItem.x = game.player.x;
pointItem.y = game.player.y;
const pointScoreBefore = game.score.value;
game.resolveCollisions();
assert.equal(game.pointItems.length, 0, "point item should be removed immediately after collection");
assert.equal(pointItem.collected, true, "point item should set collected flag");
assert.equal(game.score.value, pointScoreBefore + pointItem.scoreValue, "point item should add its score value");

game.dialogue.start("scene_boss");
assert.equal(game.dialogue.resolvePortraitLine("left").portrait, "player.png");
assert.equal(game.dialogue.resolvePortraitLine("right").portrait, "suginomikoto.png");
game.enemyBullets = [];
game.playerSpellCutin = 40;
game.draw();
game.dialogue.completeNow();

game.state.mode = "stage";
game.state.time = 3420;
game.spawnStageEnemies();
assert.ok(game.boss, "boss should spawn at the end of the stage");
game.boss.entered = true;
game.boss.beginCurrentCard(game);
while (game.boss && !game.boss.defeated) {
  game.boss.currentCard.hp = 0;
  game.boss.nextCard(game);
}
assert.equal(game.dialogue.sceneName, "scene_clear", "boss defeat should start the clear dialogue");
game.dialogue.completeNow();
assert.equal(game.dialogue.sceneName, "scene_ending", "clear dialogue should lead to the ending");
game.dialogue.completeNow();
assert.equal(game.state.mode, "clear", "ending should finish on the clear screen");

console.log("smoke test passed");
