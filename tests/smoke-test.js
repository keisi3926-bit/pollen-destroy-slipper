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
    documentElement: createElement("html"),
    fullscreenElement: null,
    exitFullscreen() {
      this.fullscreenElement = null;
      return Promise.resolve();
    },
    getElementById(id) { return elements.get(id); },
    querySelector(selector) { return selector === ".update-panel" ? updatePanel : null; },
    createElement() { return createElement(); },
  },
};
sandbox.document.documentElement.requestFullscreen = () => {
  sandbox.document.fullscreenElement = sandbox.document.documentElement;
  return Promise.resolve();
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
  "START GAME|STAGE SELECT|OPTIONS|FULLSCREEN|HOW TO PLAY|HIGH SCORE",
  "title menu should expose Stage Select, Fullscreen and the existing entries"
);
assert.equal(game.fullscreen.supported, true, "fullscreen manager should detect the browser API");
assert.equal(game.fullscreen.label(), "FULLSCREEN OFF", "fullscreen menu label should expose the current state");
sandbox.document.fullscreenElement = sandbox.document.documentElement;
assert.equal(game.fullscreen.label(), "FULLSCREEN ON", "fullscreen menu label should update when active");
sandbox.document.fullscreenElement = null;
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
game.power.value = game.power.max - 1;
game.state.message = "";
game.collectPowerItem({
  x: game.player.x,
  y: game.player.y,
  r: 10,
  amount: 1,
  active: true,
  collected: false,
});
assert.equal(game.power.value, game.power.max, "power item should clamp at maximum");
assert.equal(game.state.message, "POWER MAX！", "POWER MAX should appear when power reaches maximum");
game.state.message = "";
const extraMaxScoreBefore = game.score.value;
game.collectPowerItem({
  x: game.player.x,
  y: game.player.y,
  r: 10,
  amount: 1,
  active: true,
  collected: false,
});
assert.equal(game.state.message, "", "extra power items at maximum must not repeat the POWER MAX message");
assert.equal(game.score.value, extraMaxScoreBefore + 500, "extra power at maximum should still convert to score");
game.power.loseOnMiss();
game.state.message = "";
game.collectPowerItem({
  x: game.player.x,
  y: game.player.y,
  r: 10,
  amount: 5,
  active: true,
  collected: false,
});
assert.equal(game.state.message, "POWER MAX！", "POWER MAX may appear again after power drops and recovers");
game.powerItems = [maxItem];
game.power.value = game.power.max;
const maxScoreBefore = game.score.value;
game.state.message = "";
game.resolveCollisions();
assert.equal(game.power.value, game.power.max, "power should never exceed maximum");
assert.ok(game.score.value > maxScoreBefore, "power item at maximum should convert to score");
assert.equal(game.powerItems.length, 0, "max-power item should also be removed immediately");
assert.equal(game.state.message, "", "maximum-power score conversion should not show POWER MAX again");

pointItem.x = game.player.x;
pointItem.y = game.player.y;
const pointScoreBefore = game.score.value;
game.resolveCollisions();
assert.equal(game.pointItems.length, 0, "point item should be removed immediately after collection");
assert.equal(pointItem.collected, true, "point item should set collected flag");
assert.equal(game.score.value, pointScoreBefore + pointItem.scoreValue, "point item should add its score value");

game.dialogue.start("scene_intro");
assert.equal(game.dialogue.resolvePortraitLine("left").portrait, "player.png");
assert.equal(game.dialogue.resolvePortraitLine("right"), null, "intro should not show an unused boss portrait");
game.dialogue.completeNow();
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
game.dialogue.start("scene_ending");
assert.equal(game.dialogue.resolvePortraitLine("left").portrait, "player.png");
assert.equal(game.dialogue.resolvePortraitLine("right"), null, "ending should not keep the boss portrait after defeat");
game.dialogue.completeNow();

