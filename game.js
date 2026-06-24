(() => {
  "use strict";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const slowButton = document.getElementById("slowButton");
  const spellButton = document.getElementById("spellButton");
  const menuButton = document.getElementById("menuButton");
  const updatePanel = document.querySelector(".update-panel");
  const updateToggle = document.getElementById("updateToggle");
  const updateBody = document.getElementById("updateBody");
  const appVersion = document.getElementById("appVersion");
  const updateStatus = document.getElementById("updateStatus");
  const updateList = document.getElementById("updateList");
  const checkUpdateButton = document.getElementById("checkUpdateButton");
  const reloadUpdateButton = document.getElementById("reloadUpdateButton");

  const W = canvas.width;
  const H = canvas.height;
  const TAU = Math.PI * 2;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const dist2 = (a, b) => {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return dx * dx + dy * dy;
  };
  const PORTRAIT_BASE = "assets/characters/";
  const BACKGROUND_STAGE1 = "assets/backgrounds/stage1_pollen_sando.png";
  const BGM_STAGE1 = "assets/audio/stage1_spring_pollen_path.mp3";
  const BGM_BOSS = "assets/audio/boss_suginomikoto.mp3";
  const AUDIO_SETTINGS_KEY = "pollenDestroySlipperAudioSettings";
  const BGM_SOURCES = {
    stage: BGM_STAGE1,
    boss: BGM_BOSS,
  };
  const SE_NAMES = [
    "item_p_small",
    "item_p_large",
    "power_up",
    "power_max",
    "follower_add",
    "cutin_haou_start",
    "cutin_haou_impact",
    "slipper_nova_charge",
    "slipper_nova_fire",
    "slipper_nova_end",
    "cutin_suginomikoto_start",
    "divine_bell",
    "pollen_charge",
    "pollen_release",
    "infinite_scatter",
    "player_hit",
    "menu_move",
    "menu_decide",
    "menu_cancel",
    "graze",
    "countdown_tick",
    "time_up",
    "spell_success",
    "spell_failed",
    "bonus_release",
    "point_item",
  ];
  const SE_COOLDOWNS = {
    item_p_small: 45,
    item_p_large: 80,
    menu_move: 55,
    pollen_charge: 250,
    pollen_release: 250,
  };
  const PLAYER_ASSET = "assets/characters/player.png";
  const BOSS_ASSET = "assets/characters/suginomikoto.png";
  const POLLEN_ENEMY_ASSET = "assets/enemies/pollen_enemies.png";
  const SLIPPER_NOVA_CUTIN_ASSET = "assets/cutin/haou_slipper_nova.png";
  const SUGINOMIKOTO_CUTIN_ASSET = "assets/cutin/suginomikoto_divine_attack.png";
  const PLAYER_CUTIN_FRAMES = 82;
  const BOSS_CUTIN_FRAMES = 74;
  const MOBILE_CONTROLS = {
    moveRegionStart: 0.45,
    joystickRadius: 42,
    knobRadius: 19,
  };
  const DIALOGUE_CONTEXT = {
    playerName: "寿立覇王",
    bossName: "スギノミコト",
  };
  const GRAZE_CONFIG = {
    radius: 27,
    scorePerGraze: 50,
    milestones: [100, 500, 1000],
  };
  const APP_VERSION = "0.22.0";
  const INITIAL_CONTINUES = 3;
  const CHECKPOINTS = [
    { id: 0, name: "STAGE START", time: 0 },
    { id: 1, name: "前半終了", time: 1150 },
    { id: 2, name: "後半開始", time: 2300 },
    { id: 3, name: "ボス直前", time: 3380 },
  ];
  const SCORE_VALUES = {
    enemySmall: 100,
    enemyMedium: 300,
    enemyLarge: 1000,
    bulletCancel: 10,
    normalBreak: 5000,
    spellBreak: 10000,
    noMissBreak: 20000,
    bossDefeat: 30000,
    stageClear: 50000,
    bossDamage: 8,
  };
  const POWER_CONFIG = {
    maxPower: 20,
    smallPValue: 1,
    largePValue: 5,
    maxSmallBonus: 500,
    maxLargeBonus: 2500,
  };
  const POWER_LEVELS = [
    { threshold: 0, level: 0 },
    { threshold: 3, level: 1 },
    { threshold: 7, level: 2 },
    { threshold: 12, level: 3 },
    { threshold: 20, level: 4 },
  ];
  const ENEMY_BULLET_LIMITS = {
    easy: 95,
    normal: 150,
    hard: 250,
  };
  const STAGE_WAVES = [
    { time: 120, pattern: "smallLine" },
    { time: 390, pattern: "mediumPair" },
    { time: 670, pattern: "smallSweep" },
    { time: 960, pattern: "largeEscort" },
    { time: 1240, pattern: "mediumTrio" },
    { time: 1530, pattern: "smallCross" },
    { time: 1840, pattern: "mediumPair" },
    { time: 2140, pattern: "largeSolo" },
    { time: 2430, pattern: "smallSweep" },
    { time: 2700, pattern: "mediumTrio" },
    { time: 2990, pattern: "largeEscort" },
    { time: 3240, pattern: "smallFinale" },
  ];
  const EXTEND_THRESHOLDS = [30000, 80000, 150000];
  const DIFFICULTY_CONFIG = {
    easy: {
      label: "EASY",
      bulletSpeedMultiplier: 0.7,
      bulletCountMultiplier: 0.55,
      enemyHpMultiplier: 0.75,
      bossHpMultiplier: 0.78,
      fireIntervalMultiplier: 1.55,
      spawnMultiplier: 0.65,
      safeGapMultiplier: 1.35,
      initialLives: 3,
    },
    normal: {
      label: "NORMAL",
      bulletSpeedMultiplier: 0.9,
      bulletCountMultiplier: 0.8,
      enemyHpMultiplier: 0.9,
      bossHpMultiplier: 0.95,
      fireIntervalMultiplier: 1.25,
      spawnMultiplier: 0.8,
      safeGapMultiplier: 1.15,
      initialLives: 3,
    },
    hard: {
      label: "HARD",
      bulletSpeedMultiplier: 1.18,
      bulletCountMultiplier: 1.2,
      enemyHpMultiplier: 1.15,
      bossHpMultiplier: 1.2,
      fireIntervalMultiplier: 0.95,
      spawnMultiplier: 1.05,
      safeGapMultiplier: 1.0,
      initialLives: 3,
    },
  };

  const addScore = (game, amount) => {
    game.score.add(amount);
    game.checkExtends();
  };

  class UpdateManager {
    constructor() {
      this.registration = null;
      this.waitingWorker = null;
      this.applyResponsiveDefault();
      this.bindUi();
    }

    applyResponsiveDefault() {
      if (!window.matchMedia("(max-width: 720px)").matches) return;
      updatePanel.classList.add("is-closed");
      updateToggle.setAttribute("aria-expanded", "false");
    }

    bindUi() {
      updateToggle.addEventListener("click", () => {
        const closed = updatePanel.classList.toggle("is-closed");
        updateToggle.setAttribute("aria-expanded", String(!closed));
      });
      checkUpdateButton.addEventListener("click", () => this.checkNow());
      reloadUpdateButton.addEventListener("click", () => this.applyUpdate());
      reloadUpdateButton.textContent = "キャッシュ更新して再読込";
    }

    async init() {
      await this.loadVersion();
      await this.registerServiceWorker();
    }

    async loadVersion() {
      try {
        const res = await fetch(`version.json?ts=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        appVersion.textContent = `v${data.version}`;
        updateStatus.textContent = data.status || "最新情報を取得済み";
        if (data.version && data.version !== APP_VERSION) {
          updateStatus.textContent = `v${data.version} を取得できます`;
          reloadUpdateButton.hidden = false;
        }
        updateList.innerHTML = "";
        (data.updates || []).slice(0, 4).forEach((item) => {
          const li = document.createElement("li");
          li.innerHTML = `<strong>${item.date} v${item.version}</strong><br>${item.summary}`;
          updateList.appendChild(li);
        });
      } catch (error) {
        appVersion.textContent = "local";
        updateStatus.textContent = "ローカル表示中";
        updateList.innerHTML = "<li>version.json はサーバー配信時に更新情報として表示されます。</li>";
      }
    }

    async registerServiceWorker() {
      if (!("serviceWorker" in navigator) || location.protocol === "file:") {
        updateStatus.textContent = "静的プレビュー中";
        return;
      }
      try {
        this.registration = await navigator.serviceWorker.register("sw.js");
        this.registration.addEventListener("updatefound", () => {
          const worker = this.registration.installing;
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) this.markUpdateReady(worker);
          });
        });
        if (this.registration.waiting) this.markUpdateReady(this.registration.waiting);
      } catch (error) {
        updateStatus.textContent = "更新管理は未登録";
      }
    }

    async checkNow() {
      updateStatus.textContent = "更新確認中";
      await this.loadVersion();
      if (this.registration) {
        await this.registration.update();
        updateStatus.textContent = this.waitingWorker ? "更新を適用できます" : "最新です";
      }
      reloadUpdateButton.hidden = false;
    }

    markUpdateReady(worker) {
      this.waitingWorker = worker;
      updateStatus.textContent = "更新を適用できます";
      reloadUpdateButton.hidden = false;
    }

    async applyUpdate() {
      if (!this.waitingWorker) {
        await this.clearRuntimeCaches();
        location.replace(`${location.pathname}?refresh=${Date.now()}`);
        return;
      }
      navigator.serviceWorker.addEventListener("controllerchange", () => location.reload(), { once: true });
      this.waitingWorker.postMessage({ type: "SKIP_WAITING" });
    }

    async clearRuntimeCaches() {
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((reg) => reg.unregister()));
      }
    }
  }

  // 会話データは speaker / text / portrait / side だけで管理する。
  // portrait に画像名を指定すると assets/characters/ から読み込み、無ければ自動でプレースホルダー表示になる。
  const DIALOGUE_SCENES = {
    scene_intro: [
      { speaker: "player", text: "春。参道には、今年も黄色い霧が降りた。", portrait: "player.png", side: "left" },
      { speaker: "player", text: "鼻を守る者は、もういない。", portrait: "player.png", side: "left" },
      { speaker: "player", text: "ならば行く。スリッパで。", portrait: "player.png", side: "left" },
    ],
    scene_boss: [
      { speaker: "player", text: "今年も来たか……", portrait: "player.png", side: "left" },
      { speaker: "player", text: "春の元凶。", portrait: "player.png", side: "left" },
      { speaker: "player", text: "全部叩く。", portrait: "player.png", side: "left" },
      { speaker: "boss", text: "愚かな人間よ。", portrait: "suginomikoto.png", side: "right" },
      { speaker: "boss", text: "花粉は生命の営み。", portrait: "suginomikoto.png", side: "right" },
      { speaker: "boss", text: "我らを滅ぼせば春は来ぬ。", portrait: "suginomikoto.png", side: "right" },
      { speaker: "player", text: "いや。", portrait: "player.png", side: "left" },
      { speaker: "player", text: "鼻水は止める。", portrait: "player.png", side: "left" },
      { speaker: "boss", text: "ならば試してみよ。", portrait: "suginomikoto.png", side: "right" },
      { speaker: "boss", text: "神威――", portrait: "suginomikoto.png", side: "right" },
      { speaker: "boss", text: "無限飛散。", portrait: "suginomikoto.png", side: "right" },
      { speaker: "player", text: "……来るか。", portrait: "player.png", side: "left" },
      { speaker: "boss", text: "これは神事。", portrait: "suginomikoto.png", side: "right" },
      { speaker: "boss", text: "花粉は祈り。", portrait: "suginomikoto.png", side: "right" },
      { speaker: "boss", text: "散ることこそ、春の証。", portrait: "suginomikoto.png", side: "right" },
      { speaker: "player", text: "知るか。", portrait: "player.png", side: "left" },
      { speaker: "player", text: "こっちは鼻が限界なんだよ。", portrait: "player.png", side: "left" },
      { speaker: "boss", text: "ならば受けよ。", portrait: "suginomikoto.png", side: "right" },
      { speaker: "boss", text: "神威『黄塵円舞』", portrait: "suginomikoto.png", side: "right" },
      { speaker: "player", text: "上等だ。", portrait: "player.png", side: "left" },
      { speaker: "player", text: "極履技『スリッパ・ノヴァ』で叩き落とす。", portrait: "player.png", side: "left" },
    ],
    scene_clear: [
      { speaker: "boss", text: "見事だ……", portrait: "suginomikoto.png", side: "right" },
      { speaker: "boss", text: "だが春は終わらぬ。", portrait: "suginomikoto.png", side: "right" },
      { speaker: "player", text: "来年も。", portrait: "player.png", side: "left" },
      { speaker: "player", text: "叩く。", portrait: "player.png", side: "left" },
      { speaker: "boss", text: "また会おう……", portrait: "suginomikoto.png", side: "right" },
    ],
    scene_ending: [
      { speaker: "system", text: "花粉滅殺完了", portrait: "player.png", side: "left" },
      { speaker: "player", text: "まだ終わりじゃない。", portrait: "player.png", side: "left" },
      { speaker: "player", text: "次の敵が待っている。", portrait: "player.png", side: "left" },
      { speaker: "system", text: "King of Slipper 外伝は続く。", portrait: "player.png", side: "left" },
    ],
  };

  class GameState {
    constructor() {
      this.mode = "title";
      this.stageName = "一面 春の花粉参道";
      this.time = 0;
      this.shake = 0;
      this.message = "";
      this.messageTimer = 0;
      this.bossNameTimer = 0;
    }

    resetRun(startTime = 0) {
      this.mode = "stage";
      this.time = startTime;
      this.shake = 0;
      this.message = "一面開始";
      this.messageTimer = 120;
      this.bossNameTimer = 0;
    }

    showMessage(text, frames = 120) {
      this.message = text;
      this.messageTimer = frames;
    }
  }

  class DifficultyManager {
    constructor() {
      this.current = "normal";
    }

    set(key) {
      if (DIFFICULTY_CONFIG[key]) this.current = key;
    }

    get config() {
      return DIFFICULTY_CONFIG[this.current];
    }

    get label() {
      return this.config.label;
    }

    next(delta) {
      const keys = Object.keys(DIFFICULTY_CONFIG);
      const index = keys.indexOf(this.current);
      this.current = keys[(index + delta + keys.length) % keys.length];
    }

    scaleCount(base) {
      return Math.max(1, Math.round(base * this.config.bulletCountMultiplier));
    }

    scaleSpeed(base) {
      return base * this.config.bulletSpeedMultiplier;
    }

    scaleFireInterval(base) {
      return Math.max(1, Math.round(base * this.config.fireIntervalMultiplier));
    }
  }

  class ScoreManager {
    constructor(game) {
      this.game = game;
      this.value = 0;
      this.extendIndex = 0;
    }

    reset() {
      this.value = 0;
      this.extendIndex = 0;
    }

    add(amount) {
      this.value += Math.max(0, Math.floor(amount));
    }

    reduceForContinue() {
      this.value = Math.floor(this.value * 0.8);
    }
  }

  class LifeManager {
    constructor(game) {
      this.game = game;
      this.lives = 3;
    }

    reset() {
      this.lives = this.game.difficulty.config.initialLives;
    }

    loseLife() {
      this.lives -= 1;
      return this.lives > 0;
    }

    extend() {
      this.lives += 1;
    }
  }

  class PowerManager {
    constructor() {
      this.max = POWER_CONFIG.maxPower;
      this.value = 0;
    }

    reset() {
      this.value = 0;
    }

    add(amount) {
      const before = this.value;
      this.value = clamp(this.value + amount, 0, this.max);
      return this.value - before;
    }

    loseOnMiss() {
      this.value = Math.max(0, this.value - 5);
    }

    get stage() {
      let level = 0;
      for (const entry of POWER_LEVELS) {
        if (this.value >= entry.threshold) level = entry.level;
      }
      return level;
    }

    get label() {
      return this.value >= this.max ? "MAX" : `${this.value}/${this.max}`;
    }
  }

  class CheckpointManager {
    constructor() {
      this.current = 0;
    }

    reset() {
      this.current = 0;
    }

    updateByTime(time) {
      for (const cp of CHECKPOINTS) {
        if (time >= cp.time && cp.id > this.current) this.current = cp.id;
      }
    }

    get currentPoint() {
      return CHECKPOINTS.find((cp) => cp.id === this.current) || CHECKPOINTS[0];
    }
  }

  class SaveManager {
    constructor() {
      this.key = "pollenDestroySlipperSave";
      this.data = this.load();
    }

    defaultData() {
      return {
        easy: { highScore: 0, maxCheckpoint: 0, cleared: false, continues: 0 },
        normal: { highScore: 0, maxCheckpoint: 0, cleared: false, continues: 0 },
        hard: { highScore: 0, maxCheckpoint: 0, cleared: false, continues: 0 },
        settings: { lastDifficulty: "normal", volume: 0.5, gamepadEnabled: true },
      };
    }

    load() {
      try {
        return { ...this.defaultData(), ...JSON.parse(localStorage.getItem(this.key) || "{}") };
      } catch {
        return this.defaultData();
      }
    }

    saveRun(difficulty, score, checkpoint, cleared, continues) {
      const current = this.data[difficulty] || this.defaultData()[difficulty];
      current.highScore = Math.max(current.highScore || 0, score);
      current.maxCheckpoint = Math.max(current.maxCheckpoint || 0, checkpoint);
      current.cleared = Boolean(current.cleared || cleared);
      current.continues = Math.max(current.continues || 0, continues);
      this.data[difficulty] = current;
      localStorage.setItem(this.key, JSON.stringify(this.data));
    }

    saveSettings(settings) {
      this.data.settings = { ...this.defaultData().settings, ...this.data.settings, ...settings };
      localStorage.setItem(this.key, JSON.stringify(this.data));
    }
  }

  class MenuManager {
    constructor(items = []) {
      this.items = items;
      this.index = 0;
      this.confirm = null;
    }

    setItems(items) {
      this.items = items;
      this.index = 0;
      this.confirm = null;
      this.skipDisabled(1);
    }

    move(delta) {
      if (this.confirm) {
        this.confirm.choice = this.confirm.choice === 0 ? 1 : 0;
        return;
      }
      this.index = (this.index + delta + this.items.length) % this.items.length;
      this.skipDisabled(delta || 1);
    }

    skipDisabled(delta) {
      let guard = 0;
      while (this.items[this.index]?.disabled && guard < this.items.length) {
        this.index = (this.index + delta + this.items.length) % this.items.length;
        guard += 1;
      }
    }

    selected() {
      return this.items[this.index];
    }
  }

  class Player {
    constructor() {
      this.x = W / 2;
      this.y = H - 90;
      this.r = 5;
      this.hitOffsetY = -6;
      this.cooldown = 0;
      this.invincible = 0;
      this.image = new Image();
      this.imageLoaded = false;
      this.image.onload = () => {
        this.imageLoaded = true;
      };
      this.image.src = `${PLAYER_ASSET}?v=${APP_VERSION}`;
      this.positionHistory = [];
    }

    reset() {
      this.x = W / 2;
      this.y = H - 90;
      this.cooldown = 0;
      this.invincible = 100;
      this.positionHistory = Array.from({ length: 30 }, () => ({ x: this.x, y: this.y }));
    }

    get hitPoint() {
      return { x: this.x, y: this.y + this.hitOffsetY };
    }

    update(input, bullets, game) {
      const slow = input.slow || input.gpSlow;
      const speed = slow ? 2.5 : 5;
      let mx = 0;
      let my = 0;

      if (input.left || input.gpLeft) mx -= 1;
      if (input.right || input.gpRight) mx += 1;
      if (input.up || input.gpUp) my -= 1;
      if (input.down || input.gpDown) my += 1;

      if (input.touchActive || input.mouseActive) {
        this.x += (input.touchX - this.x) * (slow ? 0.15 : 0.26);
        this.y += (input.touchY - this.y) * (slow ? 0.15 : 0.26);
      } else if (mx || my) {
        const len = Math.hypot(mx, my) || 1;
        this.x += (mx / len) * speed;
        this.y += (my / len) * speed;
      }

      this.x = clamp(this.x, 24, W - 24);
      this.y = clamp(this.y, 50, H - 36);
      this.positionHistory.unshift({ x: this.x, y: this.y });
      if (this.positionHistory.length > 32) this.positionHistory.length = 32;
      this.cooldown = Math.max(0, this.cooldown - 1);
      this.invincible = Math.max(0, this.invincible - 1);

      if ((input.fire || input.gpFire || input.touchActive) && this.cooldown <= 0) {
        this.shoot(bullets, game?.power.stage || 0);
        if (game) game.shootFollowers();
        this.cooldown = slow ? 7 : 6;
      }
    }

    shoot(bullets, powerStage) {
      const colors = ["#bdf6ff", "#a9efff", "#7ee5ff", "#74f1d1", "#fff0a8"];
      const color = colors[powerStage];
      if (powerStage === 0) {
        bullets.push(new Bullet(this.x, this.y - 24, 0, -10, 4, "player", color, { damage: 1 }));
        return;
      }

      const sideOffset = powerStage >= 3 ? 11 : 8;
      const radius = powerStage >= 4 ? 6 : powerStage >= 2 ? 5 : 4;
      const damage = powerStage >= 4 ? 1.35 : powerStage >= 2 ? 1.15 : 1;
      bullets.push(new Bullet(this.x - sideOffset, this.y - 18, powerStage >= 3 ? -0.16 : 0, -9.4, radius, "player", color, { damage }));
      bullets.push(new Bullet(this.x + sideOffset, this.y - 18, powerStage >= 3 ? 0.16 : 0, -9.4, radius, "player", color, { damage }));
      if (powerStage >= 2) {
        bullets.push(new Bullet(this.x, this.y - 27, 0, -10.4, powerStage >= 4 ? 7 : 5, "player", "#efffff", {
          damage: powerStage >= 4 ? 1.65 : 1.25,
        }));
      }
      if (powerStage >= 4) {
        bullets.push(new Bullet(this.x - 20, this.y - 12, -0.3, -9, 4, "player", "#fff0a8", { damage: 0.8 }));
        bullets.push(new Bullet(this.x + 20, this.y - 12, 0.3, -9, 4, "player", "#fff0a8", { damage: 0.8 }));
      }
    }

    hit(game) {
      if (this.invincible > 0 || game.state.mode !== "stage") return;
      const hadLives = game.life.loseLife();
      game.playerSpellCount = 3;
      game.power.loseOnMiss();
      game.missedDuringCard = true;
      if (game.boss?.currentCard?.survival) game.boss.currentCard.failed = true;
      game.state.shake = 18;
      this.invincible = 130;
      game.cancelEnemyBullets(true);
      game.audio.playSE("player_hit", { cooldown: 120, maxVoices: 1 });
      game.spawnBurst(this.hitPoint.x, this.hitPoint.y, "#eafcff", 18);
      game.state.showMessage(hadLives ? "MISS - 復帰！" : "GAME OVER", 90);
      if (!hadLives) game.openGameOverMenu();
    }

    draw(ctx, t) {
      ctx.save();
      ctx.translate(this.x, this.y);
      if (this.invincible > 0 && Math.floor(t / 5) % 2 === 0) ctx.globalAlpha = 0.45;

      if (this.imageLoaded) {
        this.drawCharacterShip(ctx, t);
        ctx.restore();
        return;
      }

      // 画像が読めない場合のフォールバック。
      ctx.fillStyle = "#6ec6ff";
      ctx.strokeStyle = "#dff9ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 27, 0.08, 0, TAU);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-8, -6);
      ctx.quadraticCurveTo(0, -18, 8, -6);
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(0, this.hitOffsetY, this.r, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    drawCharacterShip(ctx, t) {
      const pulse = 0.75 + Math.sin(t * 0.12) * 0.12;
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      const aura = ctx.createRadialGradient(0, -4, 4, 0, -4, 34);
      aura.addColorStop(0, `rgba(154, 238, 255, ${0.38 + pulse * 0.12})`);
      aura.addColorStop(1, "rgba(154, 238, 255, 0)");
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, -4, 34, 0, TAU);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(-25, -39, 50, 58, 14);
      ctx.clip();
      // 元画像は正方形で余白があるため、キャラ全身部分をクロップして自機サイズに収める。
      ctx.drawImage(this.image, 245, 12, 545, 960, -25, -39, 50, 58);
      ctx.restore();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(0, this.hitOffsetY, this.r, 0, TAU);
      ctx.fill();
    }
  }

  class CollectibleItem {
    constructor(x, y, radius, fallSpeed, options = {}) {
      this.x = x;
      this.y = y;
      this.r = radius;
      this.fallSpeed = fallSpeed;
      this.vx = options.vx ?? 0;
      this.vy = options.vy ?? fallSpeed;
      this.gravity = options.gravity ?? 0;
      this.drag = options.drag ?? 1;
      this.autoCollectAt = options.autoCollectAt ?? 0;
      this.age = 0;
      this.collected = false;
      this.active = true;
      this.autoCollect = false;
    }

    update(player) {
      this.age += 1;
      if (player.y <= H * 0.2 || (this.autoCollectAt > 0 && this.age >= this.autoCollectAt)) this.autoCollect = true;
      if (this.autoCollect) {
        const target = player.hitPoint;
        const angle = Math.atan2(target.y - this.y, target.x - this.x);
        const speed = 7.5 + Math.min(5, this.age * 0.035);
        this.x += Math.cos(angle) * speed;
        this.y += Math.sin(angle) * speed;
      } else {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= this.drag;
        this.vy += this.gravity;
      }
    }

    offscreen() {
      return this.y > H + 30;
    }
  }

  class PowerItem extends CollectibleItem {
    constructor(x, y, amount = 1, options = {}) {
      super(x, y, amount >= 5 ? 13 : 9, amount >= 5 ? 1.05 : 1.3, options);
      this.amount = amount;
    }

    draw(ctx) {
      if (!this.active || this.collected) return;
      ctx.save();
      ctx.translate(this.x, this.y);
      const pulse = 1 + Math.sin(this.age * 0.15) * 0.08;
      ctx.scale(pulse, pulse);
      ctx.fillStyle = this.amount >= 5 ? "#ffd85c" : "#78d9ff";
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, this.r, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#17261d";
      ctx.font = `900 ${this.amount >= 5 ? 15 : 12}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("P", 0, 1);
      ctx.restore();
    }
  }

  class PointItem extends CollectibleItem {
    constructor(x, y, scoreValue, options = {}) {
      super(x, y, scoreValue >= 1200 ? 12 : 9, scoreValue >= 1200 ? 0.95 : 1.2, options);
      this.scoreValue = scoreValue;
    }

    draw(ctx) {
      if (!this.active || this.collected) return;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(Math.PI / 4 + Math.sin(this.age * 0.08) * 0.08);
      const pulse = 1 + Math.sin(this.age * 0.16) * 0.07;
      ctx.scale(pulse, pulse);
      ctx.fillStyle = this.scoreValue >= 1200 ? "#b86cff" : "#d58cff";
      ctx.strokeStyle = "#fff0ff";
      ctx.lineWidth = 2;
      ctx.fillRect(-this.r * 0.72, -this.r * 0.72, this.r * 1.44, this.r * 1.44);
      ctx.strokeRect(-this.r * 0.72, -this.r * 0.72, this.r * 1.44, this.r * 1.44);
      ctx.rotate(-Math.PI / 4 - Math.sin(this.age * 0.08) * 0.08);
      ctx.fillStyle = "#ffffff";
      ctx.font = `900 ${this.scoreValue >= 1200 ? 12 : 10}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("点", 0, 1);
      ctx.restore();
    }
  }

  class FollowerSlipper {
    constructor(index) {
      this.index = index;
      this.x = W / 2;
      this.y = H - 70;
    }

    update(player, slow) {
      if (slow) {
        const formations = [
          { x: -34, y: 6 },
          { x: 34, y: 6 },
          { x: -62, y: 18 },
          { x: 62, y: 18 },
        ];
        const target = formations[this.index];
        this.x += (player.x + target.x - this.x) * 0.28;
        this.y += (player.y + target.y - this.y) * 0.28;
        return;
      }
      const delays = [6, 12, 18, 24];
      const target = player.positionHistory[delays[this.index]] || player;
      this.x += (target.x - this.x) * 0.34;
      this.y += (target.y - this.y) * 0.34;
    }

    draw(ctx, t) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(-0.1 + Math.sin(t * 0.08 + this.index) * 0.08);
      ctx.fillStyle = "#72d8ef";
      ctx.strokeStyle = "#eaffff";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, 6, 13, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-3, -2);
      ctx.quadraticCurveTo(0, -7, 3, -2);
      ctx.stroke();
      ctx.restore();
    }
  }

  class Bullet {
    constructor(x, y, vx, vy, r, owner, color = null, extra = {}) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.r = r;
      this.owner = owner;
      this.color = color || (owner === "player" ? "#bdf6ff" : "#f3b43f");
      this.age = 0;
      this.wave = extra.wave || 0;
      this.phase = extra.phase || 0;
      this.damage = extra.damage || 1;
      this.shape = extra.shape || "orb";
      this.grazed = false;
    }

    update() {
      this.age += 1;
      this.x += this.vx + Math.sin(this.age * 0.08 + this.phase) * this.wave;
      this.y += this.vy;
    }

    offscreen() {
      return this.x < -40 || this.x > W + 40 || this.y < -60 || this.y > H + 60;
    }

    draw(ctx) {
      ctx.save();
      if (this.shape === "needle") {
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.atan2(this.vy, this.vx) + Math.PI / 2);
        ctx.fillStyle = this.color;
        ctx.strokeStyle = "rgba(255,255,255,0.45)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -13);
        ctx.lineTo(-4, 9);
        ctx.lineTo(4, 9);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        return;
      }
      const g = ctx.createRadialGradient(this.x, this.y, 1, this.x, this.y, this.r * 2.2);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.45, this.color);
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * 2.1, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  const POLLEN_SPRITES = {
    large: {
      sx: 0,
      sy: 0,
      sw: 1 / 3,
      sh: 1,
      displayWidth: 96,
      displayHeight: 96,
    },
    medium: {
      sx: 1 / 3,
      sy: 0,
      sw: 1 / 3,
      sh: 1,
      displayWidth: 66,
      displayHeight: 66,
    },
    small: {
      sx: 2 / 3,
      sy: 0,
      sw: 1 / 3,
      sh: 1,
      displayWidth: 42,
      displayHeight: 42,
    },
  };

  class PollenSpriteSheet {
    constructor(src) {
      this.image = new Image();
      this.loaded = false;
      this.failed = false;
      this.image.onload = () => {
        this.loaded = true;
      };
      this.image.onerror = () => {
        this.failed = true;
      };
      this.image.src = `${src}?v=${APP_VERSION}`;
    }

    draw(ctx, type) {
      const sprite = POLLEN_SPRITES[type];
      if (!sprite || !this.loaded || this.failed) return false;
      const iw = this.image.width;
      const ih = this.image.height;
      ctx.drawImage(
        this.image,
        Math.round(iw * sprite.sx),
        Math.round(ih * sprite.sy),
        Math.round(iw * sprite.sw),
        Math.round(ih * sprite.sh),
        -sprite.displayWidth / 2,
        -sprite.displayHeight / 2,
        sprite.displayWidth,
        sprite.displayHeight
      );
      return true;
    }
  }

  const pollenSpriteSheet = new PollenSpriteSheet(POLLEN_ENEMY_ASSET);
  const POLLEN_ENEMY_CONFIG = {
    small: { radius: 12, hp: 5, speed: 2.15, fireInterval: 155, score: SCORE_VALUES.enemySmall },
    medium: { radius: 18, hp: 12, speed: 1.3, fireInterval: 132, score: SCORE_VALUES.enemyMedium },
    large: { radius: 29, hp: 34, speed: 0.78, fireInterval: 112, score: SCORE_VALUES.enemyLarge },
  };

  class Enemy {
    constructor(x, y, type = "medium", movement = "drift") {
      const config = POLLEN_ENEMY_CONFIG[type] || POLLEN_ENEMY_CONFIG.medium;
      this.x = x;
      this.y = y;
      this.type = type;
      this.movement = movement;
      this.age = 0;
      this.r = config.radius;
      this.hp = config.hp;
      this.speed = config.speed;
      this.scoreValue = config.score;
      this.baseX = x;
      this.fireCooldown = 70 + Math.floor(Math.random() * 45);
      this.destroyed = false;
    }

    update(game) {
      this.age += 1;
      if (this.movement === "sine") {
        this.x = this.baseX + Math.sin(this.age * 0.045) * (this.type === "small" ? 82 : 62);
        this.y += this.speed;
      } else if (this.movement === "zigzag") {
        this.x = this.baseX + Math.sin(this.age * 0.075) * 48;
        this.y += this.speed * 1.05;
      } else {
        this.y += this.speed;
      }

      this.fireCooldown -= 1;
      if (this.fireCooldown <= 0 && this.y > 28 && this.y < H - 120) this.fire(game);
    }

    fire(game) {
      const config = POLLEN_ENEMY_CONFIG[this.type];
      const playerHit = game.player.hitPoint;
      const aim = Math.atan2(playerHit.y - this.y, playerHit.x - this.x);
      if (this.type === "small") {
        const speed = game.difficulty.scaleSpeed(1.72);
        game.spawnEnemyBullet(new Bullet(this.x, this.y, Math.cos(aim) * speed, Math.sin(aim) * speed, 5, "enemy", "#f4c64e"));
      } else if (this.type === "medium") {
        const count = game.difficulty.current === "easy" ? 1 : 3;
        for (let i = 0; i < count; i += 1) {
          const offset = count === 1 ? 0 : (i - 1) * 0.18;
          const speed = game.difficulty.scaleSpeed(1.58);
          game.spawnEnemyBullet(new Bullet(this.x, this.y, Math.cos(aim + offset) * speed, Math.sin(aim + offset) * speed, 5, "enemy", "#f0bd42"));
        }
      } else {
        const count = game.difficulty.scaleCount(7);
        for (let i = 0; i < count; i += 1) {
          const offset = (i - (count - 1) / 2) * 0.15;
          const speed = game.difficulty.scaleSpeed(1.42 + (i % 2) * 0.12);
          game.spawnEnemyBullet(new Bullet(this.x, this.y, Math.cos(aim + offset) * speed, Math.sin(aim + offset) * speed, 6, "enemy", "#f2a93c"));
        }
      }
      this.fireCooldown = game.difficulty.scaleFireInterval(config.fireInterval + Math.floor(Math.random() * 30));
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      const bob = Math.sin(this.age * 0.09) * 2;
      ctx.translate(0, bob);
      if (pollenSpriteSheet.draw(ctx, this.type)) {
        ctx.restore();
        return;
      }
      ctx.fillStyle = "#f3d74f";
      ctx.strokeStyle = "#fff1a2";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, this.r, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.beginPath();
      ctx.arc(-5, -6, this.r * 0.28, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    offscreen() {
      return this.y > H + 70 || this.x < -120 || this.x > W + 120;
    }
  }

  class SpellCard {
    constructor({ name, duration, hp, pattern, type = "spell", survival = false, onStart = null, onUpdate = null, onEnd = null }) {
      this.name = name;
      this.duration = duration;
      this.hp = hp;
      this.maxHp = hp;
      this.pattern = pattern;
      this.type = type;
      this.survival = survival;
      this.frenzy = false;
      this.frenzyAnnounced = false;
      this.failed = false;
      this.lastCountdownSecond = null;
      this.onStart = onStart;
      this.onUpdate = onUpdate;
      this.onEnd = onEnd;
      this.age = 0;
    }

    start(boss, game) {
      this.age = 0;
      this.hp = this.maxHp;
      this.frenzy = false;
      this.frenzyAnnounced = false;
      this.failed = false;
      this.lastCountdownSecond = null;
      if (this.onStart) this.onStart(boss, game, this);
    }

    update(boss, game) {
      this.age += 1;
      const hpRatio = this.maxHp > 0 ? this.hp / this.maxHp : 0;
      const isFinalLife = boss.cardIndex === boss.spellCards.length - 1;
      this.frenzy = (this.survival && this.duration - this.age <= 600)
        || (!this.survival && isFinalLife && hpRatio <= 0.4);
      if (this.frenzy && !this.frenzyAnnounced) {
        this.frenzyAnnounced = true;
        game.state.showMessage(this.survival ? "発狂モード - LAST 10 SEC" : "発狂モード - HP 40%以下", 150);
        game.state.shake = Math.max(game.state.shake, 10);
      }
      if (this.survival) {
        const seconds = Math.ceil(Math.max(0, this.duration - this.age) / 60);
        if (seconds >= 1 && seconds <= 5 && seconds !== this.lastCountdownSecond) {
          this.lastCountdownSecond = seconds;
          game.audio.playSE("countdown_tick", { cooldown: 35, maxVoices: 1 });
        }
      }
      if (this.pattern && BOSS_PATTERNS[this.pattern]) BOSS_PATTERNS[this.pattern](boss, game, this);
      if (this.onUpdate) this.onUpdate(boss, game, this);
    }

    end(boss, game) {
      if (this.onEnd) this.onEnd(boss, game, this);
    }

    get isSpell() {
      return this.type === "spell";
    }
  }

  const BOSS_PATTERNS = {
    normalSpread(boss, game, card) {
      if (card.age % game.difficulty.scaleFireInterval(82) !== 1) return;
      const count = game.difficulty.scaleCount(22);
      for (let i = 0; i < count; i += 1) {
        const a = (i / count) * TAU + card.age * 0.012;
        const speed = game.difficulty.scaleSpeed(1.22);
        game.spawnEnemyBullet(new Bullet(boss.x, boss.y, Math.cos(a) * speed, Math.sin(a) * speed, 6, "enemy", "#f1bf45"));
      }
    },

    yellowDance(boss, game, card) {
      if (card.age % game.difficulty.scaleFireInterval(42) !== 1) return;
      const count = game.difficulty.scaleCount(28);
      const gap = Math.floor(card.age / 42) % count;
      const gapWidth = Math.max(2, Math.round(2 * game.difficulty.config.safeGapMultiplier));
      for (let i = 0; i < count; i += 1) {
        if (Math.abs(i - gap) <= 1 || Math.abs(i - gap - count) <= 1) continue;
        const wrapDiff = Math.abs(Math.atan2(Math.sin((i - gap) / count * TAU), Math.cos((i - gap) / count * TAU)));
        if (wrapDiff < (gapWidth / count) * TAU) continue;
        const a = (i / count) * TAU + card.age * 0.025;
        const speed = game.difficulty.scaleSpeed(0.92 + (i % 2) * 0.18);
        game.spawnEnemyBullet(new Bullet(boss.x, boss.y, Math.cos(a) * speed, Math.sin(a) * speed, 5, "enemy", "#f4d34a"));
      }
    },

    aimedPollen(boss, game, card) {
      if (card.age % game.difficulty.scaleFireInterval(54) !== 1) return;
      const playerHit = game.player.hitPoint;
      const base = Math.atan2(playerHit.y - boss.y, playerHit.x - boss.x);
      const side = game.difficulty.current === "easy" ? 1 : game.difficulty.current === "normal" ? 1 : 2;
      for (let i = -side; i <= side; i += 1) {
        const a = base + i * 0.16;
        const speed = game.difficulty.scaleSpeed(1.75);
        game.spawnEnemyBullet(new Bullet(boss.x, boss.y + 8, Math.cos(a) * speed, Math.sin(a) * speed, 6, "enemy", "#f0bd42"));
      }
    },

    needleRain(boss, game, card) {
      if (card.age % game.difficulty.scaleFireInterval(13) !== 1) return;
      const x = 30 + ((card.age * 47) % (W - 60));
      const drift = card.age % 56 < 12 ? (boss.x < W / 2 ? 0.7 : -0.7) : 0;
      game.spawnEnemyBullet(new Bullet(x, -16, drift, game.difficulty.scaleSpeed(2.15), 4, "enemy", "#d7c64a", { shape: "needle" }));
      if (game.difficulty.current !== "easy" && card.age % 52 === 1) {
        game.spawnEnemyBullet(new Bullet(W - x, -16, drift * -0.8, game.difficulty.scaleSpeed(1.95), 4, "enemy", "#f1de65", { shape: "needle" }));
      }
    },

    wavePollen(boss, game, card) {
      if (card.age % game.difficulty.scaleFireInterval(25) !== 1) return;
      const side = game.difficulty.current === "easy" ? 2 : 3;
      for (let i = -side; i <= side; i += 1) {
        game.spawnEnemyBullet(new Bullet(boss.x, boss.y + 20, i * 0.42, game.difficulty.scaleSpeed(1.82), 6, "enemy", "#ff9b45", {
          wave: game.difficulty.current === "easy" ? 0.75 : 1.05,
          phase: i * 0.9 + card.age * 0.03,
        }));
      }
    },

    sneezeCombo(boss, game, card) {
      boss.x += Math.sin(card.age * 0.18) * 2.0;
      BOSS_PATTERNS.wavePollen(boss, game, card);
      if (card.age % 64 === 1) BOSS_PATTERNS.aimedPollen(boss, game, card);
    },

    poorVisibility(boss, game, card) {
      if (card.age % game.difficulty.scaleFireInterval(58) !== 1) return;
      const count = game.difficulty.scaleCount(14);
      for (let i = 0; i < count; i += 1) {
        const a = (i / count) * TAU + card.age * 0.01;
        const speed = game.difficulty.scaleSpeed(0.9);
        game.spawnEnemyBullet(new Bullet(boss.x, boss.y, Math.cos(a) * speed, Math.sin(a) * speed, 6, "enemy", "rgba(242, 199, 79, 0.62)"));
      }
    },

    cedarBlockade(boss, game, card) {
      if (card.age % game.difficulty.scaleFireInterval(150) !== 1) return;
      const safeSlot = Math.floor((card.age / 128) % 4);
      for (let i = 0; i < 5; i += 1) {
        if (i === safeSlot) continue;
        const lx = 62 + i * 82;
        game.lasers.push({ x: lx, warn: 76, live: 42, age: 0, width: 15 });
      }
    },

    infiniteScatter(boss, game, card) {
      BOSS_PATTERNS.yellowDance(boss, game, card);
      BOSS_PATTERNS.wavePollen(boss, game, card);
      BOSS_PATTERNS.needleRain(boss, game, card);
      if (card.frenzy && card.age % game.difficulty.scaleFireInterval(72) === 1) {
        const playerHit = game.player.hitPoint;
        const base = Math.atan2(playerHit.y - boss.y, playerHit.x - boss.x);
        const count = game.difficulty.current === "easy" ? 3 : 5;
        for (let i = 0; i < count; i += 1) {
          const offset = (i - (count - 1) / 2) * 0.13;
          const speed = game.difficulty.scaleSpeed(1.65 + (i % 2) * 0.16);
          game.spawnEnemyBullet(new Bullet(
            boss.x,
            boss.y + 12,
            Math.cos(base + offset) * speed,
            Math.sin(base + offset) * speed,
            5,
            "enemy",
            "#ff6d4a"
          ));
        }
      }
    },
  };

  const BOSS_SPELL_LIBRARY = [
    { name: "神威「黄塵円舞」", pattern: "yellowDance", status: "stage1" },
    { name: "神威「針葉雨」", pattern: "needleRain", status: "stage1" },
    { name: "鼻撃神威「連続くしゃみ」", pattern: "sneezeCombo", status: "future" },
    { name: "春霞神威「視界不良」", pattern: "poorVisibility", status: "future" },
    { name: "神木神威「杉並木封鎖」", pattern: "cedarBlockade", status: "stage1" },
    { name: "大神威「無限飛散」", pattern: "infiniteScatter", status: "stage1" },
  ];

  class Boss {
    constructor() {
      this.x = W / 2;
      this.y = -95;
      this.r = 42;
      this.age = 0;
      this.attackAge = 0;
      this.entered = false;
      this.dialogueStarted = false;
      this.defeated = false;
      this.transitioning = false;
      this.name = DIALOGUE_CONTEXT.bossName;
      this.spellCards = this.createSpellCards();
      this.cardIndex = 0;
      this.currentCard = this.spellCards[0];
      this.hp = this.currentCard.hp;
      this.maxHp = this.currentCard.maxHp;
      this.image = new Image();
      this.imageLoaded = false;
      this.image.onload = () => {
        this.imageLoaded = true;
      };
      this.image.src = `${BOSS_ASSET}?v=${APP_VERSION}`;
    }

    update(game) {
      this.age += 1;

      if (!this.entered) {
        this.y += 1.6;
        if (this.y >= 118) {
          this.entered = true;
          this.dialogueStarted = true;
          this.attackAge = 0;
          game.startDialogue("scene_boss", () => {
            game.state.bossNameTimer = 170;
            game.state.showMessage("戦闘開始", 90);
            game.audio.playBoss();
            this.beginCurrentCard(game);
          });
        }
        return;
      }

      this.x = W / 2 + Math.sin(this.age * 0.018) * 78;
      if (!this.currentCard || this.defeated || this.transitioning) return;
      this.attackAge = this.currentCard.age;
      this.currentCard.update(this, game);
      this.hp = this.currentCard.hp;
      this.maxHp = this.currentCard.maxHp;
      if (this.currentCard.survival && this.currentCard.age >= this.currentCard.duration) {
        this.nextCard(game, "survival-timeout");
      } else if (!this.currentCard.survival && this.currentCard.hp <= 0) {
        this.nextCard(game, "hp-break");
      } else if (!this.currentCard.survival && this.currentCard.age >= this.currentCard.duration) {
        this.nextCard(game, "phase-timeout");
      }
    }

    createSpellCards() {
      return [
        new SpellCard({ name: "Phase 1 通常弾幕", duration: 720, hp: 360, pattern: "normalSpread", type: "normal" }),
        new SpellCard({ name: "神威「黄塵円舞」", duration: 900, hp: 430, pattern: "yellowDance" }),
        new SpellCard({ name: "大神威「無限飛散」", duration: 1800, hp: 560, pattern: "infiniteScatter" }),
      ];
    }

    beginCurrentCard(game) {
      this.currentCard = this.spellCards[this.cardIndex];
      if (!this.currentCard) return;
      this.currentCard.maxHp = Math.max(1, Math.round(this.currentCard.maxHp * game.difficulty.config.bossHpMultiplier));
      this.currentCard.start(this, game);
      this.hp = this.currentCard.hp;
      this.maxHp = this.currentCard.maxHp;
      this.enemyClearOnCardChange(game);
      if (this.currentCard.isSpell) {
        game.state.showMessage(this.currentCard.name, 135);
        game.startBossSpellCutin(this.currentCard.name);
      }
    }

    nextCard(game, reason = this.currentCard?.survival ? "survival-timeout" : "hp-break") {
      if (!this.currentCard) return;
      const clearedCard = this.currentCard;
      const hpBreak = reason === "hp-break";
      const survivalEnd = reason === "survival-timeout";
      const survivalSuccess = survivalEnd && !clearedCard.failed;

      if (survivalEnd) game.audio.playSE("time_up", { maxVoices: 1 });

      if (hpBreak) {
        addScore(game, clearedCard.isSpell ? SCORE_VALUES.spellBreak : SCORE_VALUES.normalBreak);
        if (!game.missedDuringCard) addScore(game, SCORE_VALUES.noMissBreak);
        game.state.showMessage(clearedCard.isSpell ? "神威突破！ BONUS!" : "BONUS!", 100);
        game.spawnBossPhaseBonus(this.x, this.y);
      } else if (survivalSuccess) {
        addScore(game, SCORE_VALUES.spellBreak + SCORE_VALUES.noMissBreak);
        game.state.showMessage("SUCCESS　神威突破！", 120);
        game.audio.playSE("spell_success", { maxVoices: 1 });
        game.spawnBossPhaseBonus(this.x, this.y);
      } else if (survivalEnd) {
        game.state.showMessage("FAILED　NO BONUS", 65);
        game.audio.playSE("spell_failed", { maxVoices: 1 });
      }

      game.missedDuringCard = false;
      clearedCard.end(this, game);
      this.cardIndex += 1;
      if (this.cardIndex >= this.spellCards.length) {
        this.enemyClearOnCardChange(game);
        this.transitioning = true;
        game.pendingBossDefeat = hpBreak || survivalSuccess ? 185 : 70;
        return;
      }
      this.beginCurrentCard(game);
    }

    takeDamage(game, amount) {
      if (!this.currentCard || this.defeated || !this.entered) return;
      if (this.currentCard.survival) return;
      this.currentCard.hp -= amount;
      this.hp = this.currentCard.hp;
      addScore(game, amount * SCORE_VALUES.bossDamage);
      if (this.currentCard.hp <= 0) this.nextCard(game, "hp-break");
    }

    enemyClearOnCardChange(game) {
      game.enemyBullets = [];
      game.lasers = [];
      for (let i = 0; i < 18; i += 1) {
        game.particles.push(new Particle(this.x + (Math.random() - 0.5) * 90, this.y + (Math.random() - 0.5) * 60, "#fff0a2"));
      }
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      if (this.imageLoaded) {
        this.drawBossImage(ctx);
        ctx.restore();
        return;
      }

      // 杉の神らしいシルエットを、三角の樹冠と面で表現する。
      ctx.fillStyle = "#2d8a48";
      ctx.strokeStyle = "#b9ffd0";
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i += 1) {
        ctx.beginPath();
        ctx.moveTo(0, -62 + i * 26);
        ctx.lineTo(-50 + i * 7, 2 + i * 18);
        ctx.lineTo(50 - i * 7, 2 + i * 18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      ctx.fillStyle = "#60451e";
      ctx.fillRect(-10, 28, 20, 42);
      ctx.fillStyle = "#dff6c7";
      ctx.beginPath();
      ctx.arc(-13, -6, 5, 0, TAU);
      ctx.arc(13, -6, 5, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "#17341f";
      ctx.beginPath();
      ctx.moveTo(-12, 12);
      ctx.quadraticCurveTo(0, 21, 13, 12);
      ctx.stroke();
      ctx.restore();
    }

    drawBossImage(ctx) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      const aura = ctx.createRadialGradient(0, 0, 18, 0, 0, 76);
      aura.addColorStop(0, "rgba(255, 221, 86, 0.32)");
      aura.addColorStop(1, "rgba(255, 221, 86, 0)");
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, 0, 76, 0, TAU);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(-50, -72, 100, 144, 12);
      ctx.clip();
      ctx.drawImage(this.image, 0, 0, 1024, 1536, -48, -72, 96, 144);
      ctx.restore();

      ctx.fillStyle = "rgba(255, 248, 181, 0.88)";
      ctx.beginPath();
      ctx.arc(0, 3, 5, 0, TAU);
      ctx.fill();
    }
  }

  class Particle {
    constructor(x, y, color) {
      this.x = x;
      this.y = y;
      const a = Math.random() * TAU;
      const s = 0.8 + Math.random() * 2.8;
      this.vx = Math.cos(a) * s;
      this.vy = Math.sin(a) * s;
      this.life = 26 + Math.random() * 26;
      this.maxLife = this.life;
      this.color = color;
      this.r = 2 + Math.random() * 3;
    }

    update() {
      this.life -= 1;
      this.x += this.vx;
      this.y += this.vy;
      this.vy += 0.015;
    }

    draw(ctx) {
      ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  class DialogueManager {
    constructor(scenes, portraitBase, dialogueContext) {
      this.scenes = scenes;
      this.portraitBase = portraitBase;
      this.dialogueContext = dialogueContext;
      this.cache = new Map();
      this.active = false;
      this.sceneName = "";
      this.lines = [];
      this.index = 0;
      this.charCount = 0;
      this.age = 0;
      this.fade = 0;
      this.closing = false;
      this.onComplete = null;
    }

    start(sceneName, onComplete = null) {
      const scene = this.scenes[sceneName];
      if (!scene || scene.length === 0) {
        if (onComplete) onComplete();
        return;
      }

      this.active = true;
      this.sceneName = sceneName;
      this.lines = scene;
      this.index = 0;
      this.charCount = 0;
      this.age = 0;
      this.fade = 0;
      this.closing = false;
      this.onComplete = onComplete;
      this.preloadScene(scene);
    }

    preloadScene(scene) {
      scene.forEach((line) => this.getPortrait(line.portrait));
    }

    getPortrait(fileName) {
      if (!fileName) return null;
      if (this.cache.has(fileName)) return this.cache.get(fileName);

      const record = { image: new Image(), loaded: false, failed: false };
      record.image.onload = () => {
        record.loaded = true;
      };
      record.image.onerror = () => {
        record.failed = true;
      };
      record.image.src = `${this.portraitBase}${fileName}?v=${APP_VERSION}`;
      this.cache.set(fileName, record);
      return record;
    }

    update() {
      if (!this.active) return;
      this.age += 1;
      if (this.closing) {
        this.fade = Math.max(0, this.fade - 0.08);
        if (this.fade <= 0) this.completeNow();
        return;
      }
      this.fade = Math.min(1, this.fade + 0.06);
      const line = this.currentLine();
      if (line) this.charCount = Math.min(line.text.length, this.charCount + 0.55);
    }

    currentLine() {
      return this.lines[this.index] || null;
    }

    resolveSpeaker(speaker) {
      if (speaker === "player") return this.dialogueContext.playerName;
      if (speaker === "boss") return this.dialogueContext.bossName;
      if (speaker === "system") return "";
      return speaker || "";
    }

    advance() {
      if (!this.active || this.closing) return;
      const line = this.currentLine();
      if (line && this.charCount < line.text.length) {
        this.charCount = line.text.length;
        return;
      }
      this.index += 1;
      if (this.index >= this.lines.length) {
        this.finish();
        return;
      }
      this.charCount = 0;
      this.age = 0;
    }

    skip() {
      if (!this.active || this.closing) return;
      this.finish();
    }

    finish() {
      this.closing = true;
    }

    completeNow() {
      const done = this.onComplete;
      this.active = false;
      this.closing = false;
      this.sceneName = "";
      this.lines = [];
      this.index = 0;
      this.charCount = 0;
      this.onComplete = null;
      if (done) done();
    }

    draw(ctx) {
      if (!this.active) return;
      const line = this.currentLine();
      if (!line) return;

      ctx.save();
      ctx.globalAlpha = this.fade;
      ctx.fillStyle = "rgba(0, 0, 0, 0.58)";
      ctx.fillRect(0, 0, W, H);

      this.drawPortrait(ctx, "left", line);
      this.drawPortrait(ctx, "right", line);
      this.drawWindow(ctx, line);
      ctx.restore();
    }

    resolvePortraitLine(side) {
      for (let i = this.index; i >= 0; i -= 1) {
        if (this.lines[i]?.side === side && this.lines[i].portrait) return this.lines[i];
      }
      for (let i = this.index + 1; i < this.lines.length; i += 1) {
        if (this.lines[i]?.side === side && this.lines[i].portrait) return this.lines[i];
      }
      return null;
    }

    drawPortrait(ctx, side, activeLine) {
      const isActive = activeLine.side === side;
      const portraitLine = isActive ? activeLine : this.resolvePortraitLine(side);
      const fileName = portraitLine?.portrait || null;
      const speaker = this.resolveSpeaker(portraitLine?.speaker) || (side === "left" ? this.dialogueContext.playerName : this.dialogueContext.bossName);
      const record = this.getPortrait(fileName);
      const w = 156;
      const h = 300;
      const baseX = side === "left" ? 24 : W - w - 24;
      const slide = isActive ? (1 - Math.min(1, this.age / 18)) * 34 : 0;
      const x = baseX + (side === "left" ? -slide : slide);
      const y = 118;

      ctx.save();
      ctx.globalAlpha *= isActive ? 1 : 0.28;
      if (record && record.loaded && !record.failed) {
        ctx.drawImage(record.image, x, y, w, h);
      } else {
        this.drawPlaceholder(ctx, x, y, w, h, speaker, side);
      }
      ctx.restore();
    }

    drawPlaceholder(ctx, x, y, w, h, label, side) {
      const grad = ctx.createLinearGradient(x, y, x, y + h);
      if (side === "left") {
        grad.addColorStop(0, "rgba(92, 196, 244, 0.92)");
        grad.addColorStop(1, "rgba(35, 96, 128, 0.92)");
      } else {
        grad.addColorStop(0, "rgba(88, 173, 93, 0.92)");
        grad.addColorStop(1, "rgba(37, 91, 48, 0.92)");
      }
      ctx.fillStyle = grad;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.58)";
      ctx.lineWidth = 2;
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
      ctx.fillRect(x + 14, y + h - 62, w - 28, 38);
      ctx.fillStyle = "#ffffff";
      ctx.font = "800 20px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label || "CHARACTER", x + w / 2, y + h - 43);
      ctx.textBaseline = "alphabetic";
    }

    drawWindow(ctx, line) {
      const pad = 22;
      const winH = H * 0.4;
      const y = H - winH;
      ctx.fillStyle = "rgba(0, 0, 0, 0.76)";
      ctx.fillRect(0, y, W, winH);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.32)";
      ctx.lineWidth = 2;
      ctx.strokeRect(0, y, W, winH);

      ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
      ctx.fillRect(pad, y + 18, 176, 36);
      ctx.fillStyle = "#fff4b8";
      ctx.font = "800 18px system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(this.resolveSpeaker(line.speaker), pad + 14, y + 42);

      ctx.fillStyle = "#f7fff0";
      ctx.font = "22px system-ui, sans-serif";
      this.drawWrappedText(ctx, line.text.slice(0, Math.floor(this.charCount)), pad + 12, y + 92, W - pad * 2 - 24, 34, 4);

      if (Math.floor(this.age / 22) % 2 === 0 && this.charCount >= line.text.length) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
        ctx.font = "14px system-ui, sans-serif";
        ctx.textAlign = "right";
        ctx.fillText("Z / Tap", W - pad, H - 20);
      }
    }

    drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
      const lines = [];
      let line = "";
      for (const ch of text) {
        const next = line + ch;
        if (ctx.measureText(next).width > maxWidth && line) {
          lines.push(line);
          line = ch;
          if (lines.length >= maxLines) break;
        } else {
          line = next;
        }
      }
      if (line && lines.length < maxLines) lines.push(line);
      lines.forEach((row, i) => ctx.fillText(row, x, y + i * lineHeight));
    }
  }

  class BackgroundManager {
    constructor(src) {
      this.image = new Image();
      this.loaded = false;
      this.failed = false;
      this.image.onload = () => {
        this.loaded = true;
      };
      this.image.onerror = () => {
        this.failed = true;
      };
      this.image.src = `${src}?v=${APP_VERSION}`;
    }

    draw(ctx, time) {
      if (!this.loaded || this.failed) return false;
      const scroll = (time * 0.22) % H;
      this.drawCover(ctx, -scroll);
      this.drawCover(ctx, H - scroll);
      this.blendLoopSeam(ctx, scroll);

      // 弾とUIが埋もれないよう、絵の良さを残しつつ少しだけ暗く落とす。
      const shade = ctx.createLinearGradient(0, 0, 0, H);
      shade.addColorStop(0, "rgba(16, 28, 17, 0.16)");
      shade.addColorStop(0.55, "rgba(13, 22, 14, 0.10)");
      shade.addColorStop(1, "rgba(3, 9, 7, 0.34)");
      ctx.fillStyle = shade;
      ctx.fillRect(0, 0, W, H);
      return true;
    }

    blendLoopSeam(ctx, scroll) {
      const seamY = H - scroll;
      const band = 104;
      if (seamY < -band || seamY > H + band) return;
      const top = clamp(seamY - band / 2, 0, H);
      const height = clamp(band, 0, H - top);
      if (height <= 0) return;

      ctx.save();
      const mist = ctx.createLinearGradient(0, top, 0, top + height);
      mist.addColorStop(0, "rgba(168, 176, 99, 0)");
      mist.addColorStop(0.35, "rgba(168, 176, 99, 0.22)");
      mist.addColorStop(0.5, "rgba(198, 188, 108, 0.36)");
      mist.addColorStop(0.65, "rgba(168, 176, 99, 0.22)");
      mist.addColorStop(1, "rgba(168, 176, 99, 0)");
      ctx.fillStyle = mist;
      ctx.fillRect(0, top, W, height);

      const shade = ctx.createLinearGradient(0, top, 0, top + height);
      shade.addColorStop(0, "rgba(20, 39, 25, 0)");
      shade.addColorStop(0.5, "rgba(20, 39, 25, 0.16)");
      shade.addColorStop(1, "rgba(20, 39, 25, 0)");
      ctx.fillStyle = shade;
      ctx.fillRect(0, top, W, height);
      ctx.restore();
    }

    drawCover(ctx, y) {
      const iw = this.image.width;
      const ih = this.image.height;
      const scale = Math.max(W / iw, H / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      const x = (W - dw) / 2;
      ctx.drawImage(this.image, x, y, dw, dh);
    }
  }

  class AudioManager {
    constructor() {
      this.settings = this.loadSettings();
      this.bgm = new Map();
      this.seSources = new Map();
      this.activeSE = new Map();
      this.lastSETime = new Map();
      this.currentBGM = null;
      this.currentBGMName = "";
      this.wasPlayingBeforePause = false;
      this.unlocked = false;
      this.audioContext = null;
      this.preload();
    }

    unlock() {
      this.unlocked = true;
      const Context = window.AudioContext || window.webkitAudioContext;
      if (Context && !this.audioContext) {
        try {
          this.audioContext = new Context();
        } catch (error) {
          console.warn("AudioContext could not be created", error);
        }
      }
      if (this.audioContext?.state === "suspended") {
        this.audioContext.resume().catch((error) => console.warn("AudioContext resume failed", error));
      }
    }

    preload() {
      for (const [name, src] of Object.entries(BGM_SOURCES)) {
        const audio = new Audio(`${src}?v=${APP_VERSION}`);
        audio.loop = true;
        audio.preload = "auto";
        audio.addEventListener?.("error", () => console.warn(`BGM load failed: ${name}`));
        audio.load?.();
        this.bgm.set(name, audio);
      }
      for (const name of SE_NAMES) {
        const src = `assets/audio/se/${name}.wav?v=${APP_VERSION}`;
        const audio = new Audio(src);
        audio.preload = "auto";
        audio.addEventListener?.("error", () => console.warn(`SE load failed: ${name}`));
        audio.load?.();
        this.seSources.set(name, src);
      }
      this.applyVolumes();
    }

    playBGM(name, loop = true) {
      const audio = this.bgm.get(name);
      if (!audio) {
        console.warn(`Unknown BGM: ${name}`);
        return;
      }
      this.unlock();
      if (this.currentBGM && this.currentBGM !== audio) this.currentBGM.pause();
      this.currentBGM = audio;
      this.currentBGMName = name;
      audio.loop = loop;
      audio.volume = this.settings.masterMute ? 0 : this.settings.bgmVolume;
      audio.play().catch((error) => console.warn(`BGM play failed: ${name}`, error));
    }

    stopBGM() {
      for (const audio of this.bgm.values()) {
        audio.pause();
        audio.currentTime = 0;
      }
      this.currentBGM = null;
      this.currentBGMName = "";
    }

    pauseBGM() {
      this.currentBGM?.pause();
    }

    resumeBGM() {
      if (!this.currentBGM || this.settings.masterMute) return;
      this.unlock();
      this.currentBGM.play().catch((error) => console.warn("BGM resume failed", error));
    }

    playSE(name, options = {}) {
      const src = this.seSources.get(name);
      if (!src || this.settings.masterMute || this.settings.seVolume <= 0) return null;
      const now = Date.now();
      const cooldown = options.cooldown ?? SE_COOLDOWNS[name] ?? 20;
      if (now - (this.lastSETime.get(name) || 0) < cooldown) return null;
      const voices = this.activeSE.get(name) || new Set();
      const maxVoices = options.maxVoices ?? 3;
      if (voices.size >= maxVoices) return null;

      this.lastSETime.set(name, now);
      this.unlock();
      const audio = new Audio(src);
      audio.volume = this.settings.seVolume;
      voices.add(audio);
      this.activeSE.set(name, voices);
      const release = () => voices.delete(audio);
      audio.addEventListener?.("ended", release, { once: true });
      audio.addEventListener?.("error", () => {
        release();
        console.warn(`SE play failed: ${name}`);
      }, { once: true });
      audio.play().catch((error) => {
        release();
        console.warn(`SE play failed: ${name}`, error);
      });
      return audio;
    }

    stopSE(name) {
      const voices = this.activeSE.get(name);
      if (!voices) return;
      for (const audio of voices) {
        audio.pause();
        audio.currentTime = 0;
      }
      voices.clear();
    }

    setBGMVolume(value) {
      this.settings.bgmVolume = clamp(value, 0, 1);
      this.applyVolumes();
      this.saveSettings();
    }

    setSEVolume(value) {
      this.settings.seVolume = clamp(value, 0, 1);
      this.applyVolumes();
      this.saveSettings();
    }

    getBGMVolume() {
      return this.settings.bgmVolume;
    }

    getSEVolume() {
      return this.settings.seVolume;
    }

    toggleMute() {
      this.setMute(!this.settings.masterMute);
    }

    setMute(value) {
      this.settings.masterMute = Boolean(value);
      this.applyVolumes();
      if (this.settings.masterMute) {
        this.pauseAll();
      } else if (this.wasPlayingBeforePause) {
        this.resumeAll();
      }
      this.saveSettings();
    }

    pauseAll() {
      this.wasPlayingBeforePause = Boolean(this.currentBGM && !this.currentBGM.paused);
      this.pauseBGM();
      for (const name of this.activeSE.keys()) this.stopSE(name);
    }

    resumeAll() {
      if (!this.settings.masterMute && this.wasPlayingBeforePause) this.resumeBGM();
      this.wasPlayingBeforePause = false;
    }

    applyVolumes() {
      const bgmVolume = this.settings.masterMute ? 0 : this.settings.bgmVolume;
      const seVolume = this.settings.masterMute ? 0 : this.settings.seVolume;
      for (const audio of this.bgm.values()) audio.volume = bgmVolume;
      for (const voices of this.activeSE.values()) {
        for (const audio of voices) audio.volume = seVolume;
      }
    }

    saveSettings() {
      localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(this.settings));
    }

    loadSettings() {
      const defaults = { bgmVolume: 0.7, seVolume: 0.8, masterMute: false };
      try {
        return { ...defaults, ...JSON.parse(localStorage.getItem(AUDIO_SETTINGS_KEY) || "{}") };
      } catch (error) {
        console.warn("Audio settings load failed", error);
        return defaults;
      }
    }

    playStage() {
      this.playBGM("stage", true);
    }

    playBoss() {
      this.playBGM("boss", true);
    }

    pauseStage() {
      this.pauseBGM();
    }

    stopStage() {
      this.stopBGM();
    }

    fadeTo(volume) {
      this.setBGMVolume(volume);
    }

    playPowerItem(amount, stageChanged) {
      this.playSE(amount >= POWER_CONFIG.largePValue ? "item_p_large" : "item_p_small");
      if (stageChanged) this.playSE("power_up");
    }
  }

  class Game {
    constructor() {
      this.state = new GameState();
      this.difficulty = new DifficultyManager();
      this.score = new ScoreManager(this);
      this.life = new LifeManager(this);
      this.power = new PowerManager();
      this.checkpoints = new CheckpointManager();
      this.save = new SaveManager();
      this.difficulty.set(this.save.data.settings?.lastDifficulty || "normal");
      this.background = new BackgroundManager(BACKGROUND_STAGE1);
      this.audio = new AudioManager();
      this.slipperNovaCutin = new Image();
      this.slipperNovaCutinLoaded = false;
      this.slipperNovaCutin.onload = () => {
        this.slipperNovaCutinLoaded = true;
      };
      this.slipperNovaCutin.onerror = () => {
        this.slipperNovaCutinLoaded = false;
      };
      this.slipperNovaCutin.src = `${SLIPPER_NOVA_CUTIN_ASSET}?v=${APP_VERSION}`;
      this.suginomikotoCutin = new Image();
      this.suginomikotoCutinLoaded = false;
      this.suginomikotoCutin.onload = () => {
        this.suginomikotoCutinLoaded = true;
      };
      this.suginomikotoCutin.onerror = () => {
        this.suginomikotoCutinLoaded = false;
      };
      this.suginomikotoCutin.src = `${SUGINOMIKOTO_CUTIN_ASSET}?v=${APP_VERSION}`;
      this.titleMenu = new MenuManager(["START GAME", "OPTIONS", "HOW TO PLAY", "HIGH SCORE"].map((label) => ({ label })));
      this.optionsMenu = new MenuManager([
        { label: "BGM VOLUME", action: "bgm" },
        { label: "SE VOLUME", action: "se" },
        { label: "MASTER MUTE", action: "mute" },
        { label: "BACK", action: "back" },
      ]);
      this.pauseMenu = new MenuManager();
      this.gameOverMenu = new MenuManager();
      this.player = new Player();
      this.enemies = [];
      this.playerBullets = [];
      this.enemyBullets = [];
      this.powerItems = [];
      this.pointItems = [];
      this.followers = [];
      this.particles = [];
      this.lasers = [];
      this.boss = null;
      this.playerSpellCount = 3;
      this.playerSpellTimer = 0;
      this.playerSpellCutin = 0;
      this.bossSpellCutin = 0;
      this.bossSpellCutinName = "";
      this.playerSpellCooldown = 0;
      this.playerSpellActive = false;
      this.playerSpellFirePlayed = false;
      this.playerCutinImpactPlayed = false;
      this.bossCutinBellPlayed = false;
      this.bossCutinReleasePlayed = false;
      this.powerUpFlash = 0;
      this.grazeCount = 0;
      this.grazeMilestoneIndex = 0;
      this.grazeFlash = 0;
      this.continuesLeft = INITIAL_CONTINUES;
      this.continueCount = 0;
      this.missedDuringCard = false;
      this.pendingBossDefeat = 0;
      this.spawnedWaves = new Set();
      this.currentWave = 0;
      this.debugVisible = false;
      this.enemyBulletsSpawnedFrame = 0;
      this.enemyBulletSpawnHistory = [];
      this.spellKeyHeld = false;
      this.spellPointerHeld = false;
      this.titlePanel = "main";
      this.dialogue = new DialogueManager(DIALOGUE_SCENES, PORTRAIT_BASE, DIALOGUE_CONTEXT);
      this.lastTime = 0;
      this.input = {
        left: false,
        right: false,
        up: false,
        down: false,
        fire: false,
        slow: false,
        gpLeft: false,
        gpRight: false,
        gpUp: false,
        gpDown: false,
        gpFire: false,
        gpSlow: false,
        touchActive: false,
        mouseActive: false,
        touchX: W / 2,
        touchY: H - 90,
        joystickOriginX: W * 0.78,
        joystickOriginY: H * 0.78,
      };
      this.gamepad = {
        index: null,
        prevButtons: [],
        navCooldown: 0,
      };
      this.bindInput();
    }

    start(fromCheckpoint = false, keepScore = false) {
      const startTime = fromCheckpoint ? this.checkpoints.currentPoint.time : 0;
      const preservedSpellCount = this.playerSpellCount;
      const preservedPower = this.power.value;
      this.state.resetRun(startTime);
      if (!keepScore) {
        this.score.reset();
        this.checkpoints.reset();
        this.continuesLeft = INITIAL_CONTINUES;
        this.continueCount = 0;
      }
      this.player.reset();
      this.enemies = [];
      this.playerBullets = [];
      this.enemyBullets = [];
      this.powerItems = [];
      this.pointItems = [];
      this.followers = [];
      this.particles = [];
      this.lasers = [];
      this.boss = null;
      this.playerSpellCount = keepScore ? preservedSpellCount : 3;
      spellButton.disabled = this.playerSpellCount <= 0;
      this.playerSpellTimer = 0;
      this.playerSpellCutin = 0;
      this.bossSpellCutin = 0;
      this.bossSpellCutinName = "";
      this.playerSpellCooldown = 0;
      this.playerSpellActive = false;
      this.playerSpellFirePlayed = false;
      this.playerCutinImpactPlayed = false;
      this.bossCutinBellPlayed = false;
      this.bossCutinReleasePlayed = false;
      this.powerUpFlash = 0;
      this.grazeCount = keepScore ? this.grazeCount : 0;
      this.grazeMilestoneIndex = keepScore ? this.grazeMilestoneIndex : 0;
      this.grazeFlash = 0;
      this.missedDuringCard = false;
      this.pendingBossDefeat = 0;
      this.spawnedWaves = new Set(
        STAGE_WAVES.map((wave, index) => ({ wave, index })).filter(({ wave }) => wave.time <= startTime).map(({ index }) => index)
      );
      this.currentWave = this.spawnedWaves.size;
      this.enemyBulletsSpawnedFrame = 0;
      this.enemyBulletSpawnHistory = [];
      this.spellKeyHeld = false;
      this.spellPointerHeld = false;
      this.input.touchActive = false;
      this.input.mouseActive = false;
      this.input.fire = false;
      if (keepScore) this.power.value = preservedPower;
      else this.power.reset();
      this.syncFollowers();
      this.life.reset();
      if (keepScore && fromCheckpoint) {
        this.life.lives = Math.max(1, this.life.lives);
      }
      this.state.showMessage(fromCheckpoint ? `${this.checkpoints.currentPoint.name} から再開` : "一面開始", 120);
      this.audio.playStage();
      if (!fromCheckpoint) this.startDialogue("scene_intro");
    }

    returnToTitle() {
      this.state.mode = "title";
      this.titlePanel = "main";
      this.dialogue.active = false;
      this.enemies = [];
      this.playerBullets = [];
      this.enemyBullets = [];
      this.powerItems = [];
      this.pointItems = [];
      this.followers = [];
      this.lasers = [];
      this.boss = null;
      this.playerSpellTimer = 0;
      this.playerSpellActive = false;
      this.playerSpellCutin = 0;
      this.bossSpellCutin = 0;
      this.bossSpellCutinName = "";
      this.playerSpellCooldown = 0;
      this.spellKeyHeld = false;
      this.spellPointerHeld = false;
      this.playerSpellFirePlayed = false;
      this.playerCutinImpactPlayed = false;
      this.bossCutinBellPlayed = false;
      this.bossCutinReleasePlayed = false;
      this.input.touchActive = false;
      this.input.mouseActive = false;
      this.input.fire = false;
      this.state.time = 0;
      this.audio.stopStage();
    }

    startDialogue(sceneName, onComplete = null) {
      this.input.fire = false;
      this.input.touchActive = false;
      this.input.mouseActive = false;
      this.dialogue.start(sceneName, onComplete);
    }

    bindInput() {
      window.addEventListener("keydown", (e) => {
        this.audio.unlock();
        if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " ", "Shift", "x", "X", "Escape", "Enter"].includes(e.key)) e.preventDefault();
        if (e.key === "F3") {
          if (!e.repeat) this.debugVisible = !this.debugVisible;
          return;
        }
        if (this.state.mode === "clear") {
          if (!e.repeat && (e.key === "z" || e.key === "Z" || e.key === " " || e.key === "Enter" || e.key === "Escape")) {
            this.returnToTitle();
          }
          return;
        }
        if (this.state.mode === "title") {
          this.handleTitleKey(e.key);
          return;
        }
        if (this.state.mode === "paused") {
          this.handlePauseKey(e.key);
          return;
        }
        if (this.state.mode === "gameover") {
          this.handleGameOverKey(e.key);
          return;
        }
        if (this.dialogue.active) {
          if (e.key === "Enter") this.dialogue.skip();
          if (e.key === "z" || e.key === "Z" || e.key === " ") this.dialogue.advance();
          return;
        }
        if (e.key === "Escape" || e.key === "p" || e.key === "P") {
          this.openPauseMenu();
          return;
        }
        if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") this.input.left = true;
        if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") this.input.right = true;
        if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") this.input.up = true;
        if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") this.input.down = true;
        if (e.key === "Shift") this.input.slow = true;
        if (e.key === "z" || e.key === "Z" || e.key === " ") this.input.fire = true;
        if ((e.key === "x" || e.key === "X") && !this.spellKeyHeld && !e.repeat) {
          this.spellKeyHeld = true;
          this.activatePlayerSpell();
        }
      }, { passive: false });

      window.addEventListener("keyup", (e) => {
        if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") this.input.left = false;
        if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") this.input.right = false;
        if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") this.input.up = false;
        if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") this.input.down = false;
        if (e.key === "Shift") this.input.slow = false;
        if (e.key === "z" || e.key === "Z" || e.key === " ") this.input.fire = false;
        if (e.key === "x" || e.key === "X") this.spellKeyHeld = false;
      });

      canvas.addEventListener("pointerdown", (e) => {
        this.audio.unlock();
        if (this.state.mode === "title") this.ensureTitleBGM();
        if (e.button === 2) {
          e.preventDefault();
          if (!this.dialogue.active) this.activatePlayerSpell();
          return;
        }
        if (this.handleCanvasTap(e)) return;
        if (this.dialogue.active) {
          this.dialogue.advance();
          return;
        }
        if (this.state.mode !== "stage") return;
        if (e.pointerType === "mouse") {
          this.input.mouseActive = true;
          this.input.fire = true;
        } else {
          const pos = this.canvasPoint(e);
          if (pos.x < W * MOBILE_CONTROLS.moveRegionStart) return;
          this.input.touchActive = true;
          this.input.joystickOriginX = pos.x;
          this.input.joystickOriginY = pos.y;
        }
        this.setTouch(e);
        canvas.setPointerCapture(e.pointerId);
      });
      canvas.addEventListener("pointermove", (e) => {
        if (e.pointerType === "mouse" && this.state.mode === "stage" && !this.dialogue.active) {
          this.input.mouseActive = true;
          this.setTouch(e);
          return;
        }
        if (!this.input.touchActive) return;
        this.setTouch(e);
      });
      canvas.addEventListener("pointerup", (e) => {
        if (e.pointerType === "mouse") this.input.fire = false;
        else this.input.touchActive = false;
      });
      canvas.addEventListener("pointercancel", (e) => {
        if (e.pointerType === "mouse") {
          this.input.fire = false;
          this.input.mouseActive = false;
        }
        this.input.touchActive = false;
      });
      canvas.addEventListener("pointerleave", (e) => {
        if (e.pointerType === "mouse") {
          this.input.fire = false;
          this.input.mouseActive = false;
        }
      });
      canvas.addEventListener("contextmenu", (e) => {
        e.preventDefault();
      });

      slowButton.addEventListener("pointerdown", (e) => {
        this.audio.unlock();
        e.preventDefault();
        if (this.dialogue.active) {
          this.dialogue.advance();
          return;
        }
        this.input.slow = true;
        slowButton.classList.add("is-active");
      });
      slowButton.addEventListener("pointerup", () => {
        this.input.slow = false;
        slowButton.classList.remove("is-active");
      });
      slowButton.addEventListener("pointercancel", () => {
        this.input.slow = false;
        slowButton.classList.remove("is-active");
      });

      spellButton.addEventListener("pointerdown", (e) => {
        this.audio.unlock();
        e.preventDefault();
        if (this.dialogue.active) {
          this.dialogue.advance();
          return;
        }
        if (this.spellPointerHeld) return;
        this.spellPointerHeld = true;
        this.activatePlayerSpell();
      });
      spellButton.addEventListener("pointerup", () => {
        this.spellPointerHeld = false;
      });
      spellButton.addEventListener("pointercancel", () => {
        this.spellPointerHeld = false;
      });

      menuButton.addEventListener("pointerdown", (e) => {
        this.audio.unlock();
        e.preventDefault();
        if (this.state.mode === "stage") this.openPauseMenu();
        else if (this.state.mode === "paused") this.resumeFromPause();
      });
    }

    handleTitleKey(key) {
      this.ensureTitleBGM();
      if (this.titlePanel === "options") {
        if (key === "ArrowUp" || key === "w" || key === "W") this.moveMenu(this.optionsMenu, -1);
        if (key === "ArrowDown" || key === "s" || key === "S") this.moveMenu(this.optionsMenu, 1);
        if (key === "ArrowLeft" || key === "a" || key === "A") this.adjustOption(-1);
        if (key === "ArrowRight" || key === "d" || key === "D") this.adjustOption(1);
        if (key === "z" || key === "Z" || key === " " || key === "Enter") this.activateOptionItem();
        if (key === "Escape") this.closeOptions();
        return;
      }
      if (key === "ArrowUp" || key === "w" || key === "W") this.moveMenu(this.titleMenu, -1);
      if (key === "ArrowDown" || key === "s" || key === "S") this.moveMenu(this.titleMenu, 1);
      if (this.titleMenu.selected()?.label === "START GAME" && (key === "ArrowLeft" || key === "a" || key === "A")) this.changeDifficulty(-1);
      if (this.titleMenu.selected()?.label === "START GAME" && (key === "ArrowRight" || key === "d" || key === "D")) this.changeDifficulty(1);
      if (key === "z" || key === "Z" || key === " " || key === "Enter") this.activateTitleItem();
      if (key === "Escape") {
        this.audio.playSE("menu_cancel");
        this.titlePanel = "main";
      }
    }

    activateTitleItem() {
      const label = this.titleMenu.selected()?.label;
      this.audio.playSE("menu_decide");
      if (label === "START GAME") this.start(false, false);
      if (label === "OPTIONS") this.openOptions();
      if (label === "HOW TO PLAY") this.titlePanel = this.titlePanel === "how" ? "main" : "how";
      if (label === "HIGH SCORE") this.titlePanel = this.titlePanel === "score" ? "main" : "score";
    }

    ensureTitleBGM() {
      if (this.state.mode === "title" && this.audio.currentBGMName !== "stage") this.audio.playBGM("stage", true);
    }

    moveMenu(menu, delta) {
      menu.move(delta);
      this.audio.playSE("menu_move");
    }

    openOptions() {
      this.titlePanel = "options";
      this.optionsMenu.index = 0;
    }

    closeOptions() {
      this.audio.playSE("menu_cancel");
      this.titlePanel = "main";
    }

    adjustOption(delta) {
      const action = this.optionsMenu.selected()?.action;
      if (action === "bgm") {
        this.audio.setBGMVolume(this.audio.getBGMVolume() + delta * 0.05);
      } else if (action === "se") {
        this.audio.setSEVolume(this.audio.getSEVolume() + delta * 0.05);
        this.audio.playSE("item_p_small", { cooldown: 0, maxVoices: 1 });
      } else if (action === "mute") {
        this.audio.toggleMute();
      } else {
        return;
      }
      this.audio.playSE("menu_move", { cooldown: 0, maxVoices: 1 });
    }

    activateOptionItem() {
      const action = this.optionsMenu.selected()?.action;
      if (action === "mute") {
        this.audio.toggleMute();
        this.audio.playSE("menu_decide");
      } else if (action === "back") {
        this.closeOptions();
      } else {
        this.audio.playSE("menu_decide");
      }
    }

    changeDifficulty(delta) {
      this.difficulty.next(delta);
      this.save.saveSettings({ lastDifficulty: this.difficulty.current });
    }

    openPauseMenu() {
      if (this.state.mode !== "stage" || this.dialogue.active) return;
      this.state.mode = "paused";
      this.audio.pauseAll();
      this.pauseMenu.setItems([
        { label: "RESUME", action: "resume" },
        { label: "RESTART", action: "restart", confirm: "ステージを最初からやり直しますか？" },
        { label: "RETRY CHECKPOINT", action: "checkpoint", confirm: "最後のチェックポイントからやり直しますか？" },
        { label: "TITLE", action: "title", confirm: "タイトル画面へ戻りますか？現在の進行は失われます" },
      ]);
    }

    resumeFromPause() {
      if (this.state.mode === "paused") {
        this.state.mode = "stage";
        this.audio.resumeAll();
      }
    }

    handlePauseKey(key) {
      if (key === "Escape" || key === "p" || key === "P") {
        this.audio.playSE("menu_cancel");
        if (this.pauseMenu.confirm) this.pauseMenu.confirm = null;
        else this.resumeFromPause();
        return;
      }
      if (key === "ArrowUp" || key === "w" || key === "W") this.moveMenu(this.pauseMenu, -1);
      if (key === "ArrowDown" || key === "s" || key === "S") this.moveMenu(this.pauseMenu, 1);
      if (key === "ArrowLeft" || key === "ArrowRight" || key === "a" || key === "d" || key === "A" || key === "D") this.moveMenu(this.pauseMenu, 1);
      if (key === "z" || key === "Z" || key === " " || key === "Enter") this.activatePauseItem();
    }

    activatePauseItem() {
      this.audio.playSE("menu_decide");
      if (this.pauseMenu.confirm) {
        if (this.pauseMenu.confirm.choice === 0) this.executePauseAction(this.pauseMenu.confirm.action);
        else this.pauseMenu.confirm = null;
        return;
      }
      const item = this.pauseMenu.selected();
      if (!item) return;
      if (item.confirm) {
        this.pauseMenu.confirm = { text: item.confirm, action: item.action, choice: 1 };
        return;
      }
      this.executePauseAction(item.action);
    }

    executePauseAction(action) {
      this.pauseMenu.confirm = null;
      if (action === "resume") this.resumeFromPause();
      if (action === "restart") this.start(false, false);
      if (action === "checkpoint") this.start(true, true);
      if (action === "title") this.returnToTitle();
    }

    openGameOverMenu() {
      this.state.mode = "gameover";
      this.audio.pauseAll();
      this.saveCurrentRun(false);
      this.gameOverMenu.setItems([
        { label: "CONTINUE", action: "continue", disabled: this.continuesLeft <= 0 },
        { label: "RETRY", action: "retry" },
        { label: "TITLE", action: "title" },
      ]);
    }

    handleGameOverKey(key) {
      if (key === "ArrowUp" || key === "w" || key === "W") this.moveMenu(this.gameOverMenu, -1);
      if (key === "ArrowDown" || key === "s" || key === "S") this.moveMenu(this.gameOverMenu, 1);
      if (key === "Escape") {
        this.audio.playSE("menu_cancel");
        this.returnToTitle();
      }
      if (key === "z" || key === "Z" || key === " " || key === "Enter") this.activateGameOverItem();
    }

    activateGameOverItem() {
      this.audio.playSE("menu_decide");
      const item = this.gameOverMenu.selected();
      if (!item || item.disabled) return;
      if (item.action === "continue") this.continueFromCheckpoint();
      if (item.action === "retry") this.start(false, false);
      if (item.action === "title") this.returnToTitle();
    }

    continueFromCheckpoint() {
      if (this.continuesLeft <= 0) return;
      this.continuesLeft -= 1;
      this.continueCount += 1;
      this.score.reduceForContinue();
      this.start(true, true);
    }

    handleCanvasTap(e) {
      if (this.state.mode === "clear") {
        this.returnToTitle();
        return true;
      }
      if (this.state.mode !== "title" && this.state.mode !== "paused" && this.state.mode !== "gameover") return false;
      const pos = this.canvasPoint(e);
      if (this.state.mode === "title" && this.titlePanel === "main" && pos.y >= 594 && pos.y <= 632) {
        this.changeDifficulty(pos.x < W / 2 ? -1 : 1);
        this.audio.playSE("menu_move");
        return true;
      }
      const hit = this.hitMenuItem(pos.x, pos.y);
      if (hit === null) return false;
      if (this.state.mode === "title") {
        if (this.titlePanel === "options") {
          this.optionsMenu.index = hit;
          const action = this.optionsMenu.selected()?.action;
          if (action === "bgm" || action === "se") this.adjustOption(pos.x < W / 2 ? -1 : 1);
          else this.activateOptionItem();
        } else {
          this.titleMenu.index = hit;
          this.activateTitleItem();
        }
      } else if (this.state.mode === "paused") {
        if (this.pauseMenu.confirm) {
          this.pauseMenu.confirm.choice = hit;
          this.activatePauseItem();
        } else {
          this.pauseMenu.index = hit;
          this.activatePauseItem();
        }
      } else if (this.state.mode === "gameover") {
        this.gameOverMenu.index = hit;
        this.activateGameOverItem();
      }
      return true;
    }

    setTouch(e) {
      const pos = this.canvasPoint(e);
      this.input.touchX = pos.x;
      this.input.touchY = pos.y;
    }

    canvasPoint(e) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) / rect.width) * W,
        y: ((e.clientY - rect.top) / rect.height) * H,
      };
    }

    hitMenuItem(x, y) {
      const menu = this.getActiveMenu();
      if (!menu) return null;
      if (menu.confirm) {
        if (y >= 462 && y <= 512) return x < W / 2 ? 0 : 1;
        return null;
      }
      const startY = this.state.mode === "title" ? (this.titlePanel === "options" ? 365 : 395) : 345;
      for (let i = 0; i < menu.items.length; i += 1) {
        const top = startY + i * 48;
        if (y >= top && y <= top + 38) return i;
      }
      return null;
    }

    getActiveMenu() {
      if (this.state.mode === "title") return this.titlePanel === "options" ? this.optionsMenu : this.titleMenu;
      if (this.state.mode === "paused") return this.pauseMenu;
      if (this.state.mode === "gameover") return this.gameOverMenu;
      return null;
    }

    resetGamepadInput() {
      this.input.gpLeft = false;
      this.input.gpRight = false;
      this.input.gpUp = false;
      this.input.gpDown = false;
      this.input.gpFire = false;
      this.input.gpSlow = false;
      this.gamepad.prevButtons = [];
    }

    readGamepad() {
      if (!navigator.getGamepads || this.save.data.settings?.gamepadEnabled === false) {
        this.resetGamepadInput();
        return;
      }

      const pads = Array.from(navigator.getGamepads());
      let pad = this.gamepad.index !== null ? pads[this.gamepad.index] : null;
      if (!pad || !pad.connected) {
        pad = pads.find((item) => item && item.connected) || null;
        this.gamepad.index = pad ? pad.index : null;
      }
      if (!pad) {
        this.resetGamepadInput();
        return;
      }

      const buttons = pad.buttons.map((button) => button.pressed || button.value > 0.55);
      const justPressed = (index) => buttons[index] && !this.gamepad.prevButtons[index];
      const axisX = Math.abs(pad.axes[0] || 0) > 0.28 ? pad.axes[0] : 0;
      const axisY = Math.abs(pad.axes[1] || 0) > 0.28 ? pad.axes[1] : 0;
      const dpadUp = buttons[12];
      const dpadDown = buttons[13];
      const dpadLeft = buttons[14];
      const dpadRight = buttons[15];

      this.input.gpLeft = dpadLeft || axisX < 0;
      this.input.gpRight = dpadRight || axisX > 0;
      this.input.gpUp = dpadUp || axisY < 0;
      this.input.gpDown = dpadDown || axisY > 0;
      this.input.gpFire = buttons[0];
      this.input.gpSlow = buttons[4] || buttons[5] || buttons[6] || buttons[7];

      if (this.gamepad.navCooldown > 0) this.gamepad.navCooldown -= 1;

      if (this.dialogue.active) {
        if (justPressed(0)) this.dialogue.advance();
        if (justPressed(1)) this.dialogue.skip();
        this.gamepad.prevButtons = buttons;
        return;
      }

      if (this.state.mode === "title") {
        const titleMenu = this.titlePanel === "options" ? this.optionsMenu : this.titleMenu;
        this.handleGamepadMenu(buttons, justPressed, axisX, axisY, titleMenu);
        if (justPressed(0)) {
          if (this.titlePanel === "options") this.activateOptionItem();
          else this.activateTitleItem();
        }
        if (justPressed(1)) {
          if (this.titlePanel === "options") this.closeOptions();
          else {
            this.audio.playSE("menu_cancel");
            this.titlePanel = "main";
          }
        }
      } else if (this.state.mode === "paused") {
        this.handleGamepadMenu(buttons, justPressed, axisX, axisY, this.pauseMenu);
        if (justPressed(0)) this.activatePauseItem();
        if (justPressed(1) || justPressed(8) || justPressed(9)) {
          if (this.pauseMenu.confirm) this.pauseMenu.confirm = null;
          else this.resumeFromPause();
        }
      } else if (this.state.mode === "gameover") {
        this.handleGamepadMenu(buttons, justPressed, axisX, axisY, this.gameOverMenu);
        if (justPressed(0)) this.activateGameOverItem();
        if (justPressed(1)) this.returnToTitle();
      } else if (this.state.mode === "stage") {
        if (justPressed(2)) this.activatePlayerSpell();
        if (justPressed(8) || justPressed(9)) this.openPauseMenu();
      }

      this.gamepad.prevButtons = buttons;
    }

    handleGamepadMenu(buttons, justPressed, axisX, axisY, menu) {
      if (!menu) return;
      const xDir = buttons[15] || axisX > 0 ? 1 : buttons[14] || axisX < 0 ? -1 : 0;
      const yDir = buttons[13] || axisY > 0 ? 1 : buttons[12] || axisY < 0 ? -1 : 0;
      const canRepeat = this.gamepad.navCooldown <= 0;

      if (justPressed(12) || (yDir < 0 && canRepeat)) {
        this.moveMenu(menu, -1);
        this.gamepad.navCooldown = 12;
      }
      if (justPressed(13) || (yDir > 0 && canRepeat)) {
        this.moveMenu(menu, 1);
        this.gamepad.navCooldown = 12;
      }
      if (justPressed(14) || (xDir < 0 && canRepeat)) {
        if (this.state.mode === "title" && this.titlePanel === "options") this.adjustOption(-1);
        else if (this.state.mode === "title" && this.titleMenu.selected()?.label === "START GAME") this.changeDifficulty(-1);
        else if (menu.confirm) menu.confirm.choice = 0;
        else this.moveMenu(menu, -1);
        this.gamepad.navCooldown = 12;
      }
      if (justPressed(15) || (xDir > 0 && canRepeat)) {
        if (this.state.mode === "title" && this.titlePanel === "options") this.adjustOption(1);
        else if (this.state.mode === "title" && this.titleMenu.selected()?.label === "START GAME") this.changeDifficulty(1);
        else if (menu.confirm) menu.confirm.choice = 1;
        else this.moveMenu(menu, 1);
        this.gamepad.navCooldown = 12;
      }
    }

    loop = (time) => {
      const dt = Math.min(2, (time - this.lastTime) / 16.666 || 1);
      this.lastTime = time;
      for (let i = 0; i < dt; i += 1) this.update();
      this.draw();
      requestAnimationFrame(this.loop);
    };

    update() {
      this.readGamepad();
      if (this.state.mode !== "paused") this.dialogue.update();
      document.body.classList.toggle("dialogue-active", this.dialogue.active);
      if (!this.dialogue.active && this.state.mode === "stage") this.updateStage();
      if (this.dialogue.active) return;
      if (this.state.mode === "paused" || this.state.mode === "gameover" || this.state.mode === "title") return;
      this.particles.forEach((p) => p.update());
      this.particles = this.particles.filter((p) => p.life > 0);
      this.state.shake = Math.max(0, this.state.shake - 1);
      this.state.messageTimer = Math.max(0, this.state.messageTimer - 1);
      this.state.bossNameTimer = Math.max(0, this.state.bossNameTimer - 1);
      this.powerUpFlash = Math.max(0, this.powerUpFlash - 1);
      this.grazeFlash = Math.max(0, this.grazeFlash - 1);
    }

    updateStage() {
      spellButton.disabled = this.playerSpellCount <= 0;
      this.state.time += 1;
      this.checkpoints.updateByTime(this.state.time);
      this.enemyBulletsSpawnedFrame = 0;
      this.playerSpellCooldown = Math.max(0, this.playerSpellCooldown - 1);
      this.playerSpellCutin = Math.max(0, this.playerSpellCutin - 1);
      this.bossSpellCutin = Math.max(0, this.bossSpellCutin - 1);
      if (this.playerSpellCutin === PLAYER_CUTIN_FRAMES - 12 && !this.playerCutinImpactPlayed) {
        this.playerCutinImpactPlayed = true;
        this.audio.playSE("cutin_haou_impact", { maxVoices: 1 });
        this.state.shake = Math.max(this.state.shake, 6);
      }
      if (this.bossSpellCutin === BOSS_CUTIN_FRAMES - 12 && !this.bossCutinBellPlayed) {
        this.bossCutinBellPlayed = true;
        this.audio.playSE("divine_bell", { maxVoices: 1 });
        this.state.shake = Math.max(this.state.shake, 5);
      }
      if (this.bossSpellCutin === 14 && !this.bossCutinReleasePlayed) {
        this.bossCutinReleasePlayed = true;
        this.audio.playSE("pollen_release", { maxVoices: 1 });
      }
      if (this.playerSpellActive) {
        this.playerSpellTimer = Math.max(0, this.playerSpellTimer - 1);
        if (this.playerSpellTimer <= 0) this.endPlayerSpell();
      }
      this.player.update(this.input, this.playerBullets, this);
      this.syncFollowers();
      const slow = this.input.slow || this.input.gpSlow;
      this.followers.forEach((follower) => follower.update(this.player, slow));
      this.updatePlayerSpell();
      this.spawnStageEnemies();

      this.enemies.forEach((e) => e.update(this));
      this.powerItems.forEach((item) => item.update(this.player));
      this.pointItems.forEach((item) => item.update(this.player));
      this.playerBullets.forEach((b) => b.update());
      this.enemyBullets.forEach((b) => b.update());
      this.updateLasers();
      if (this.boss) this.boss.update(this);

      this.resolveCollisions();
      if (this.pendingBossDefeat > 0) {
        this.pendingBossDefeat -= 1;
        if (this.pendingBossDefeat === 0) this.defeatBoss();
      }

      this.enemies = this.enemies.filter((e) => !e.offscreen() && e.hp > 0);
      this.playerBullets = this.playerBullets.filter((b) => !b.offscreen());
      this.enemyBullets = this.enemyBullets.filter((b) => !b.offscreen());
      this.powerItems = this.powerItems.filter((item) => item.active && !item.collected && !item.offscreen());
      this.pointItems = this.pointItems.filter((item) => item.active && !item.collected && !item.offscreen());
      this.enemyBulletSpawnHistory.push(this.enemyBulletsSpawnedFrame);
      if (this.enemyBulletSpawnHistory.length > 60) this.enemyBulletSpawnHistory.shift();
    }

    activatePlayerSpell() {
      if (this.state.mode !== "stage" || this.dialogue.active) return;
      if (this.playerSpellCount <= 0 || this.playerSpellActive || this.playerSpellCooldown > 0) return;
      this.playerSpellCount -= 1;
      this.playerSpellTimer = 165;
      this.playerSpellCutin = PLAYER_CUTIN_FRAMES;
      this.playerSpellCooldown = 220;
      this.playerSpellActive = true;
      this.playerSpellFirePlayed = false;
      this.playerCutinImpactPlayed = false;
      this.player.invincible = Math.max(this.player.invincible, 180);
      this.cancelEnemyBullets(true);
      this.lasers = [];
      this.state.shake = 16;
      this.state.showMessage("履技発動：スリッパ・ノヴァ", 100);
      this.audio.playSE("cutin_haou_start", { maxVoices: 1 });
      this.audio.playSE("slipper_nova_charge", { maxVoices: 1 });
      for (let i = 0; i < 40; i += 1) this.particles.push(new Particle(this.player.x, this.player.y - 40, "#bdf6ff"));
    }

    startBossSpellCutin(cardName) {
      this.bossSpellCutin = BOSS_CUTIN_FRAMES;
      this.bossSpellCutinName = cardName;
      this.bossCutinBellPlayed = false;
      this.bossCutinReleasePlayed = false;
      this.audio.playSE("cutin_suginomikoto_start", { maxVoices: 1 });
      this.audio.playSE("pollen_charge", { maxVoices: 1 });
      if (cardName.includes("無限飛散")) this.audio.playSE("infinite_scatter", { maxVoices: 1 });
    }

    endPlayerSpell() {
      if (this.playerSpellActive) this.audio.playSE("slipper_nova_end", { maxVoices: 1 });
      this.playerSpellActive = false;
      this.playerSpellTimer = 0;
      this.player.invincible = Math.min(this.player.invincible, 20);
    }

    syncFollowers() {
      while (this.followers.length < this.power.stage) this.followers.push(new FollowerSlipper(this.followers.length));
      if (this.followers.length > this.power.stage) this.followers.length = this.power.stage;
    }

    shootFollowers() {
      for (const follower of this.followers) {
        this.playerBullets.push(new Bullet(follower.x, follower.y - 12, 0, -8.4, 3, "player", "#8eeeff", { damage: 0.36 }));
      }
    }

    updatePlayerSpell() {
      if (!this.playerSpellActive || this.playerSpellTimer <= 0) return;
      if (!this.playerSpellFirePlayed && this.playerSpellTimer <= 154) {
        this.playerSpellFirePlayed = true;
        this.audio.playSE("slipper_nova_fire", { maxVoices: 1 });
      }
      this.player.invincible = Math.max(this.player.invincible, 3);
      if (this.playerSpellTimer % 8 === 0) this.cancelEnemyBullets(true);

      const beam = this.getPlayerSpellBeam();
      for (const e of this.enemies) {
        if (e.x > beam.x - beam.w / 2 - e.r && e.x < beam.x + beam.w / 2 + e.r && e.y < beam.bottom && e.y > -30) {
          e.hp -= 3.5;
          if (this.playerSpellTimer % 10 === 0) this.spawnBurst(e.x, e.y, "#c9f8ff", 4);
          if (e.hp <= 0) this.destroyEnemy(e);
        }
      }

      if (this.boss && this.boss.entered && !this.boss.defeated) {
        if (Math.abs(this.boss.x - beam.x) < beam.w / 2 + this.boss.r && this.boss.y < beam.bottom) {
          this.boss.takeDamage(this, 1.25);
          if (this.playerSpellTimer % 12 === 0) this.spawnBurst(this.boss.x, this.boss.y, "#d7fbff", 8);
        }
      }
      for (const followerBeam of this.getFollowerSpellBeams()) {
        for (const e of this.enemies) {
          if (e.destroyed) continue;
          if (Math.abs(e.x - followerBeam.x) < followerBeam.w / 2 + e.r && e.y < followerBeam.bottom) {
            e.hp -= 0.42;
            if (e.hp <= 0) this.destroyEnemy(e);
          }
        }
        if (this.boss && this.boss.entered && !this.boss.defeated && Math.abs(this.boss.x - followerBeam.x) < followerBeam.w / 2 + this.boss.r) {
          this.boss.takeDamage(this, 0.14);
        }
      }
    }

    getPlayerSpellBeam() {
      return {
        x: this.player.x,
        w: 92 + Math.sin(this.playerSpellTimer * 0.18) * 10,
        bottom: this.player.y - 12,
      };
    }

    getFollowerSpellBeams() {
      if (!this.playerSpellActive) return [];
      return this.followers.map((follower) => ({
        x: follower.x,
        w: 22,
        bottom: follower.y - 8,
      }));
    }

    spawnStageEnemies() {
      const t = this.state.time;
      STAGE_WAVES.forEach((wave, index) => {
        if (t >= wave.time && !this.spawnedWaves.has(index)) {
          this.spawnedWaves.add(index);
          this.currentWave = index + 1;
          this.spawnWave(wave.pattern);
        }
      });

      if (t >= 3420 && !this.boss) {
        this.boss = new Boss();
        this.enemies = [];
        this.enemyBullets = [];
        this.state.showMessage("花粉濃度、異常上昇", 150);
      }
    }

    spawnWave(pattern) {
      const spawn = (x, y, type, movement = "drift") => this.spawnEnemy(x, y, type, movement);
      if (pattern === "smallLine") {
        const count = this.difficulty.current === "easy" ? 3 : this.difficulty.current === "hard" ? 5 : 4;
        for (let i = 0; i < count; i += 1) spawn(68 + i * (314 / Math.max(1, count - 1)), -30 - i * 22, "small");
      } else if (pattern === "mediumPair") {
        spawn(105, -34, "medium", "sine");
        if (this.difficulty.current !== "easy") spawn(W - 105, -70, "medium", "sine");
      } else if (pattern === "smallSweep") {
        const count = this.difficulty.current === "easy" ? 3 : 5;
        for (let i = 0; i < count; i += 1) spawn(70 + i * 72, -25 - i * 42, "small", "zigzag");
      } else if (pattern === "largeEscort") {
        spawn(W / 2, -52, "large", "sine");
        if (this.difficulty.current !== "easy") {
          spawn(90, -100, "small");
          spawn(W - 90, -130, "small");
        }
      } else if (pattern === "mediumTrio") {
        spawn(92, -30, "medium");
        spawn(W / 2, -82, "medium", "sine");
        if (this.difficulty.current !== "easy") spawn(W - 92, -134, "medium");
      } else if (pattern === "smallCross") {
        for (let i = 0; i < 4; i += 1) spawn(i % 2 === 0 ? 92 : W - 92, -30 - i * 58, "small", "sine");
      } else if (pattern === "largeSolo") {
        spawn(W / 2, -50, "large", "sine");
      } else if (pattern === "smallFinale") {
        const count = this.difficulty.current === "hard" ? 6 : 4;
        for (let i = 0; i < count; i += 1) spawn(72 + i * (306 / Math.max(1, count - 1)), -30 - (i % 2) * 55, "small", "zigzag");
      }
    }

    spawnEnemy(x, y, type, movement = "drift") {
      const enemy = new Enemy(x, y, type, movement);
      enemy.hp = Math.max(1, Math.round(enemy.hp * this.difficulty.config.enemyHpMultiplier));
      this.enemies.push(enemy);
    }

    spawnEnemyBullet(bullet) {
      const limit = ENEMY_BULLET_LIMITS[this.difficulty.current];
      if (this.enemyBullets.length >= limit) return false;
      this.enemyBullets.push(bullet);
      this.enemyBulletsSpawnedFrame += 1;
      return true;
    }

    updateLasers() {
      this.lasers.forEach((l) => {
        l.age += 1;
        if (l.age > l.warn && l.age < l.warn + l.live) {
          const playerHit = this.player.hitPoint;
          if (Math.abs(playerHit.x - l.x) < l.width + this.player.r && playerHit.y > 38) this.player.hit(this);
        }
      });
      this.lasers = this.lasers.filter((l) => l.age < l.warn + l.live);
    }

    resolveCollisions() {
      for (const b of this.playerBullets) {
        for (const e of this.enemies) {
          if (e.destroyed) continue;
          if (dist2(b, e) < (b.r + e.r) ** 2) {
            e.hp -= b.damage;
            b.y = -100;
            if (e.hp <= 0) this.destroyEnemy(e);
            break;
          }
        }
        if (this.boss && this.boss.entered && !this.boss.defeated && dist2(b, this.boss) < (b.r + this.boss.r) ** 2) {
          this.boss.takeDamage(this, b.damage);
          b.y = -100;
        }
      }

      for (const b of this.enemyBullets) {
        const hitDistance = b.r + this.player.r;
        const distanceSquared = dist2(b, this.player.hitPoint);
        if (distanceSquared < hitDistance ** 2) {
          b.y = H + 100;
          this.player.hit(this);
        } else if (!b.grazed && distanceSquared < (b.r + GRAZE_CONFIG.radius) ** 2) {
          b.grazed = true;
          this.registerGraze(b);
        }
      }

      for (const e of this.enemies) {
        if (e.destroyed) continue;
        if (dist2(e, this.player.hitPoint) < (e.r + this.player.r) ** 2) {
          e.hp = 0;
          e.destroyed = true;
          this.spawnBurst(e.x, e.y, "#f6d94e", 12);
          this.player.hit(this);
        }
      }

      // 逆順で判定し、取得成立したアイテムを同一フレームで即座に配列から除去する。
      for (let i = this.powerItems.length - 1; i >= 0; i -= 1) {
        const item = this.powerItems[i];
        if (item.collected || dist2(item, this.player) >= (item.r + this.player.r + 7) ** 2) continue;
        this.collectPowerItem(item);
        this.powerItems.splice(i, 1);
      }
      for (let i = this.pointItems.length - 1; i >= 0; i -= 1) {
        const item = this.pointItems[i];
        if (item.collected || dist2(item, this.player) >= (item.r + this.player.r + 7) ** 2) continue;
        this.collectPointItem(item);
        this.pointItems.splice(i, 1);
      }
    }

    collectPowerItem(item) {
      if (!item.active || item.collected) return false;
      item.collected = true;
      item.active = false;
      const oldStage = this.power.stage;
      const gained = this.power.add(item.amount);
      const stageChanged = this.power.stage > oldStage;
      const reachedMax = this.power.stage === 4 && oldStage < 4;

      if (gained === 0) {
        addScore(this, item.amount >= POWER_CONFIG.largePValue ? POWER_CONFIG.maxLargeBonus : POWER_CONFIG.maxSmallBonus);
        this.state.showMessage("POWER MAX BONUS", 75);
      } else {
        this.syncFollowers();
        this.state.showMessage(reachedMax ? "POWER MAX！" : stageChanged ? `POWER UP！ 随履 ${this.power.stage}足` : `POWER UP +${gained}`, 90);
        this.powerUpFlash = reachedMax ? 38 : stageChanged ? 26 : 12;
        if (stageChanged) {
          this.state.shake = Math.max(this.state.shake, reachedMax ? 9 : 4);
          this.spawnBurst(this.player.x, this.player.y, "#ffe477", reachedMax ? 42 : 24);
        }
      }

      this.audio.playSE(item.amount >= POWER_CONFIG.largePValue ? "item_p_large" : "item_p_small");
      if (stageChanged) {
        this.audio.playSE(reachedMax ? "power_max" : "power_up", { maxVoices: 1 });
        this.audio.playSE("follower_add", { cooldown: 100, maxVoices: 1 });
      }
      this.spawnBurst(item.x, item.y, stageChanged ? "#fff0a8" : "#8eeeff", stageChanged ? 22 : 12);
      return true;
    }

    collectPointItem(item) {
      if (!item.active || item.collected) return false;
      item.collected = true;
      item.active = false;
      addScore(this, item.scoreValue);
      this.spawnBurst(item.x, item.y, "#d58cff", 10);
      this.audio.playSE("point_item", { cooldown: 45, maxVoices: 3 });
      return true;
    }

    spawnBossPhaseBonus(x, y) {
      const powerCount = 8;
      const pointCount = 16;
      const total = powerCount + pointCount;
      for (let i = 0; i < total; i += 1) {
        const angle = (i / total) * TAU + Math.random() * 0.14;
        const speed = 1.7 + Math.random() * 1.8;
        const options = {
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.65,
          gravity: 0.045,
          drag: 0.992,
          autoCollectAt: 92 + Math.floor(Math.random() * 24),
        };
        if (i < powerCount) {
          const amount = i === 0 ? POWER_CONFIG.largePValue : POWER_CONFIG.smallPValue;
          this.powerItems.push(new PowerItem(x, y, amount, options));
        } else {
          this.pointItems.push(new PointItem(x, y, i % 5 === 0 ? 1200 : 500, options));
        }
      }
      this.spawnBurst(x, y, "#fff0a2", 42);
      this.state.shake = Math.max(this.state.shake, 7);
      this.audio.playSE("bonus_release", { maxVoices: 1 });
    }

    destroyEnemy(enemy) {
      if (enemy.destroyed) return;
      enemy.destroyed = true;
      enemy.hp = 0;
      addScore(this, enemy.scoreValue);
      this.spawnBurst(enemy.x, enemy.y, "#f6d94e", enemy.type === "large" ? 24 : 14);
      this.dropPowerItem(enemy);
      this.dropPointItem(enemy);
    }

    dropPowerItem(enemy) {
      const roll = Math.random();
      if (enemy.type === "small" && roll < 0.15) this.powerItems.push(new PowerItem(enemy.x, enemy.y, POWER_CONFIG.smallPValue));
      if (enemy.type === "medium" && roll < 0.35) this.powerItems.push(new PowerItem(enemy.x, enemy.y, POWER_CONFIG.smallPValue));
      if (enemy.type === "large") {
        this.powerItems.push(new PowerItem(enemy.x, enemy.y, POWER_CONFIG.smallPValue));
        if (roll < 0.2) this.powerItems.push(new PowerItem(enemy.x + 12, enemy.y, POWER_CONFIG.largePValue));
      }
    }

    dropPointItem(enemy) {
      const scoreValue = enemy.type === "large" ? 1200 : enemy.type === "medium" ? 500 : 200;
      const offsetX = enemy.type === "large" ? -15 : 0;
      this.pointItems.push(new PointItem(enemy.x + offsetX, enemy.y, scoreValue));
    }

    spawnBurst(x, y, color, count) {
      for (let i = 0; i < count; i += 1) this.particles.push(new Particle(x, y, color));
    }

    registerGraze(bullet) {
      this.grazeCount += 1;
      this.grazeFlash = 24;
      addScore(this, GRAZE_CONFIG.scorePerGraze);
      this.spawnBurst(bullet.x, bullet.y, "#e7c8ff", 5);
      this.audio.playSE("graze", { cooldown: 55, maxVoices: 2 });

      while (
        this.grazeMilestoneIndex < GRAZE_CONFIG.milestones.length
        && this.grazeCount >= GRAZE_CONFIG.milestones[this.grazeMilestoneIndex]
      ) {
        const milestone = GRAZE_CONFIG.milestones[this.grazeMilestoneIndex];
        addScore(this, milestone * 50);
        this.state.showMessage(`GRAZE ${milestone} BONUS！`, 120);
        this.grazeMilestoneIndex += 1;
      }
    }

    cancelEnemyBullets(score = false) {
      if (score) addScore(this, this.enemyBullets.length * SCORE_VALUES.bulletCancel);
      this.enemyBullets = [];
    }

    checkExtends() {
      while (this.score.extendIndex < EXTEND_THRESHOLDS.length && this.score.value >= EXTEND_THRESHOLDS[this.score.extendIndex]) {
        this.score.extendIndex += 1;
        this.life.extend();
        this.state.showMessage("EXTEND！ スリッパが一足増えた！", 150);
        this.spawnBurst(this.player.x, this.player.y, "#fff0a8", 28);
      }
    }

    saveCurrentRun(cleared) {
      this.save.saveRun(this.difficulty.current, this.score.value, this.checkpoints.current, cleared, this.continueCount);
    }

    defeatBoss() {
      if (!this.boss || this.boss.defeated) return;
      this.boss.defeated = true;
      this.spawnBurst(this.boss.x, this.boss.y, "#b7ff8a", 90);
      addScore(this, SCORE_VALUES.bossDefeat + SCORE_VALUES.stageClear);
      this.enemyBullets = [];
      this.lasers = [];
      this.endPlayerSpell();
      this.audio.pauseStage();
      this.state.showMessage("消滅", 120);
      this.startDialogue("scene_clear", () => {
        this.boss = null;
        this.state.mode = "clear";
        this.saveCurrentRun(true);
        this.state.showMessage("花粉、滅殺完了！", 9999);
        this.startDialogue("scene_ending", () => {
          this.state.mode = "clear";
        });
      });
    }

    draw() {
      ctx.save();
      if (this.state.shake > 0) {
        ctx.translate((Math.random() - 0.5) * this.state.shake, (Math.random() - 0.5) * this.state.shake);
      }
      this.drawBackground();

      this.lasers.forEach((l) => this.drawLaser(l));
      this.enemies.forEach((e) => e.draw(ctx));
      this.powerItems.forEach((item) => item.draw(ctx));
      this.pointItems.forEach((item) => item.draw(ctx));
      if (this.boss) this.boss.draw(ctx);
      this.drawPlayerSpellEffects();
      this.playerBullets.forEach((b) => b.draw(ctx));
      this.enemyBullets.forEach((b) => b.draw(ctx));
      this.particles.forEach((p) => p.draw(ctx));
      if (this.state.mode === "stage") {
        this.drawMobileJoystick();
        this.followers.forEach((follower) => follower.draw(ctx, this.state.time));
        this.player.draw(ctx, this.state.time);
      }

      if (this.boss?.currentCard?.frenzy) {
        ctx.fillStyle = `rgba(130, 0, 0, ${0.07 + Math.sin(this.state.time * 0.12) * 0.025})`;
        ctx.fillRect(0, 0, W, H);
      }

      ctx.restore();
      this.drawUi();
      if (this.state.mode === "title") this.drawTitle();
      if (this.state.mode === "paused") this.drawPauseMenu();
      if (this.state.mode === "gameover") this.drawGameOverMenu();
      if (this.state.mode === "clear") this.drawResult("花粉、滅殺完了！", "スコア " + this.score.value);
      this.drawBossSpellCutin();
      this.drawPlayerSpellCutin();
      this.drawPowerUpFlash();
      this.dialogue.draw(ctx);
    }

    drawPowerUpFlash() {
      if (this.powerUpFlash <= 0) return;
      const maxFrames = this.powerUpFlash > 26 ? 38 : 26;
      const progress = this.powerUpFlash / maxFrames;
      ctx.save();
      ctx.fillStyle = `rgba(255, 220, 82, ${progress * 0.2})`;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = Math.min(1, progress * 1.8);
      ctx.fillStyle = "#fff5b0";
      ctx.font = `900 ${maxFrames === 38 ? 38 : 30}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(maxFrames === 38 ? "POWER MAX!" : "POWER UP!", W / 2, H * 0.42);
      ctx.restore();
    }

    drawMobileJoystick() {
      if (!this.input.touchActive) return;
      const dx = this.input.touchX - this.input.joystickOriginX;
      const dy = this.input.touchY - this.input.joystickOriginY;
      const length = Math.hypot(dx, dy) || 1;
      const maxDistance = MOBILE_CONTROLS.joystickRadius - MOBILE_CONTROLS.knobRadius;
      const scale = Math.min(1, maxDistance / length);
      const knobX = this.input.joystickOriginX + dx * scale;
      const knobY = this.input.joystickOriginY + dy * scale;
      ctx.save();
      ctx.fillStyle = "rgba(9, 24, 21, 0.38)";
      ctx.strokeStyle = "rgba(218, 255, 244, 0.55)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.input.joystickOriginX, this.input.joystickOriginY, MOBILE_CONTROLS.joystickRadius, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(123, 231, 255, 0.62)";
      ctx.beginPath();
      ctx.arc(knobX, knobY, MOBILE_CONTROLS.knobRadius, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    drawPlayerSpellEffects() {
      if (!this.playerSpellActive || this.playerSpellTimer <= 0) return;
      const beam = this.getPlayerSpellBeam();
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      const g = ctx.createLinearGradient(beam.x, 0, beam.x, beam.bottom);
      g.addColorStop(0, "rgba(173, 245, 255, 0.08)");
      g.addColorStop(0.65, "rgba(135, 231, 255, 0.54)");
      g.addColorStop(1, "rgba(255, 255, 255, 0.86)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(beam.x - beam.w / 2, beam.bottom);
      ctx.lineTo(beam.x - beam.w * 0.32, 0);
      ctx.lineTo(beam.x + beam.w * 0.32, 0);
      ctx.lineTo(beam.x + beam.w / 2, beam.bottom);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = 3;
      ctx.stroke();
      for (const followerBeam of this.getFollowerSpellBeams()) {
        const fg = ctx.createLinearGradient(followerBeam.x, 0, followerBeam.x, followerBeam.bottom);
        fg.addColorStop(0, "rgba(126, 226, 255, 0.06)");
        fg.addColorStop(1, "rgba(183, 247, 255, 0.72)");
        ctx.fillStyle = fg;
        ctx.fillRect(followerBeam.x - followerBeam.w / 2, 0, followerBeam.w, followerBeam.bottom);
      }
      ctx.translate(beam.x, this.player.y - 58);
      ctx.rotate(-0.08);
      ctx.fillStyle = "rgba(190, 248, 255, 0.82)";
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 34, 62, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-20, -10);
      ctx.quadraticCurveTo(0, -36, 20, -10);
      ctx.stroke();
      ctx.restore();
    }

    drawPlayerSpellCutin() {
      if (this.playerSpellCutin <= 0) return;
      const alpha = Math.min(0.78, this.playerSpellCutin / 28);
      const visibility = Math.min(1, this.playerSpellCutin / 18);
      const slideX = this.getCutinSlideX(this.playerSpellCutin, PLAYER_CUTIN_FRAMES, 1);
      ctx.save();
      ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = visibility;
      if (this.slipperNovaCutinLoaded) {
        const bandH = 190;
        const bandY = H / 2 - bandH / 2;
        const sourceW = Math.min(this.slipperNovaCutin.width, this.slipperNovaCutin.height * (W / bandH));
        const sourceX = (this.slipperNovaCutin.width - sourceW) / 2;
        ctx.fillStyle = "#080907";
        ctx.fillRect(0, bandY - 5, W, bandH + 10);
        ctx.save();
        ctx.translate(slideX, 0);
        ctx.drawImage(
          this.slipperNovaCutin,
          sourceX,
          0,
          sourceW,
          this.slipperNovaCutin.height,
          0,
          bandY,
          W,
          bandH
        );
        ctx.restore();
        const sheen = ctx.createLinearGradient(0, bandY, W, bandY + bandH);
        sheen.addColorStop(0, "rgba(255, 220, 112, 0.05)");
        sheen.addColorStop(0.68, "rgba(255, 220, 112, 0)");
        sheen.addColorStop(1, "rgba(255, 240, 190, 0.18)");
        ctx.fillStyle = sheen;
        ctx.fillRect(0, bandY, W, bandH);
      }
      ctx.fillStyle = "#e8fbff";
      ctx.font = "900 30px system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
      ctx.shadowBlur = 8;
      ctx.fillText("SLIPPER NOVA", W - 18, H / 2 + 64);
      ctx.fillStyle = "#ffe18a";
      ctx.font = "800 15px system-ui, sans-serif";
      ctx.fillText("極履技「スリッパ・ノヴァ」", W - 18, H / 2 + 88);
      ctx.restore();
    }

    drawBossSpellCutin() {
      if (this.bossSpellCutin <= 0) return;
      const alpha = Math.min(0.8, this.bossSpellCutin / 24);
      const visibility = Math.min(1, this.bossSpellCutin / 16);
      const bandH = 190;
      const bandY = H / 2 - bandH / 2;
      const slideX = this.getCutinSlideX(this.bossSpellCutin, BOSS_CUTIN_FRAMES, -1);
      ctx.save();
      ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = visibility;
      ctx.fillStyle = "#0b1007";
      ctx.fillRect(0, bandY - 5, W, bandH + 10);
      if (this.suginomikotoCutinLoaded) {
        const sourceW = Math.min(this.suginomikotoCutin.width, this.suginomikotoCutin.height * (W / bandH));
        const sourceX = (this.suginomikotoCutin.width - sourceW) / 2;
        ctx.save();
        ctx.translate(slideX, 0);
        ctx.drawImage(
          this.suginomikotoCutin,
          sourceX,
          0,
          sourceW,
          this.suginomikotoCutin.height,
          0,
          bandY,
          W,
          bandH
        );
        ctx.restore();
      }
      const shade = ctx.createLinearGradient(0, bandY, W, bandY + bandH);
      shade.addColorStop(0, "rgba(30, 63, 21, 0.24)");
      shade.addColorStop(0.62, "rgba(30, 63, 21, 0)");
      shade.addColorStop(1, "rgba(255, 222, 91, 0.18)");
      ctx.fillStyle = shade;
      ctx.fillRect(0, bandY, W, bandH);
      ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
      ctx.shadowBlur = 8;
      ctx.fillStyle = "#f5ffd9";
      ctx.font = "900 27px system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("SUGINOMIKOTO", 18, H / 2 + 60);
      ctx.fillStyle = "#ffe479";
      ctx.font = "800 15px system-ui, sans-serif";
      ctx.fillText(this.bossSpellCutinName, 18, H / 2 + 86);
      ctx.restore();
    }

    getCutinSlideX(timer, totalFrames, direction) {
      const elapsed = totalFrames - timer;
      const enterFrames = 12;
      const exitFrames = 14;
      if (elapsed < enterFrames) {
        const progress = elapsed / enterFrames;
        return direction * (1 - progress * progress) * (W + 80);
      }
      if (timer < exitFrames) {
        const progress = 1 - timer / exitFrames;
        return -direction * progress * progress * (W + 80);
      }
      return 0;
    }

    drawBackground() {
      const t = this.state.time || 0;
      if (this.background.draw(ctx, t)) {
        this.drawPollenForeground(t);
        return;
      }
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, "#d8f1bf");
      sky.addColorStop(0.35, "#9fcf96");
      sky.addColorStop(1, "#253d31");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = "rgba(78, 63, 48, 0.34)";
      ctx.beginPath();
      ctx.moveTo(146, 0);
      ctx.lineTo(304, 0);
      ctx.lineTo(382, H);
      ctx.lineTo(68, H);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "rgba(42, 92, 52, 0.55)";
      ctx.lineWidth = 12;
      for (let i = 0; i < 9; i += 1) {
        const y = ((i * 118 + t * 0.8) % (H + 120)) - 60;
        ctx.beginPath();
        ctx.moveTo(46, y);
        ctx.lineTo(112, y + 80);
        ctx.moveTo(W - 46, y);
        ctx.lineTo(W - 112, y + 80);
        ctx.stroke();
      }

      for (let i = 0; i < 42; i += 1) {
        const x = (i * 73 + Math.sin(t * 0.01 + i) * 22) % W;
        const y = (i * 131 + t * (0.35 + (i % 4) * 0.06)) % H;
        ctx.fillStyle = `rgba(245, 215, 82, ${0.11 + (i % 3) * 0.035})`;
        ctx.beginPath();
        ctx.arc(x, y, 2 + (i % 4), 0, TAU);
        ctx.fill();
      }
    }

    drawPollenForeground(t) {
      for (let i = 0; i < 54; i += 1) {
        const x = (i * 67 + Math.sin(t * 0.012 + i) * 34) % W;
        const y = (i * 119 + t * (0.28 + (i % 4) * 0.05)) % H;
        const r = 1.4 + (i % 5) * 0.8;
        ctx.fillStyle = `rgba(246, 219, 82, ${0.09 + (i % 4) * 0.035})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, TAU);
        ctx.fill();
      }
    }

    drawLaser(l) {
      if (l.age <= l.warn) {
        ctx.globalAlpha = 0.28 + Math.sin(l.age * 0.4) * 0.12;
        ctx.fillStyle = "#f8e46d";
        ctx.fillRect(l.x - 2, 40, 4, H - 40);
        ctx.globalAlpha = 1;
        return;
      }
      const pulse = 0.75 + Math.sin(l.age * 0.6) * 0.2;
      ctx.fillStyle = `rgba(255, 220, 71, ${pulse})`;
      ctx.fillRect(l.x - l.width, 40, l.width * 2, H - 40);
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillRect(l.x - 4, 40, 8, H - 40);
    }

    drawUi() {
      ctx.fillStyle = "rgba(8, 18, 15, 0.72)";
      ctx.fillRect(0, 0, W, 38);
      ctx.fillStyle = "#f3fff2";
      ctx.font = "700 15px system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`SCORE ${this.score.value}`, 12, 24);
      ctx.textAlign = "center";
      ctx.fillText(`${this.state.stageName} ${this.difficulty.label}`, W / 2, 24);
      ctx.textAlign = "right";
      ctx.fillText(`SLIPPER x ${this.life.lives}`, W - 12, 24);
      ctx.fillStyle = "#fff0a8";
      ctx.font = "700 13px system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`履技 x ${this.playerSpellCount}`, 12, 55);
      ctx.textAlign = "right";
      ctx.fillText(`CP ${this.checkpoints.current}  CONT ${this.continueCount}`, W - 12, 55);
      ctx.fillStyle = "#e8c8ff";
      ctx.fillText(`GRAZE ${this.grazeCount}`, W - 12, 74);

      const powerBarX = 12;
      const powerBarY = 64;
      const powerBarW = 146;
      const powerRatio = this.power.value / this.power.max;
      ctx.fillStyle = "rgba(8, 18, 15, 0.78)";
      ctx.fillRect(powerBarX, powerBarY, powerBarW, 16);
      const powerGradient = ctx.createLinearGradient(powerBarX, 0, powerBarX + powerBarW, 0);
      powerGradient.addColorStop(0, "#74dfff");
      powerGradient.addColorStop(0.68, "#73f1c5");
      powerGradient.addColorStop(1, "#ffe477");
      ctx.fillStyle = powerGradient;
      ctx.fillRect(powerBarX + 1, powerBarY + 1, (powerBarW - 2) * powerRatio, 14);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.52)";
      ctx.strokeRect(powerBarX, powerBarY, powerBarW, 16);
      ctx.fillStyle = "#ffffff";
      ctx.font = "800 10px system-ui, sans-serif";
      ctx.textAlign = "center";
      const powerStageLabel = this.power.stage >= 4 ? "POWER MAX" : `POWER ${this.power.stage}`;
      ctx.fillText(`${powerStageLabel}  ${this.power.label}`, powerBarX + powerBarW / 2, powerBarY + 12);

      if (this.boss && this.boss.entered && this.state.mode === "stage") {
        const barX = 54;
        const barWidth = W - 108;
        const barHeight = 9;
        const barGap = 4;
        const hpColor = (ratio) => {
          if (ratio >= 0.6) return "#68db62";
          if (ratio > 0.3) return "#f2d64b";
          return "#ef5350";
        };
        const drawLifeBar = (y, ratio, state = "current") => {
          ctx.fillStyle = "rgba(10, 25, 17, 0.78)";
          ctx.fillRect(barX, y, barWidth, barHeight);
          if (state === "empty") return;
          const visibleRatio = clamp(ratio, 0, 1);
          ctx.fillStyle = state === "reserve" ? "#68db62" : hpColor(visibleRatio);
          ctx.fillRect(barX, y, barWidth * visibleRatio, barHeight);
          ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
          ctx.strokeRect(barX, y, barWidth, barHeight);
        };

        const currentRatio = Math.max(0, this.boss.hp / this.boss.maxHp);
        if (this.boss.cardIndex === 0) {
          drawLifeBar(45, currentRatio);
        } else {
          // 1本目の破壊後に残り2本を追加し、下段（第2ライフ）から削る。
          const phase3State = this.boss.cardIndex === 2 ? "current" : "reserve";
          const phase2State = this.boss.cardIndex === 1 ? "current" : "empty";
          drawLifeBar(45, this.boss.cardIndex === 2 ? currentRatio : 1, phase3State);
          drawLifeBar(45 + barHeight + barGap, this.boss.cardIndex === 1 ? currentRatio : 0, phase2State);
        }
        if (this.boss.currentCard && this.boss.currentCard.isSpell) {
          const card = this.boss.currentCard;
          const rest = Math.max(0, Math.ceil((card.duration - card.age) / 60));
          ctx.fillStyle = "rgba(8, 18, 15, 0.76)";
          ctx.fillRect(78, 88, W - 156, 28);
          ctx.fillStyle = "#fff1a8";
          ctx.font = "800 15px system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(card.survival ? `SURVIVE  ${rest} sec` : `${card.name}  ${rest}`, W / 2, 108);
        }
      }

      ctx.fillStyle = "rgba(255, 255, 255, 0.68)";
      ctx.font = "12px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("花粉滅殺スリッパー！", W / 2, H - 12);

      if (this.state.messageTimer > 0) {
        ctx.fillStyle = "rgba(9, 20, 15, 0.68)";
        ctx.fillRect(64, 96, W - 128, 42);
        ctx.fillStyle = "#fff7bd";
        ctx.font = "700 20px system-ui, sans-serif";
        ctx.fillText(this.state.message, W / 2, 124);
      }

      if (this.grazeFlash > 0) {
        ctx.globalAlpha = Math.min(1, this.grazeFlash / 10);
        ctx.fillStyle = "#f0dcff";
        ctx.font = "900 18px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("GRAZE +1", this.player.x, this.player.y - 42);
        ctx.globalAlpha = 1;
      }

      if (this.state.bossNameTimer > 0 && this.boss) {
        ctx.fillStyle = "rgba(7, 15, 12, 0.78)";
        ctx.fillRect(50, 150, W - 100, 74);
        ctx.fillStyle = "#d8ffd2";
        ctx.font = "700 16px system-ui, sans-serif";
        ctx.fillText("一面ボス", W / 2, 178);
        ctx.font = "800 29px system-ui, sans-serif";
        ctx.fillText(this.boss.name, W / 2, 210);
      }

      if (this.debugVisible) this.drawDebugOverlay();
    }

    drawDebugOverlay() {
      const bulletsLastSecond = this.enemyBulletSpawnHistory.reduce((sum, count) => sum + count, 0);
      const activeEnemyPatterns = this.enemies.filter((enemy) => !enemy.destroyed && enemy.y > 20 && enemy.y < H - 120).length;
      const activePatterns = activeEnemyPatterns + (this.boss?.currentCard && !this.boss.defeated ? 1 : 0);
      ctx.fillStyle = "rgba(0, 0, 0, 0.76)";
      ctx.fillRect(8, H - 154, 224, 136);
      ctx.fillStyle = "#dfffd8";
      ctx.font = "12px ui-monospace, Consolas, monospace";
      ctx.textAlign = "left";
      const rows = [
        `DEBUG F3  ${this.difficulty.label}`,
        `ENEMIES ${this.enemies.length}`,
        `ENEMY BULLETS ${this.enemyBullets.length}`,
        `SPAWNED / 1s ${bulletsLastSecond}`,
        `WAVE ${this.currentWave} / ${STAGE_WAVES.length}`,
        `ACTIVE PATTERNS ${activePatterns}`,
      ];
      rows.forEach((row, index) => ctx.fillText(row, 18, H - 132 + index * 19));
    }

    drawTitle() {
      ctx.fillStyle = "rgba(5, 13, 12, 0.70)";
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = "center";
      ctx.fillStyle = "#f8ffe9";
      ctx.font = "900 42px system-ui, sans-serif";
      ctx.fillText("花粉滅殺", W / 2, 230);
      ctx.fillStyle = "#91e9ff";
      ctx.font = "900 36px system-ui, sans-serif";
      ctx.fillText("スリッパー！", W / 2, 276);
      ctx.fillStyle = "#fff1a6";
      ctx.font = "16px system-ui, sans-serif";
      ctx.fillText("King of Slipper 外伝ミニゲーム", W / 2, 320);
      if (this.titlePanel === "options") {
        this.drawOptions();
        return;
      }
      this.drawMenu(this.titleMenu, 395, (item) => {
        return item.label;
      });
      ctx.fillStyle = "rgba(239, 255, 237, 0.82)";
      ctx.font = "13px system-ui, sans-serif";
      if (this.titlePanel === "how") {
        ctx.fillText("移動: 矢印/WASD/ドラッグ  低速: Shift/低速ボタン", W / 2, 610);
        ctx.fillText("ショット: Z/Space  履技: X/履技ボタン  ポーズ: Esc/P/MENU", W / 2, 634);
        ctx.fillText("マウス: 移動  左ボタンショット  右クリック履技", W / 2, 658);
        ctx.fillText("Xbox: 左スティック/D-pad移動  Aショット/決定  X履技  LB/RB低速", W / 2, 682);
      } else if (this.titlePanel === "score") {
        const save = this.save.data;
        ctx.fillText(`EASY ${save.easy.highScore} / CP${save.easy.maxCheckpoint} / ${save.easy.cleared ? "CLEAR" : "未クリア"}`, W / 2, 598);
        ctx.fillText(`NORMAL ${save.normal.highScore} / CP${save.normal.maxCheckpoint} / ${save.normal.cleared ? "CLEAR" : "未クリア"}`, W / 2, 622);
        ctx.fillText(`HARD ${save.hard.highScore} / CP${save.hard.maxCheckpoint} / ${save.hard.cleared ? "CLEAR" : "未クリア"}`, W / 2, 646);
      } else {
        ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
        ctx.fillRect(86, 594, W - 172, 38);
        ctx.strokeStyle = "rgba(255, 240, 168, 0.58)";
        ctx.strokeRect(86, 594, W - 172, 38);
        ctx.fillStyle = "#fff0a8";
        ctx.font = "800 15px system-ui, sans-serif";
        ctx.fillText(`DIFFICULTY  < ${this.difficulty.label} >`, W / 2, 619);
        ctx.fillStyle = "rgba(239, 255, 237, 0.82)";
        ctx.font = "13px system-ui, sans-serif";
        ctx.fillText("上下で選択、START選択中の左右で難易度変更", W / 2, 660);
      }
    }

    drawOptions() {
      ctx.fillStyle = "#f8ffe9";
      ctx.font = "900 28px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("OPTIONS", W / 2, 350);
      this.drawMenu(this.optionsMenu, 365, (item) => {
        if (item.action === "bgm") return this.formatVolumeOption("BGM VOLUME", this.audio.getBGMVolume());
        if (item.action === "se") return this.formatVolumeOption("SE VOLUME", this.audio.getSEVolume());
        if (item.action === "mute") return `MASTER MUTE  [${this.audio.settings.masterMute ? "ON" : "OFF"}]`;
        return item.label;
      });
      ctx.fillStyle = "rgba(239, 255, 237, 0.75)";
      ctx.font = "13px system-ui, sans-serif";
      ctx.fillText("左右・画面左/右タップで調整", W / 2, 590);
      ctx.fillText("Esc / B で戻る", W / 2, 614);
    }

    formatVolumeOption(label, value) {
      const percent = Math.round(value * 100);
      const filled = Math.round(percent / 10);
      return `${label}  [${"■".repeat(filled)}${"□".repeat(10 - filled)}] ${percent}`;
    }

    drawMenu(menu, startY, labeler = (item) => item.label) {
      ctx.textAlign = "center";
      menu.items.forEach((item, i) => {
        const selected = i === menu.index;
        ctx.fillStyle = selected ? "rgba(255, 240, 168, 0.22)" : "rgba(0, 0, 0, 0.38)";
        if (item.disabled) ctx.fillStyle = "rgba(80, 80, 80, 0.28)";
        ctx.fillRect(86, startY + i * 48, W - 172, 38);
        ctx.strokeStyle = selected ? "#fff0a8" : "rgba(255,255,255,0.18)";
        ctx.strokeRect(86, startY + i * 48, W - 172, 38);
        const label = labeler(item);
        ctx.fillStyle = item.disabled ? "rgba(255,255,255,0.32)" : "#f6fff1";
        ctx.font = `800 ${label.length > 24 ? 12 : label.length > 18 ? 14 : 18}px system-ui, sans-serif`;
        ctx.fillText(label, W / 2, startY + i * 48 + 25);
      });
    }

    drawPauseMenu() {
      ctx.fillStyle = "rgba(0, 0, 0, 0.68)";
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = "center";
      ctx.fillStyle = "#f6fff1";
      ctx.font = "900 34px system-ui, sans-serif";
      ctx.fillText("PAUSE", W / 2, 280);
      this.drawMenu(this.pauseMenu, 345);
      this.drawConfirm(this.pauseMenu);
    }

    drawGameOverMenu() {
      ctx.fillStyle = "rgba(5, 13, 12, 0.76)";
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffb8a8";
      ctx.font = "900 34px system-ui, sans-serif";
      ctx.fillText("GAME OVER", W / 2, 265);
      ctx.fillStyle = "#eaffdf";
      ctx.font = "15px system-ui, sans-serif";
      ctx.fillText(`CONTINUE ${this.continuesLeft} / SCORE ${this.score.value}`, W / 2, 305);
      this.drawMenu(this.gameOverMenu, 345);
    }

    drawConfirm(menu) {
      if (!menu.confirm) return;
      ctx.fillStyle = "rgba(0, 0, 0, 0.86)";
      ctx.fillRect(44, 356, W - 88, 180);
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.strokeRect(44, 356, W - 88, 180);
      ctx.fillStyle = "#f6fff1";
      ctx.font = "700 17px system-ui, sans-serif";
      ctx.textAlign = "center";
      this.wrapCentered(menu.confirm.text, W / 2, 405, W - 120, 24);
      ["YES", "NO"].forEach((label, i) => {
        ctx.fillStyle = menu.confirm.choice === i ? "rgba(255, 240, 168, 0.22)" : "rgba(255,255,255,0.08)";
        ctx.fillRect(86 + i * 150, 462, 128, 50);
        ctx.strokeStyle = menu.confirm.choice === i ? "#fff0a8" : "rgba(255,255,255,0.18)";
        ctx.strokeRect(86 + i * 150, 462, 128, 50);
        ctx.fillStyle = "#f6fff1";
        ctx.font = "800 18px system-ui, sans-serif";
        ctx.fillText(label, 150 + i * 150, 494);
      });
    }

    wrapCentered(text, x, y, maxWidth, lineHeight) {
      let line = "";
      const rows = [];
      for (const ch of text) {
        const next = line + ch;
        if (ctx.measureText(next).width > maxWidth && line) {
          rows.push(line);
          line = ch;
        } else {
          line = next;
        }
      }
      if (line) rows.push(line);
      rows.forEach((row, i) => ctx.fillText(row, x, y + i * lineHeight));
    }

    drawResult(title, subtitle) {
      ctx.fillStyle = "rgba(5, 13, 12, 0.72)";
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = "center";
      ctx.fillStyle = title === "GAME OVER" ? "#ffb8a8" : "#f8ffe9";
      ctx.font = "900 34px system-ui, sans-serif";
      ctx.fillText(title, W / 2, 330);
      ctx.fillStyle = "#eaffdf";
      ctx.font = "18px system-ui, sans-serif";
      ctx.fillText(subtitle, W / 2, 382);
      ctx.font = "15px system-ui, sans-serif";
      ctx.fillText("Z / Space / タップでタイトルから再開", W / 2, 432);
    }
  }

  const game = new Game();
  const updateManager = new UpdateManager();
  if (new URLSearchParams(location.search).has("debug")) {
    window.__POLLEN_GAME__ = game;
  }
  updateManager.init();
  requestAnimationFrame(game.loop);
})();
