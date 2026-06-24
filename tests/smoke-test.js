const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function createElement(id = "") {
  return {
    id,
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
    addEventListener() {},
    setAttribute(name, value) { this.attributes[name] = value; },
    appendChild() {},
    getBoundingClientRect() { return { left: 0, top: 0, width: 450, height: 800 }; },
    getContext() { return {}; },
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
    json: async () => ({ version: "0.12.0", updates: [] }),
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
game.player.invincible = 0;
game.player.hit(game);
assert.equal(game.life.lives, 2, "hit should reduce one stock");
assert.equal(game.playerSpellCount, 3, "losing a stock should refill spells");

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

game.dialogue.start("scene_boss");
assert.equal(game.dialogue.resolvePortraitLine("left").portrait, "player.png");
assert.equal(game.dialogue.resolvePortraitLine("right").portrait, "suginomikoto.png");

console.log("smoke test passed");