game.state.mode = "stage";
game.state.time = 3420;
game.spawnStageEnemies();
assert.ok(game.boss, "boss should spawn at the end of the stage");
game.boss.entered = true;
assert.equal(game.boss.spellCards.length, 3, "boss battle should have three phases");
game.boss.beginCurrentCard(game);
assert.equal(game.currentStage.bossLabel, "一面ボス", "Stage1 boss banner should identify the first stage");
assert.equal(game.boss.currentCard.maxHp, 285, "NORMAL Stage1 phase one HP should use the tuned base and multiplier");
assert.equal(game.boss.currentCard.duration, 2100, "NORMAL Stage1 phase one should allow enough time for normal shots");
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
assert.equal(game.boss.currentCard.survivalDuration, 35, "NORMAL Stage1 survival should be shortened to 35 seconds");
const survivalHp = game.boss.currentCard.hp;
game.boss.takeDamage(game, 999);
assert.equal(game.boss.currentCard.hp, survivalHp, "survival boss should be invincible");
game.boss.currentCard.survivalTimer = 9.9;
game.boss.currentCard.update(game.boss, game, 0.1);
assert.equal(game.boss.currentCard.frenzy, true, "last ten seconds should enable frenzy mode");
game.boss.currentCard.survivalTimer = 0;
game.boss.update(game);
finishBossCardTransition();
assert.equal(game.boss.currentCard.pattern, "cedarFinal", "Suginomikoto final spell should restore the cedar lane laser pattern");
assert.equal(game.boss.currentCard.lifeBars, 3, "final divine attack should use three HP bars");
assert.equal(game.boss.currentCard.duration, 3000, "NORMAL final divine attack should allow more time per HP gauge");
game.boss.currentCard.hp = Math.floor(game.boss.currentCard.maxHp / 2);
game.boss.currentCard.age = game.boss.currentCard.duration;
game.boss.update(game);
assert.equal(game.boss.currentCard.remainingLifeBars, 2, "timing out a multi-gauge spell should advance to the next gauge");
assert.equal(game.boss.currentCard.hp, game.boss.currentCard.maxHp, "next gauge should start with full HP after a timeout failure");
assert.equal(game.pendingBossDefeat, 0, "timeout on a non-final gauge should not defeat the boss");

["stage2_boss_intro", "stage3_boss_intro"].forEach((sceneName) => {
  let completed = false;
  game.dialogue.start(sceneName, () => {
    completed = true;
  });
  assert.equal(game.dialogue.active, true, `${sceneName} should start`);
  game.dialogue.skip();
  for (let i = 0; i < 20 && game.dialogue.active; i += 1) game.dialogue.update();
  assert.equal(completed, true, `${sceneName} should support dialogue skip`);
});
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
assert.equal(game.currentStage.bossLabel, "二面ボス", "Stage2 boss banner should identify the second stage");
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
assert.equal(game.boss.currentCard.survivalDuration, 60, "Stage2 NORMAL survival duration should remain unchanged");
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

