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
  constructor(src = "") {
    this.src = src;
    this.currentTime = 0;
    this.volume = 1;
    this.loop = false;
    this.paused = true;
    this.listeners = new Map();
  }
  addEventListener(name, handler) { this.listeners.set(name, handler); }
  load() {}
  play() {
    this.paused = false;
    return Promise.resolve();
  }
  pause() { this.paused = true; }
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
    json: async () => ({ version: "0.20.0", updates: [] }),
  }),
  caches: { keys: async () => [] },
  requestAnimationFrame() {},
  setTimeout,
  clearTimeout,
  document: {
    body: createElement("body"),
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
assert.equal(game.audio.getBGMVolume(), 0.7, "default BGM volume should be 70 percent");
assert.equal(game.audio.getSEVolume(), 0.8, "default SE volume should be 80 percent");
game.audio.setBGMVolume(0.55);
game.audio.setSEVolume(0.65);
assert.equal(JSON.parse(localStorageData.get("pollenDestroySlipperAudioSettings")).bgmVolume, 0.55);
game.audio.playBGM("stage1");
game.audio.setMute(true);
assert.equal(game.audio.currentBGM.volume, 0, "master mute should silence BGM");
game.audio.setMute(false);
assert.equal(game.audio.currentBGM.volume, 0.55, "unmute should restore the saved BGM volume");
assert.equal(
  Array.from(game.titleMenu.items, (item) => item.label).join("|"),
  "START GAME|STAGE SELECT|OPTIONS|HOW TO PLAY|HIGH SCORE",
  "title menu should expose Stage Select and the existing entries"
);
game.openOptions();
assert.equal(game.titlePanel, "options");
assert.equal(game.optionsMenu.items.length, 4, "options should contain BGM, SE, mute and back");
const bgmBeforeTouch = game.audio.getBGMVolume();
game.handleCanvasTap({ clientX: 350, clientY: 370 });
assert.equal(game.audio.getBGMVolume(), Math.min(1, bgmBeforeTouch + 0.05), "options touch right side should increase BGM");
game.optionsMenu.index = 1;
const seBeforeGamepad = game.audio.getSEVolume();
game.handleGamepadMenu(Array(16).fill(false), (index) => index === 15, 0, 0, game.optionsMenu);
assert.equal(game.audio.getSEVolume(), Math.min(1, seBeforeGamepad + 0.05), "Xbox right input should increase SE volume");
game.optionsMenu.index = 2;
game.activateOptionItem();
assert.equal(game.audio.settings.masterMute, true, "master mute option should toggle on");
game.activateOptionItem();
assert.equal(game.audio.settings.masterMute, false, "master mute option should toggle off");
game.closeOptions();
assert.equal(game.titlePanel, "main");

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

game.grazeCount = 0;
const grazeBullet = {
  x: game.player.hitPoint.x + 20,
  y: game.player.hitPoint.y,
  r: 3,
  grazed: false,
};
game.enemyBullets = [grazeBullet];
const grazeScoreBefore = game.score.value;
game.resolveCollisions();
assert.equal(game.grazeCount, 1, "near miss should add one graze");
assert.equal(grazeBullet.grazed, true, "same enemy bullet should remember its graze");
assert.ok(game.score.value > grazeScoreBefore, "graze should add score");
game.resolveCollisions();
assert.equal(game.grazeCount, 1, "same enemy bullet must not graze twice");
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

game.input.touchActive = false;
canvas.dispatch("pointerdown", {
  button: 0,
  pointerType: "touch",
  pointerId: 7,
  clientX: 120,
  clientY: 500,
  preventDefault() {},
});
assert.equal(game.input.touchActive, false, "left side touch should not start movement");
canvas.dispatch("pointerdown", {
  button: 0,
  pointerType: "touch",
  pointerId: 8,
  clientX: 340,
  clientY: 500,
  preventDefault() {},
});
assert.equal(game.input.touchActive, true, "right side touch should start movement");
assert.equal(game.input.joystickOriginX, 340, "virtual joystick should start at the right thumb position");
canvas.dispatch("pointerup", { pointerType: "touch" });

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
game.audio.lastSETime.delete("item_p_small");
game.resolveCollisions();
assert.equal(game.powerItems.includes(collectible), false, "collected power item should be removed immediately");
assert.equal(collectible.collected, true, "collected flag should be set");
assert.equal(collectible.active, false, "collected power item should become inactive");
assert.equal(game.power.value, 1, "power value should increase once");
assert.equal(game.followers.length, 0, "power below the first threshold should not deploy a follower");
assert.equal(game.audio.activeSE.get("item_p_small").size, 1, "small power item should play its collection sound");
assert.equal(game.collectPowerItem(collectible), false, "same power item must not be collected twice");
assert.equal(game.power.value, 1, "duplicate collection must not increase power");
game.power.value = 3;
game.syncFollowers();
assert.equal(game.followers.length, 1, "power threshold 3 should deploy the first follower");

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
assert.equal(game.dialogue.resolveSpeaker("player"), "寿立覇王");
assert.equal(game.dialogue.resolveSpeaker("boss"), "スギノミコト");
game.enemyBullets = [];
game.playerSpellCutin = 40;
game.draw();
assert.ok(game.getCutinSlideX(82, 82, 1) > 0, "Haou cut-in should start outside the right edge");
assert.equal(game.getCutinSlideX(50, 82, 1), 0, "Haou cut-in should stop in the center");
assert.ok(game.getCutinSlideX(5, 82, 1) < 0, "Haou cut-in should leave through the left edge");
game.dialogue.completeNow();

game.state.mode = "stage";
game.state.time = 3420;
game.spawnStageEnemies();
assert.ok(game.boss, "boss should spawn at the end of the stage");
game.boss.entered = true;
assert.equal(game.boss.spellCards.length, 3, "boss battle should have three phases");
game.boss.beginCurrentCard(game);
const finishBossCardTransition = () => {
  game.pendingBossCardStart = 0;
  game.boss.transitioning = false;
  game.boss.beginCurrentCard(game);
};
assert.equal(game.bossSpellCutin, 0, "normal boss attack should not show a cut-in");
game.boss.currentCard.hp = 0;
game.boss.nextCard(game);
finishBossCardTransition();
assert.ok(game.bossSpellCutin > 0, "boss spell should start the Suginomikoto cut-in");
assert.equal(game.bossSpellCutinName, "大神威「無限飛散」", "boss cut-in should show the current spell name");
assert.ok(game.getCutinSlideX(74, 74, -1) < 0, "Suginomikoto cut-in should start outside the left edge");
game.draw();
assert.equal(game.boss.currentCard.survival, true, "second divine attack should be a survival phase");
const survivalHp = game.boss.currentCard.hp;
game.boss.takeDamage(game, 999);
assert.equal(game.boss.currentCard.hp, survivalHp, "survival boss should be invincible");
game.boss.currentCard.survivalTimer = 9.9;
game.boss.currentCard.update(game.boss, game, 0.1);
assert.equal(game.boss.currentCard.frenzy, true, "last ten seconds should enable frenzy mode");
game.boss.currentCard.survivalTimer = 0;
game.boss.update(game);
finishBossCardTransition();
assert.equal(game.boss.currentCard.survival, false, "survival completion should advance to the final HP phase");
assert.equal(game.boss.invincible, false, "boss should become vulnerable after survival");
while (game.boss && !game.boss.defeated) {
  game.boss.currentCard.hp = 0;
  game.boss.nextCard(game);
  if (game.pendingBossCardStart > 0) finishBossCardTransition();
  else if (game.pendingBossDefeat > 0) {
    game.pendingBossDefeat = 0;
    game.defeatBoss();
  }
}
assert.equal(game.dialogue.sceneName, "scene_clear", "boss defeat should start the clear dialogue");
game.dialogue.completeNow();
assert.equal(game.dialogue.sceneName, "scene_ending", "clear dialogue should lead to the ending");
game.dialogue.completeNow();
assert.equal(game.state.mode, "clear", "ending should finish on the clear screen");

game.save.data.clearFlags.stage1 = true;
game.refreshTitleMenu();
game.titlePanel = "stage";
assert.equal(game.stageSelectMenu.items[1].disabled, false, "clearing Stage1 should unlock Stage2");
game.start(false, false, "stage2");
assert.equal(game.currentStageId, "stage2", "Stage2 should become the active stage");
assert.equal(game.dialogue.active, false, "Stage2 should not pause for a stage-start dialogue");
assert.equal(game.state.stageName, "二面　檜風街道", "Stage2 title should be applied");
assert.equal(game.audio.currentBGMName, "stage2", "Stage2 should use its road theme slot");
assert.ok(game.background.image.src.includes("stage2_hinoki_road.jpg"), "Stage2 should use the Hinoki road background");
game.state.time = game.currentStage.bossTime;
game.spawnStageEnemies();
assert.equal(game.boss.name, "ヒノキ将軍", "Stage2 should spawn Hinoki Shogun");
game.boss.y = 117;
game.boss.update(game);
assert.equal(game.dialogue.sceneName, "stage2_boss_intro", "Hinoki Shogun arrival should use the dedicated intro scene");
assert.equal(game.dialogue.resolveSpeaker("player"), "寿立覇王", "Stage2 player name should resolve from dialogue context");
assert.equal(game.dialogue.resolveSpeaker("boss"), "ヒノキ将軍", "Stage2 boss name should resolve from dialogue context");
game.dialogue.skip();
for (let i = 0; i < 20 && game.dialogue.active; i += 1) game.dialogue.update();
assert.equal(game.audio.currentBGMName, "boss2", "Hinoki Shogun dialogue completion should switch boss BGM");
assert.ok(game.suginomikotoCutin.src.includes("hinoki_shogun_divine_attack.png"), "Stage2 should use the Hinoki cut-in");
assert.equal(game.boss.currentCard.survival, false, "Stage2 first phase should be an HP phase");
game.boss.currentCard.hp = 0;
game.boss.nextCard(game);
finishBossCardTransition();
assert.equal(game.boss.currentCard.survival, true, "Stage2 second phase should be survival");
const stage2SurvivalHp = game.boss.currentCard.hp;
game.boss.takeDamage(game, 9999);
assert.equal(game.boss.currentCard.hp, stage2SurvivalHp, "Stage2 survival should ignore all damage");
game.boss.currentCard.survivalTimer = 0;
game.boss.update(game);
finishBossCardTransition();
assert.equal(game.boss.currentCard.survival, false, "Stage2 survival should advance to the third phase");
assert.equal(game.boss.currentCard.pattern, "hinokiFinal", "Stage2 final phase should use its dedicated pattern");
game.boss.currentCard.hp = 0;
game.boss.nextCard(game);
game.pendingBossDefeat = 0;
game.defeatBoss();
assert.equal(game.dialogue.sceneName, "stage2_boss_defeat", "Stage2 boss defeat should use the dedicated defeat scene");
game.dialogue.completeNow();
assert.equal(game.dialogue.sceneName, "stage2_clear", "Stage2 defeat dialogue should lead to the short clear scene");
game.dialogue.completeNow();
assert.equal(game.state.mode, "clear", "Stage2 clear dialogue should finish on the clear result");
game.leaveClearScreen();
assert.equal(game.state.mode, "title", "leaving Stage2 clear should return to the title state");
assert.equal(game.titlePanel, "stage", "leaving Stage2 clear should open Stage Select");

console.log("smoke test passed");