game.beginArcade();
assert.equal(game.currentMode, "arcade", "START GAME should enter arcade mode");
assert.equal(game.currentStageId, "stage1", "arcade mode should begin at Stage1");
game.dialogue.completeNow();
game.score.value = 54321;
game.score.extendIndex = 2;
game.life.lives = 5;
game.playerSpellCount = 1;
game.power.value = 12;
game.syncFollowers();
game.grazeCount = 234;
game.grazeMilestoneIndex = 1;
game.continuesLeft = 2;
game.continueCount = 1;
game.difficulty.set("hard");
game.state.mode = "clear";
game.clearAdvanceTimer = 1;
game.update();
assert.equal(game.currentStageId, "stage2", "arcade Stage1 clear should automatically advance to Stage2");
assert.equal(game.currentMode, "arcade", "automatic stage transition should preserve arcade mode");
assert.equal(game.score.value, 54321, "arcade transition should preserve score");
assert.equal(game.score.extendIndex, 2, "arcade transition should preserve extend progress");
assert.equal(game.life.lives, 5, "arcade transition should preserve slipper stock");
assert.equal(game.playerSpellCount, 1, "arcade transition should preserve spell stock");
assert.equal(game.power.value, 12, "arcade transition should preserve power");
assert.equal(game.followers.length, 3, "arcade transition should rebuild follower slippers from power level");
assert.equal(game.grazeCount, 234, "arcade transition should preserve graze count");
assert.equal(game.grazeMilestoneIndex, 1, "arcade transition should preserve graze milestone progress");
assert.equal(game.continuesLeft, 2, "arcade transition should preserve continues");
assert.equal(game.difficulty.current, "hard", "arcade transition should preserve difficulty");
assert.equal(game.checkpoints.current, 0, "a new arcade stage should reset its checkpoint");
assert.equal(game.stageStartScore, 54321, "Stage2 score accounting should begin at the carried total");
game.save.data.highScores.hard.stage2 = 0;
game.save.data.highScores.hard.total = 0;
game.score.value = 60000;
game.saveCurrentRun(false);
assert.equal(game.save.data.highScores.hard.stage2, 5679, "Stage2 high score should store only points earned in Stage2");
assert.equal(game.save.data.highScores.hard.total, 60000, "arcade total high score should store the carried run total");
game.state.mode = "clear";
game.leaveClearScreen();
assert.equal(game.currentStageId, "stage3", "arcade Stage2 clear should automatically advance to Stage3");
assert.equal(game.currentMode, "arcade", "Stage3 transition should preserve arcade mode");
assert.equal(game.score.value, 60000, "Stage3 transition should preserve the carried total score");
assert.equal(game.life.lives, 5, "Stage3 transition should preserve slipper stock");
assert.equal(game.power.value, 12, "Stage3 transition should preserve power");
assert.equal(game.grazeCount, 234, "Stage3 transition should preserve graze count");
assert.equal(game.stageStartScore, 60000, "Stage3 score accounting should begin at the carried total");
assert.equal(game.currentStage.boss.name, "ロード・ラグウィード", "Stage3 should define Lord Ragweed as its boss");
assert.equal(game.currentStage.bossLabel, "三面ボス", "Stage3 boss banner should identify the third stage");
assert.equal(game.currentStage.boss.spellCards[1].survival, true, "Stage3 second divine attack should be survival");
assert.ok(game.background.image.src.includes("stage3_autumn_pollen_road.png"), "Stage3 should use the autumn pollen road background");
game.save.data.highScores.hard.stage3 = 0;
game.score.value = 70000;
game.saveCurrentRun(false);
assert.equal(game.save.data.highScores.hard.stage3, 10000, "Stage3 high score should store only points earned in Stage3");
game.state.mode = "clear";
game.leaveClearScreen();
assert.equal(game.currentStageId, "stage4", "arcade Stage3 clear should automatically advance to Stage4");
assert.equal(game.currentMode, "arcade", "Stage4 transition should preserve arcade mode");
assert.equal(game.score.value, 70000, "Stage4 transition should preserve the carried total score");
assert.equal(game.currentStage.backgroundMode, "snowfield", "Stage4 should use the procedural snowfield fallback");
assert.equal(game.currentStage.boss.name, "シラカバ・プリースト", "Stage4 should define Shirakaba Priest as its boss");
assert.equal(game.currentStage.boss.spellCards.length, 3, "Stage4 boss should define three divine attacks");
assert.equal(game.currentStage.boss.spellCards[2].lifeBars, 3, "Stage4 final divine attack should use three HP bars");
game.spawnWave("birchPincer");
assert.ok(game.enemies.some((enemy) => enemy.family === "birch" && enemy.type === "large"), "Stage4 should spawn large birch enemies from both sides");
game.enemies = [];
game.state.time = game.currentStage.bossTime;
game.spawnStageEnemies();
assert.equal(game.boss.name, "シラカバ・プリースト", "Stage4 boss should spawn at the boss transition");
game.boss.y = 117;
game.boss.update(game);
assert.equal(game.dialogue.sceneName, "stage4_boss_intro", "Stage4 boss arrival should start its intro dialogue");
game.dialogue.skip();
for (let i = 0; i < 20 && game.dialogue.active; i += 1) game.dialogue.update();
assert.equal(game.boss.currentCard.pattern, "birchCrystalBarrier", "Stage4 intro completion should begin phase 1");
game.boss.cardIndex = 2;
game.boss.beginCurrentCard(game);
game.boss.currentCard.age = 165;
game.boss.currentCard.update(game.boss, game);
assert.ok(game.iceWalls.length > 0, "Stage4 final divine attack should create horizontal birch walls");
assert.ok(game.lastStage4SafeZones.length >= 1, "Stage4 wall pattern should always reserve a safe zone");
assert.ok(game.iceWalls.every((wall) => !game.lastStage4SafeZones.includes(wall.zone)), "Stage4 walls must not occupy reserved safe zones");
const blockedStage4Zones = new Set(game.iceWalls.map((wall) => wall.zone));
assert.ok(Array.from(blockedStage4Zones).every((zone) => game.iceWalls.filter((wall) => wall.zone === zone).length === 2), "each blocked zone should receive a paired wall from both sides");
const firstSafeStage4Zone = game.lastStage4SafeZones[0];
game.iceWalls = [];
game.boss.currentCard.age = 330;
game.boss.currentCard.update(game.boss, game);
assert.notEqual(game.lastStage4SafeZones[0], firstSafeStage4Zone, "safe zone history should prevent immediate repetition");
game.defeatBoss();
assert.equal(game.dialogue.sceneName, "stage4_boss_defeat", "Stage4 defeat should start its dedicated dialogue");
game.dialogue.skip();
for (let i = 0; i < 20 && game.dialogue.active; i += 1) game.dialogue.update();
assert.equal(game.state.mode, "clear", "Stage4 defeat dialogue should continue to the clear result");
game.save.data.highScores.hard.stage4 = 0;
game.score.value = 80000;
game.saveCurrentRun(false);
assert.equal(game.save.data.highScores.hard.stage4, 10000, "Stage4 high score should store only points earned in Stage4");
game.state.mode = "clear";
game.leaveClearScreen();
assert.equal(game.currentStageId, "stage5", "arcade Stage4 clear should automatically advance to Stage5");
assert.equal(game.currentMode, "arcade", "Stage5 transition should preserve arcade mode");
assert.equal(game.finalStageDirector.phase, "approach", "Stage5 should begin with the final approach");
assert.ok(game.background.image.src.includes("final-layered-worldscape.jpg"), "Stage5 should use the layered four-season background");
assert.equal(game.score.value, 80000, "Stage5 should preserve the arcade score");

game.state.time = game.currentStage.bossTime;
game.finalStageDirector.update();
const expectedRushNames = ["スギノミコト", "ヒノキ将軍", "ロード・ラグウィード", "シラカバ・プリースト"];
for (let rush = 0; rush < expectedRushNames.length; rush += 1) {
  assert.equal(game.finalStageDirector.phase, "rush", `boss rush ${rush + 1} should be active`);
  assert.equal(game.boss.name, expectedRushNames[rush], `boss rush ${rush + 1} should use the configured lord`);
  assert.equal(game.boss.spellCards.length, 1, "each rush boss should have one shortened HP bar");
  game.boss.currentCard.hp = 0;
  game.boss.nextCard(game, "hp-break");
  game.pendingBossDefeat = 0;
  game.defeatBoss();
  game.finalStageDirector.intermission = 1;
  game.finalStageDirector.update();
}

assert.equal(game.finalStageDirector.phase, "sovereign", "boss rush completion should summon Daikafun Taikun");
assert.equal(game.boss.name, "大花粉大君", "the sovereign form should use the configured boss name");
assert.equal(game.boss.spellCards.length, 5, "Daikafun Taikun should have five divine attacks");
for (let cardIndex = 0; cardIndex < 5; cardIndex += 1) {
  assert.equal(game.boss.cardIndex, cardIndex, `sovereign card ${cardIndex + 1} should run in order`);
  game.boss.currentCard.age = 0;
  game.boss.currentCard.update(game.boss, game);
  assert.equal(
    game.finalStageDirector.summons.length,
    cardIndex === 4 ? 4 : 1,
    `sovereign card ${cardIndex + 1} should show the configured invincible summons`
  );
  game.boss.currentCard.hp = 0;
  game.boss.nextCard(game, "hp-break");
  if (cardIndex < 4) finishBossCardTransition();
}
game.pendingBossDefeat = 0;
game.defeatBoss();
assert.equal(game.finalStageDirector.phase, "transform", "fifth divine attack should trigger transformation");
assert.equal(game.finalStageDirector.summons.length, 0, "transformation should remove all four summons");
game.finalStageDirector.transformation = 1;
game.finalStageDirector.update();
assert.equal(game.finalStageDirector.phase, "deity", "transformation should create Daikafun Daijin");
assert.equal(game.boss.name, "大花粉大神", "transformed boss name should be updated");
assert.equal(game.boss.currentCard.pattern, "finalCreationRite", "sixth divine attack should use the creation rite pattern");

game.boss.currentCard.hp = game.boss.currentCard.maxHp;
game.boss.currentCard.update(game.boss, game);
game.finalStageDirector.specialAge = 1;
game.boss.currentCard.update(game.boss, game);
assert.equal(game.finalStageDirector.glyphWarning.id, "heaven", "high HP should begin with the Heaven glyph warning");
for (let i = 0; i < 60; i += 1) game.finalStageDirector.updateSpecialHazards();
assert.ok(game.enemyBullets.some((bullet) => bullet.finalGlyph), "Heaven should be formed from collidable bullets");

game.boss.currentCard.hp = game.boss.currentCard.maxHp * 0.7;
game.boss.currentCard.update(game.boss, game);
assert.equal(game.finalStageDirector.creationSegment, "earth", "the next HP segment should switch to Earth");
game.finalStageDirector.specialAge = 1;
game.boss.currentCard.update(game.boss, game);
assert.equal(game.finalStageDirector.glyphWarning.id, "earth", "Earth should use its own coordinate template");

game.boss.currentCard.hp = game.boss.currentCard.maxHp * 0.4;
game.boss.currentCard.update(game.boss, game);
game.finalStageDirector.specialAge = 1;
game.boss.currentCard.update(game.boss, game);
assert.ok(game.finalStageDirector.magma, "Create should arm the rising magma hazard");
for (let i = 0; i < 80; i += 1) game.finalStageDirector.updateSpecialHazards();
assert.ok(game.finalStageDirector.getMagmaHeight(game.finalStageDirector.magma.age) > 0, "magma should rise after its warning");

game.boss.currentCard.hp = game.boss.currentCard.maxHp * 0.25;
game.boss.currentCard.update(game.boss, game);
game.finalStageDirector.specialAge = 1;
game.boss.currentCard.update(game.boss, game);
assert.ok(game.finalStageDirector.trackingLasers.length > 0, "Make should create a warned tracking laser");

game.boss.currentCard.hp = 0;
game.boss.nextCard(game, "hp-break");
game.pendingBossDefeat = 0;
game.defeatBoss();
game.finalStageDirector.intermission = 1;
game.finalStageDirector.update();
assert.equal(game.finalStageDirector.phase, "abyss", "sixth divine attack should lead to the Abyss bonus battle");
assert.equal(game.boss.name, "名も無き深淵（アビス）", "Abyss should use its dedicated boss name");
assert.equal(game.boss.currentCard.isSpell, false, "Abyss should use normal boss UI rather than divine attack UI");
assert.ok(game.boss.currentCard.maxHp >= 5000, "Abyss should have a very long HP bar");
game.boss.currentCard.age = 0;
game.boss.currentCard.update(game.boss, game);
assert.ok(game.enemyBullets.length > 0, "Abyss attack cycle should generate its first regular wave");

game.boss.currentCard.hp = 0;
game.boss.nextCard(game, "hp-break");
game.pendingBossDefeat = 0;
game.defeatBoss();
assert.equal(game.state.mode, "clear", "Abyss defeat should reach the ALL CLEAR result");
assert.equal(game.currentStage.clearMessage, "ALL CLEAR", "Stage5 result should identify the full clear");
assert.equal(game.save.data.clearFlags.stage5, true, "Stage5 clear should be saved without changing legacy keys");

game.beginStageSelect("stage2");
assert.equal(game.currentMode, "stageSelect", "Stage Select should enter practice mode");
assert.equal(game.score.value, 0, "practice mode should start with a fresh score");
assert.equal(game.life.lives, game.difficulty.config.initialLives, "practice mode should reset slipper stock");
assert.equal(game.playerSpellCount, 3, "practice mode should reset spell stock");
assert.equal(game.power.value, 0, "practice mode should reset power");
assert.equal(game.grazeCount, 0, "practice mode should reset graze");
game.state.mode = "clear";
game.leaveClearScreen();
assert.equal(game.titlePanel, "stage", "practice clear should return to Stage Select");

assert.equal(game.beginDebugStage("stage4", 2), true, "debug entry should open Stage4 phase 2 directly");
assert.equal(game.currentStageId, "stage4", "Stage4 debug entry should configure the requested stage");
assert.equal(game.boss.cardIndex, 1, "Stage4 debug phase should use one-based phase numbers");
assert.equal(game.boss.currentCard.pattern, "birchWhiteBlizzard", "Stage4 phase 2 debug entry should start the blizzard pattern");
assert.equal(game.boss.currentCard.survival, true, "Stage4 phase 2 should be a survival divine attack");
assert.equal(game.boss.invincible, true, "Stage4 survival phase should make the boss invincible");
assert.ok(game.player.invincible >= 3600, "debug phase entry should survive the brand splash and remain inspectable");
const stage4SurvivalHp = game.boss.currentCard.hp;
game.boss.takeDamage(game, 99999);
assert.equal(game.boss.currentCard.hp, stage4SurvivalHp, "Stage4 survival phase should ignore player and Nova damage");
game.boss.currentCard.age = 0;
game.boss.currentCard.update(game.boss, game);
assert.ok(game.decorativeSnowflakes.length > 0, "Stage4 survival should spawn decorative snowflakes separately");
assert.equal(game.enemyBullets.includes(game.decorativeSnowflakes[0]), false, "decorative snowflakes must not enter the collision bullet array");
game.boss.currentCard.survivalTimer = 0;
game.boss.update(game);
finishBossCardTransition();
assert.equal(game.boss.currentCard.pattern, "birchHorizontalBurial", "Stage4 survival timeout should advance to phase 3");
assert.equal(game.boss.invincible, false, "Stage4 survival completion should always release boss invincibility");
assert.equal(game.decorativeSnowflakes.length, 0, "Stage4 decorative snow should clear on phase transition");

const finalDebugTargets = [
  ["rush1", "rush", "スギノミコト", 0],
  ["rush2", "rush", "ヒノキ将軍", 0],
  ["rush3", "rush", "ロード・ラグウィード", 0],
  ["rush4", "rush", "シラカバ・プリースト", 0],
  ["taikun1", "sovereign", "大花粉大君", 0],
  ["taikun2", "sovereign", "大花粉大君", 1],
  ["taikun3", "sovereign", "大花粉大君", 2],
  ["taikun4", "sovereign", "大花粉大君", 3],
  ["taikun5", "sovereign", "大花粉大君", 4],
  ["daijin", "deity", "大花粉大神", 0],
  ["abyss", "abyss", "名も無き深淵（アビス）", 0],
];
for (const [target, expectedPhase, expectedBoss, expectedCard] of finalDebugTargets) {
  assert.equal(game.beginDebugStage("stage5", 0, target), true, `${target} debug entry should be available`);
  assert.equal(game.finalStageDirector.phase, expectedPhase, `${target} should select the requested final phase`);
  assert.equal(game.boss.name, expectedBoss, `${target} should create the requested boss`);
  assert.equal(game.boss.cardIndex, expectedCard, `${target} should select the requested card`);
  assert.ok(game.player.invincible >= 3600, `${target} should be safe behind the brand splash`);
}
assert.equal(game.beginDebugStage("stage5", 0, "clear"), true, "final clear debug entry should be available");
assert.equal(game.state.mode, "clear", "final clear debug entry should open ALL CLEAR directly");

game.beginStageSelect("stage1");
game.dialogue.active = false;
game.state.time = game.currentStage.bossTime;
game.spawnStageEnemies();
game.boss.entered = true;
game.boss.beginCurrentCard(game);
const continuedBoss = game.boss;
continuedBoss.currentCard.hp = 123;
continuedBoss.currentCard.failed = true;
game.state.mode = "gameover";
game.continuesLeft = 2;
game.continueCount = 0;
game.score.value = 10000;
game.continueFromCheckpoint();
assert.equal(game.state.mode, "stage", "continue should resume the current play state");
assert.equal(game.boss, continuedBoss, "continue should not recreate the boss fight");
assert.equal(game.boss.currentCard.hp, 123, "continue should preserve current boss HP");
assert.equal(game.boss.currentCard.failed, true, "continue should preserve failed bonus state for the current spell");
assert.equal(game.continuesLeft, 1, "continue should consume one continue");
assert.equal(game.continueCount, 1, "continue count should increase");
assert.equal(game.power.value, game.power.max, "continue should revive with full power");
assert.equal(game.life.lives, game.difficulty.config.initialLives, "continue should restore slipper stock without rewinding the boss");

console.log("smoke test passed");
