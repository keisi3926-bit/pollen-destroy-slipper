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
  const isBrandSplashActive = () => document.body.classList.contains("brand-splash-active");
  const dist2 = (a, b) => {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return dx * dx + dy * dy;
  };
  const PORTRAIT_BASE = "assets/characters/";
  const BACKGROUND_STAGE1 = "assets/backgrounds/stage1_pollen_sando.png";
  const BACKGROUND_STAGE2 = "assets/backgrounds/stage2_hinoki_road.jpg";
  const BACKGROUND_STAGE3 = "assets/backgrounds/stage3_autumn_pollen_road.png";
  const BGM_STAGE1 = "assets/audio/stage1_spring_pollen_path.mp3";
  const BGM_BOSS1 = "assets/audio/boss_suginomikoto.mp3";
  const BGM_STAGE2 = "assets/audio/stage2_theme.mp3";
  const BGM_BOSS2 = "assets/audio/boss2_theme.mp3";
  const BGM_STAGE3 = "assets/audio/bgm/stage3_theme.mp3";
  const BGM_BOSS3 = "assets/audio/bgm/boss3_theme.mp3";
  const AUDIO_SETTINGS_KEY = "pollenDestroySlipperAudioSettings";
  const BGM_SOURCES = {
    stage1: BGM_STAGE1,
    boss1: BGM_BOSS1,
    stage2: BGM_STAGE2,
    boss2: BGM_BOSS2,
    stage3: BGM_STAGE3,
    boss3: BGM_BOSS3,
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
    "pichuun",
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
  const HINOKI_BOSS_ASSET = "assets/characters/hinoki_shogun.png";
  const LORD_RAGWEED_ASSET = "assets/characters/lord_ragweed.png";
  const POLLEN_ENEMY_ASSET = "assets/enemies/pollen_enemies.png";
  const HINOKI_ENEMY_ASSET = "assets/enemies/hinoki_enemies.png";
  const STAGE3_ENEMY_ASSET = "assets/enemies/stage3_enemies.png";
  const SLIPPER_NOVA_CUTIN_ASSET = "assets/cutin/haou_slipper_nova.png";
  const SUGINOMIKOTO_CUTIN_ASSET = "assets/cutin/suginomikoto_divine_attack.png";
  const HINOKI_SHOGUN_CUTIN_ASSET = "assets/cutin/hinoki_shogun_divine_attack.png";
  const LORD_RAGWEED_CUTIN_ASSET = "assets/cutin/lord_ragweed_cutin.png";
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
  const APP_VERSION = "0.37.7";
  const STAGE_ORDER = ["stage1", "stage2", "stage3"];
  const ARCADE_CLEAR_WAIT_FRAMES = 150;
  const FIXED_STEP_SECONDS = 1 / 60;
  const BOSS_DAMAGE_MULTIPLIER = 0.68;
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
  const STAGE2_WAVES = [
    { time: 100, pattern: "hinokiVanguard" },
    { time: 340, pattern: "hinokiWing" },
    { time: 610, pattern: "mixedFan" },
    { time: 900, pattern: "hinokiSweep" },
    { time: 1180, pattern: "hinokiHeavyEscort" },
    { time: 1480, pattern: "pollenInterlude" },
    { time: 1760, pattern: "hinokiFormation" },
    { time: 2060, pattern: "mixedCross" },
    { time: 2380, pattern: "hinokiWing" },
    { time: 2670, pattern: "hinokiHeavyEscort" },
    { time: 2960, pattern: "hinokiFanFinale" },
    { time: 3280, pattern: "hinokiGuard" },
  ];
  const STAGE3_WAVES = [
    { time: 90, pattern: "ragweedBeeRush" },
    { time: 330, pattern: "ragweedEyeCircle" },
    { time: 590, pattern: "ragweedPincer" },
    { time: 860, pattern: "ragweedSpiderFan" },
    { time: 1140, pattern: "ragweedBeeCross" },
    { time: 1430, pattern: "ragweedMixedAmbush" },
    { time: 1720, pattern: "ragweedEyePair" },
    { time: 2020, pattern: "ragweedSpiderLine" },
    { time: 2320, pattern: "ragweedPincer" },
    { time: 2620, pattern: "ragweedMixedAmbush" },
    { time: 2920, pattern: "ragweedAutumnStorm" },
    { time: 3260, pattern: "ragweedGate" },
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
      survivalTime: 75,
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
      survivalTime: 60,
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
      survivalTime: 45,
    },
  };

  const STAGE_DEFINITIONS = {
    stage1: {
      id: "stage1",
      title: "一面 春の花粉参道",
      selectLabel: "STAGE 1　春の花粉参道",
      bossLabel: "一面ボス",
      background: BACKGROUND_STAGE1,
      bgm: "stage1",
      bossBgm: "boss1",
      waves: STAGE_WAVES,
      bossTime: 3420,
      warning: "花粉濃度、異常上昇",
      enemyFamily: "pollen",
      introScene: "scene_intro",
      bossScene: "scene_boss",
      clearScene: "scene_clear",
      endingScene: "scene_ending",
      clearMessage: "STAGE1 CLEAR",
      clearSubtitle: "花粉、滅殺完了！",
      clearFooter: "",
      boss: {
        name: "スギノミコト",
        asset: BOSS_ASSET,
        cutin: SUGINOMIKOTO_CUTIN_ASSET,
        cutinLabel: "SUGINOMIKOTO",
        imageCrop: { sx: 0, sy: 0, sw: 1024, sh: 1536 },
        spellCards: [
          {
            name: "Phase 1 通常弾幕",
            duration: 1500,
            durationTimes: { easy: 2400, normal: 2100, hard: 1500 },
            hp: 300,
            pattern: "normalSpread",
            type: "normal",
          },
          {
            name: "大神威「無限飛散」",
            duration: 1800,
            hp: 1,
            pattern: "infiniteScatter",
            survival: true,
            survivalTimes: { easy: 40, normal: 35, hard: 30 },
          },
          { name: "終神威「杉並木封鎖」", duration: 2400, hp: 620, pattern: "cedarFinal", lifeBars: 3 },
        ],
      },
    },
    stage2: {
      id: "stage2",
      title: "二面　檜風街道",
      selectLabel: "STAGE 2　檜風街道",
      bossLabel: "二面ボス",
      background: BACKGROUND_STAGE2,
      bgm: "stage2",
      bossBgm: "boss2",
      waves: STAGE2_WAVES,
      bossTime: 3500,
      warning: "檜の風圧、街道を封鎖",
      enemyFamily: "hinoki",
      introScene: null,
      bossScene: "stage2_boss_intro",
      clearScene: "stage2_boss_defeat",
      endingScene: "stage2_clear",
      clearMessage: "STAGE2 CLEAR",
      clearSubtitle: "檜風、撃破完了",
      clearFooter: "TO BE CONTINUED",
      boss: {
        name: "ヒノキ将軍",
        asset: HINOKI_BOSS_ASSET,
        cutin: HINOKI_SHOGUN_CUTIN_ASSET,
        cutinLabel: "HINOKI SHOGUN",
        imageCrop: null,
        spellCards: [
          {
            name: "第一神威「檜扇陣」",
            duration: 1500,
            durationTimes: { easy: 2400, normal: 2100, hard: 1500 },
            hp: 430,
            pattern: "hinokiFan",
            type: "normal",
          },
          {
            name: "第二神威「檜風耐陣」",
            duration: 1800,
            hp: 1,
            pattern: "hinokiSurvival",
            survival: true,
            survivalTimeMultiplier: 1,
          },
          { name: "第三神威「千檜封鎖」", duration: 2520, hp: 760, pattern: "hinokiFinal", lifeBars: 3 },
        ],
      },
    },
    stage3: {
      id: "stage3",
      title: "三面　秋花粉の廃道",
      selectLabel: "STAGE 3　秋花粉の廃道",
      bossLabel: "三面ボス",
      background: BACKGROUND_STAGE3,
      bgm: "stage3",
      bossBgm: "boss3",
      waves: STAGE3_WAVES,
      bossTime: 3540,
      warning: "秋花粉濃度、危険域",
      enemyFamily: "ragweed",
      introScene: null,
      bossScene: "stage3_boss_intro",
      clearScene: "stage3_boss_defeat",
      endingScene: "stage3_clear",
      clearMessage: "STAGE3 CLEAR",
      clearSubtitle: "秋花粉、撃破完了",
      clearFooter: "TO BE CONTINUED",
      boss: {
        name: "ロード・ラグウィード",
        asset: LORD_RAGWEED_ASSET,
        cutin: LORD_RAGWEED_CUTIN_ASSET,
        cutinLabel: "LORD RAGWEED",
        imageCrop: null,
        spellCards: [
          {
            name: "神威「秋塵毒花」",
            duration: 1620,
            durationTimes: { easy: 2520, normal: 2220, hard: 1620 },
            hp: 510,
            pattern: "ragweedPoisonBloom",
            type: "spell",
          },
          {
            name: "神威「雑草迷霧」",
            duration: 1800,
            hp: 1,
            pattern: "ragweedMistSurvival",
            survival: true,
            survivalTimeMultiplier: 1,
          },
          { name: "大神威「荒野花粉葬」", duration: 2700, hp: 850, pattern: "ragweedWastelandFuneral", lifeBars: 3 },
        ],
      },
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
    stage2_boss_intro: [
      { speaker: "boss", text: "杉を退けたか。", portrait: "hinoki_shogun.png", side: "right" },
      { speaker: "boss", text: "だが、春の戦はまだ終わらぬ。", portrait: "hinoki_shogun.png", side: "right" },
      { speaker: "player", text: "知ってたよ。", portrait: "player.png", side: "left" },
      { speaker: "player", text: "だいたい杉の次は檜って相場が決まってる。", portrait: "player.png", side: "left" },
      { speaker: "boss", text: "ならば話は早い。", portrait: "hinoki_shogun.png", side: "right" },
      { speaker: "boss", text: "我が名はヒノキ将軍。", portrait: "hinoki_shogun.png", side: "right" },
      { speaker: "boss", text: "檜風を率いる、第二の花粉将。", portrait: "hinoki_shogun.png", side: "right" },
      { speaker: "player", text: "二番手のくせに偉そうだな。", portrait: "player.png", side: "left" },
      { speaker: "boss", text: "二番手ではない。", portrait: "hinoki_shogun.png", side: "right" },
      { speaker: "boss", text: "第二波だ。", portrait: "hinoki_shogun.png", side: "right" },
      { speaker: "player", text: "どっちでも鼻に来るんだよ！", portrait: "player.png", side: "left" },
      { speaker: "boss", text: "檜の陣、展開。", portrait: "hinoki_shogun.png", side: "right" },
      { speaker: "boss", text: "神威――檜風神陣。", portrait: "hinoki_shogun.png", side: "right" },
      { speaker: "player", text: "来い。", portrait: "player.png", side: "left" },
      { speaker: "player", text: "まとめて叩き落とす。", portrait: "player.png", side: "left" },
    ],
    stage2_boss_defeat: [
      { speaker: "boss", text: "……見事だ。", portrait: "hinoki_shogun.png", side: "right" },
      { speaker: "boss", text: "檜風、ここに敗れる。", portrait: "hinoki_shogun.png", side: "right" },
      { speaker: "player", text: "よし。", portrait: "player.png", side: "left" },
      { speaker: "player", text: "これで春も少しはマシになるな。", portrait: "player.png", side: "left" },
      { speaker: "boss", text: "甘い。", portrait: "hinoki_shogun.png", side: "right" },
      { speaker: "player", text: "え。", portrait: "player.png", side: "left" },
      { speaker: "boss", text: "我らは四天王の一角に過ぎぬ。", portrait: "hinoki_shogun.png", side: "right" },
      { speaker: "player", text: "……増えるな。", portrait: "player.png", side: "left" },
      { speaker: "boss", text: "次なる花粉は、さらに厄介だ。", portrait: "hinoki_shogun.png", side: "right" },
      { speaker: "player", text: "もう帰っていい？", portrait: "player.png", side: "left" },
      { speaker: "boss", text: "否。", portrait: "hinoki_shogun.png", side: "right" },
      { speaker: "boss", text: "春は、まだ終わらぬ。", portrait: "hinoki_shogun.png", side: "right" },
      { speaker: "player", text: "終わってくれ。", portrait: "player.png", side: "left" },
    ],
    stage2_clear: [
      { speaker: "system", text: "STAGE2 CLEAR", portrait: "player.png", side: "left" },
      { speaker: "system", text: "檜風、撃破完了", portrait: "player.png", side: "left" },
      { speaker: "system", text: "TO BE CONTINUED", portrait: "player.png", side: "left" },
      { speaker: "player", text: "杉の次は檜。", portrait: "player.png", side: "left" },
      { speaker: "player", text: "花粉って、ほんと段階制なんだな……。", portrait: "player.png", side: "left" },
    ],
    stage3_boss_intro: [
      { speaker: "boss", text: "ようこそ、秋花粉の廃道へ。", portrait: "lord_ragweed.png", side: "right" },
      { speaker: "boss", text: "杉を越え、檜を越え……なお進むか。", portrait: "lord_ragweed.png", side: "right" },
      { speaker: "player", text: "進みたくて進んでるわけじゃない。", portrait: "player.png", side: "left" },
      { speaker: "player", text: "鼻と目が限界なんだよ。", portrait: "player.png", side: "left" },
      { speaker: "boss", text: "ならば喜べ。", portrait: "lord_ragweed.png", side: "right" },
      { speaker: "boss", text: "ここから先は、春だけの地獄ではない。", portrait: "lord_ragweed.png", side: "right" },
      { speaker: "player", text: "秋花粉まで出てくるな！", portrait: "player.png", side: "left" },
      { speaker: "boss", text: "我が名はロード・ラグウィード。", portrait: "lord_ragweed.png", side: "right" },
      { speaker: "boss", text: "荒れ地に根を張る、第三の花粉王。", portrait: "lord_ragweed.png", side: "right" },
      { speaker: "player", text: "王とか将軍とか、花粉のくせに肩書きが重いんだよ。", portrait: "player.png", side: "left" },
      { speaker: "boss", text: "軽い花粉ほど、遠くまで届く。", portrait: "lord_ragweed.png", side: "right" },
      { speaker: "player", text: "それは名言っぽく言うことじゃない。", portrait: "player.png", side: "left" },
      { speaker: "boss", text: "では始めよう。", portrait: "lord_ragweed.png", side: "right" },
      { speaker: "boss", text: "神威――秋塵毒花。", portrait: "lord_ragweed.png", side: "right" },
      { speaker: "player", text: "来い。", portrait: "player.png", side: "left" },
      { speaker: "player", text: "秋ごと叩き落としてやる。", portrait: "player.png", side: "left" },
    ],
    stage3_boss_defeat: [
      { speaker: "boss", text: "……見事。", portrait: "lord_ragweed.png", side: "right" },
      { speaker: "boss", text: "我が毒花粉を、ここまで払うとは。", portrait: "lord_ragweed.png", side: "right" },
      { speaker: "player", text: "これで少しは空気がマシになるな。", portrait: "player.png", side: "left" },
      { speaker: "boss", text: "空気は巡る。", portrait: "lord_ragweed.png", side: "right" },
      { speaker: "boss", text: "花粉もまた、巡る。", portrait: "lord_ragweed.png", side: "right" },
      { speaker: "player", text: "やめろ。", portrait: "player.png", side: "left" },
      { speaker: "player", text: "循環型社会みたいに言うな。", portrait: "player.png", side: "left" },
      { speaker: "boss", text: "次なる者は、さらに白く、さらに静かだ。", portrait: "lord_ragweed.png", side: "right" },
      { speaker: "player", text: "白い花粉？", portrait: "player.png", side: "left" },
      { speaker: "boss", text: "シラカバ・プリースト。", portrait: "lord_ragweed.png", side: "right" },
      { speaker: "boss", text: "祈りのように舞い、呪いのように積もる花粉。", portrait: "lord_ragweed.png", side: "right" },
      { speaker: "player", text: "花粉が祈るな。", portrait: "player.png", side: "left" },
      { speaker: "boss", text: "進むがいい、スリッパの王よ。", portrait: "lord_ragweed.png", side: "right" },
      { speaker: "boss", text: "季節は、まだ終わらぬ。", portrait: "lord_ragweed.png", side: "right" },
      { speaker: "player", text: "終われ。", portrait: "player.png", side: "left" },
    ],
    stage3_clear: [
      { speaker: "system", text: "STAGE3 CLEAR", portrait: "player.png", side: "left" },
      { speaker: "system", text: "秋花粉、撃破完了", portrait: "player.png", side: "left" },
      { speaker: "system", text: "TO BE CONTINUED", portrait: "player.png", side: "left" },
      { speaker: "player", text: "春を抜けたら秋だった。", portrait: "player.png", side: "left" },
      { speaker: "player", text: "花粉って、季節をまたぐなよ……。", portrait: "player.png", side: "left" },
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
        highScores: {
          easy: { stage1: 0, stage2: 0, stage3: 0, total: 0 },
          normal: { stage1: 0, stage2: 0, stage3: 0, total: 0 },
          hard: { stage1: 0, stage2: 0, stage3: 0, total: 0 },
        },
        clearFlags: { stage1: false, stage2: false, stage3: false },
        settings: { lastDifficulty: "normal", volume: 0.5, gamepadEnabled: true },
      };
    }

    load() {
      try {
        const defaults = this.defaultData();
        const stored = JSON.parse(localStorage.getItem(this.key) || "{}");
        const data = {
          ...defaults,
          ...stored,
          settings: { ...defaults.settings, ...(stored.settings || {}) },
          clearFlags: { ...defaults.clearFlags, ...(stored.clearFlags || {}) },
          highScores: {},
        };
        for (const difficulty of ["easy", "normal", "hard"]) {
          data[difficulty] = { ...defaults[difficulty], ...(stored[difficulty] || {}) };
          const legacyScore = data[difficulty].highScore || 0;
          data.highScores[difficulty] = {
            ...defaults.highScores[difficulty],
            ...(stored.highScores?.[difficulty] || {}),
          };
          data.highScores[difficulty].stage1 = Math.max(data.highScores[difficulty].stage1 || 0, legacyScore);
          data.highScores[difficulty].total = Math.max(data.highScores[difficulty].total || 0, legacyScore);
          if (data[difficulty].cleared) data.clearFlags.stage1 = true;
        }
        localStorage.setItem(this.key, JSON.stringify(data));
        return data;
      } catch {
        return this.defaultData();
      }
    }

    saveRun(difficulty, stageId, stageScore, checkpoint, cleared, continues, totalScore = stageScore) {
      const current = this.data[difficulty] || this.defaultData()[difficulty];
      current.highScore = Math.max(current.highScore || 0, totalScore);
      current.maxCheckpoint = Math.max(current.maxCheckpoint || 0, checkpoint);
      current.cleared = Boolean(current.cleared || cleared);
      current.continues = Math.max(current.continues || 0, continues);
      this.data[difficulty] = current;
      const difficultyScores = this.data.highScores[difficulty];
      difficultyScores[stageId] = Math.max(difficultyScores[stageId] || 0, stageScore);
      difficultyScores.total = Math.max(difficultyScores.total || 0, totalScore);
      if (cleared) this.data.clearFlags[stageId] = true;
      localStorage.setItem(this.key, JSON.stringify(this.data));
    }

    getHighScore(difficulty, scope = "stage1") {
      return this.data.highScores?.[difficulty]?.[scope] || 0;
    }

    isStageCleared(stageId) {
      return Boolean(this.data.clearFlags?.[stageId]);
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

  class FullscreenManager {
    constructor(target = document.documentElement) {
      this.target = target;
      this.supported = Boolean(
        target?.requestFullscreen
        && document.exitFullscreen
        && "fullscreenElement" in document
      );
    }

    isActive() {
      return Boolean(document.fullscreenElement);
    }

    label() {
      return `FULLSCREEN ${this.isActive() ? "ON" : "OFF"}`;
    }

    async toggle() {
      if (!this.supported) return false;
      try {
        if (this.isActive()) await document.exitFullscreen();
        else await this.target.requestFullscreen();
        return true;
      } catch (error) {
        console.warn("Fullscreen toggle failed", error);
        return false;
      }
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
      if (game.continueFullPower) {
        game.power.reset();
        game.continueFullPower = false;
      } else {
        game.power.loseOnMiss();
      }
      game.syncFollowers();
      game.missedDuringCard = true;
      if (game.boss?.currentCard) game.boss.currentCard.failed = true;
      game.state.shake = 18;
      this.invincible = 130;
      game.cancelEnemyBullets(true);
      game.audio.playSE("player_hit", { cooldown: 120, maxVoices: 1 });
      game.audio.playSE("pichuun", { cooldown: 120, maxVoices: 1 });
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
  const hinokiSpriteSheet = new PollenSpriteSheet(HINOKI_ENEMY_ASSET);
  const ragweedSpriteSheet = new PollenSpriteSheet(STAGE3_ENEMY_ASSET);
  const POLLEN_ENEMY_CONFIG = {
    small: { radius: 12, hp: 5, speed: 2.15, fireInterval: 155, score: SCORE_VALUES.enemySmall },
    medium: { radius: 18, hp: 12, speed: 1.3, fireInterval: 132, score: SCORE_VALUES.enemyMedium },
    large: { radius: 29, hp: 34, speed: 0.78, fireInterval: 112, score: SCORE_VALUES.enemyLarge },
  };
  const HINOKI_ENEMY_CONFIG = {
    small: { radius: 13, hp: 7, speed: 2.25, fireInterval: 142, score: 140 },
    medium: { radius: 19, hp: 15, speed: 1.42, fireInterval: 118, score: 380 },
    large: { radius: 31, hp: 42, speed: 0.86, fireInterval: 98, score: 1250 },
  };
  const RAGWEED_ENEMY_CONFIG = {
    small: { radius: 14, hp: 9, speed: 2.55, fireInterval: 118, score: 180 },
    medium: { radius: 21, hp: 18, speed: 1.2, fireInterval: 104, score: 460 },
    large: { radius: 33, hp: 48, speed: 0.76, fireInterval: 88, score: 1450 },
  };

  const enemyConfigFor = (family) => {
    if (family === "hinoki") return HINOKI_ENEMY_CONFIG;
    if (family === "ragweed") return RAGWEED_ENEMY_CONFIG;
    return POLLEN_ENEMY_CONFIG;
  };

  const enemySpriteSheetFor = (family) => {
    if (family === "hinoki") return hinokiSpriteSheet;
    if (family === "ragweed") return ragweedSpriteSheet;
    return pollenSpriteSheet;
  };

  class Enemy {
    constructor(x, y, type = "medium", movement = "drift", family = "pollen") {
      const configSet = enemyConfigFor(family);
      const config = configSet[type] || configSet.medium;
      this.x = x;
      this.y = y;
      this.type = type;
      this.family = family;
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
      } else if (this.movement === "wing") {
        this.x = this.baseX + Math.sin(this.age * 0.038) * 96;
        this.y += this.speed * 0.92;
      } else if (this.movement === "rushLeft") {
        this.x -= this.speed * 1.18;
        this.y += this.speed * 0.58;
      } else if (this.movement === "rushRight") {
        this.x += this.speed * 1.18;
        this.y += this.speed * 0.58;
      } else if (this.movement === "hover") {
        this.x = this.baseX + Math.sin(this.age * 0.035) * 34;
        if (this.y < 170) this.y += this.speed * 0.92;
        else this.y += 0.16;
      } else if (this.movement === "spider") {
        this.x = this.baseX + Math.sin(this.age * 0.026) * 26;
        this.y += this.speed * 0.68;
      } else {
        this.y += this.speed;
      }

      this.fireCooldown -= 1;
      if (this.fireCooldown <= 0 && this.y > 28 && this.y < H - 120) this.fire(game);
    }

    fire(game) {
      const configSet = enemyConfigFor(this.family);
      const config = configSet[this.type];
      const playerHit = game.player.hitPoint;
      const aim = Math.atan2(playerHit.y - this.y, playerHit.x - this.x);
      if (this.family === "ragweed") {
        this.fireRagweed(game, config, aim);
        return;
      }
      const colors = this.family === "hinoki"
        ? { small: "#9ee06a", medium: "#71c86b", large: "#d5e36a" }
        : { small: "#f4c64e", medium: "#f0bd42", large: "#f2a93c" };
      if (this.type === "small") {
        const speed = game.difficulty.scaleSpeed(this.family === "hinoki" ? 1.86 : 1.72);
        game.spawnEnemyBullet(new Bullet(this.x, this.y, Math.cos(aim) * speed, Math.sin(aim) * speed, 5, "enemy", colors.small));
      } else if (this.type === "medium") {
        const count = game.difficulty.current === "easy" ? (this.family === "hinoki" ? 2 : 1) : 3;
        for (let i = 0; i < count; i += 1) {
          const offset = count === 1 ? 0 : (i - (count - 1) / 2) * 0.18;
          const speed = game.difficulty.scaleSpeed(this.family === "hinoki" ? 1.72 : 1.58);
          game.spawnEnemyBullet(new Bullet(this.x, this.y, Math.cos(aim + offset) * speed, Math.sin(aim + offset) * speed, 5, "enemy", colors.medium));
        }
      } else {
        const count = game.difficulty.scaleCount(this.family === "hinoki" ? 9 : 7);
        for (let i = 0; i < count; i += 1) {
          const offset = (i - (count - 1) / 2) * 0.15;
          const speed = game.difficulty.scaleSpeed((this.family === "hinoki" ? 1.52 : 1.42) + (i % 2) * 0.12);
          game.spawnEnemyBullet(new Bullet(this.x, this.y, Math.cos(aim + offset) * speed, Math.sin(aim + offset) * speed, 6, "enemy", colors.large));
        }
      }
      this.fireCooldown = game.difficulty.scaleFireInterval(config.fireInterval + Math.floor(Math.random() * 30));
    }

    fireRagweed(game, config, aim) {
      const colors = { small: "#d8e957", medium: "#c5dd5c", large: "#9ab54a" };
      if (this.type === "small") {
        const side = game.difficulty.current === "easy" ? 1 : 2;
        for (let i = -side; i <= side; i += 1) {
          const angle = aim + i * 0.11;
          const speed = game.difficulty.scaleSpeed(2.08 + (Math.abs(i) * 0.08));
          game.spawnEnemyBullet(new Bullet(this.x, this.y, Math.cos(angle) * speed, Math.sin(angle) * speed, 4, "enemy", colors.small, { shape: "needle" }));
        }
      } else if (this.type === "medium") {
        const count = game.difficulty.scaleCount(12);
        const gap = Math.floor(this.age / 60) % count;
        for (let i = 0; i < count; i += 1) {
          if (game.difficulty.current === "easy" && Math.abs(i - gap) <= 1) continue;
          const angle = (i / count) * TAU + this.age * 0.018;
          const speed = game.difficulty.scaleSpeed(1.24 + (i % 2) * 0.12);
          game.spawnEnemyBullet(new Bullet(this.x, this.y, Math.cos(angle) * speed, Math.sin(angle) * speed, 5, "enemy", colors.medium));
        }
      } else {
        const count = game.difficulty.scaleCount(11);
        for (let i = 0; i < count; i += 1) {
          const offset = (i - (count - 1) / 2) * 0.14;
          const speed = game.difficulty.scaleSpeed(1.72 + (i % 3) * 0.1);
          game.spawnEnemyBullet(new Bullet(this.x, this.y + 8, Math.cos(aim + offset) * speed, Math.sin(aim + offset) * speed, 5, "enemy", colors.large));
        }
      }
      this.fireCooldown = game.difficulty.scaleFireInterval(config.fireInterval + Math.floor(Math.random() * 22));
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      const bob = Math.sin(this.age * 0.09) * 2;
      ctx.translate(0, bob);
      const spriteSheet = enemySpriteSheetFor(this.family);
      if (spriteSheet.draw(ctx, this.type)) {
        ctx.restore();
        return;
      }
      ctx.fillStyle = this.family === "ragweed" ? "#a8ba42" : "#f3d74f";
      ctx.strokeStyle = this.family === "ragweed" ? "#e8f88c" : "#fff1a2";
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
    constructor({
      name,
      duration,
      durationTimes = null,
      hp,
      pattern,
      type = "spell",
      survival = false,
      lifeBars = 1,
      survivalTimeMultiplier = 1,
      survivalTimes = null,
      onStart = null,
      onUpdate = null,
      onEnd = null,
    }) {
      this.name = name;
      this.duration = duration;
      this.baseDuration = duration;
      this.durationTimes = durationTimes;
      this.hp = hp;
      this.maxHp = hp;
      this.lifeBars = Math.max(1, lifeBars);
      this.remainingLifeBars = this.lifeBars;
      this.pattern = pattern;
      this.type = type;
      this.survival = survival;
      this.survivalTimeMultiplier = survivalTimeMultiplier;
      this.survivalTimes = survivalTimes;
      this.survivalDuration = 0;
      this.survivalTimer = 0;
      this.frenzy = false;
      this.frenzyAnnounced = false;
      this.failed = false;
      this.lastCountdownSecond = null;
      this.resolved = false;
      this.onStart = onStart;
      this.onUpdate = onUpdate;
      this.onEnd = onEnd;
      this.age = 0;
    }

    start(boss, game) {
      this.age = 0;
      this.duration = this.durationTimes?.[game.difficulty.current] ?? this.baseDuration;
      this.hp = this.maxHp;
      this.remainingLifeBars = this.lifeBars;
      this.frenzy = false;
      this.frenzyAnnounced = false;
      this.failed = false;
      this.lastCountdownSecond = null;
      this.resolved = false;
      this.ragweedFrenzyCutin = false;
      const difficultySurvivalTime = this.survivalTimes?.[game.difficulty.current]
        ?? game.difficulty.config.survivalTime;
      this.survivalDuration = this.survival
        ? difficultySurvivalTime * this.survivalTimeMultiplier
        : 0;
      this.survivalTimer = this.survivalDuration;
      if (this.onStart) this.onStart(boss, game, this);
    }

    update(boss, game, deltaTime = FIXED_STEP_SECONDS) {
      this.age += 1;
      if (this.survival) this.survivalTimer = Math.max(0, this.survivalTimer - deltaTime);
      const hpRatio = this.maxHp > 0 ? this.hp / this.maxHp : 0;
      const isFinalLife = boss.cardIndex === boss.spellCards.length - 1;
      this.frenzy = (this.survival && this.survivalTimer <= 10)
        || (!this.survival && isFinalLife && hpRatio <= 0.4);
      if (this.frenzy && !this.frenzyAnnounced) {
        this.frenzyAnnounced = true;
        game.state.showMessage(this.survival ? "発狂モード - LAST 10 SEC" : "発狂モード - HP 40%以下", 150);
        game.state.shake = Math.max(game.state.shake, 10);
      }
      if (this.survival) {
        const seconds = Math.ceil(this.survivalTimer);
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

    cedarFinal(boss, game, card) {
      BOSS_PATTERNS.cedarBlockade(boss, game, card);
      if (card.age % game.difficulty.scaleFireInterval(card.frenzy ? 68 : 96) === 1) {
        const playerHit = game.player.hitPoint;
        const base = Math.atan2(playerHit.y - boss.y, playerHit.x - boss.x);
        const count = game.difficulty.current === "easy" ? 3 : 5;
        for (let i = 0; i < count; i += 1) {
          const offset = (i - (count - 1) / 2) * 0.15;
          const speed = game.difficulty.scaleSpeed(card.frenzy ? 1.95 : 1.62);
          game.spawnEnemyBullet(new Bullet(
            boss.x,
            boss.y + 16,
            Math.cos(base + offset) * speed,
            Math.sin(base + offset) * speed,
            5,
            "enemy",
            card.frenzy ? "#ffb15d" : "#f8df6a"
          ));
        }
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

    hinokiFan(boss, game, card) {
      if (card.age % game.difficulty.scaleFireInterval(54) !== 1) return;
      const playerHit = game.player.hitPoint;
      const base = Math.atan2(playerHit.y - boss.y, playerHit.x - boss.x);
      const count = game.difficulty.scaleCount(9);
      for (let i = 0; i < count; i += 1) {
        const offset = (i - (count - 1) / 2) * 0.13;
        const speed = game.difficulty.scaleSpeed(1.46 + (i % 3) * 0.13);
        game.spawnEnemyBullet(new Bullet(
          boss.x,
          boss.y + 18,
          Math.cos(base + offset) * speed,
          Math.sin(base + offset) * speed,
          5,
          "enemy",
          i % 2 ? "#8edb72" : "#d6e66e",
          { shape: i % 3 === 0 ? "needle" : "orb" }
        ));
      }
    },

    hinokiSurvival(boss, game, card) {
      BOSS_PATTERNS.hinokiFan(boss, game, card);
      if (card.age % game.difficulty.scaleFireInterval(86) !== 1) return;
      const count = game.difficulty.scaleCount(18);
      const gap = Math.floor(card.age / 86) % count;
      for (let i = 0; i < count; i += 1) {
        if (Math.abs(i - gap) <= 2) continue;
        const angle = (i / count) * TAU + card.age * 0.011;
        const speed = game.difficulty.scaleSpeed(0.98 + (i % 2) * 0.16);
        game.spawnEnemyBullet(new Bullet(
          boss.x,
          boss.y,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          5,
          "enemy",
          "#a8df6b"
        ));
      }
    },

    hinokiFinal(boss, game, card) {
      BOSS_PATTERNS.hinokiFan(boss, game, card);
      BOSS_PATTERNS.needleRain(boss, game, card);
      if (card.age % game.difficulty.scaleFireInterval(card.frenzy ? 58 : 92) !== 1) return;
      const count = game.difficulty.scaleCount(card.frenzy ? 24 : 16);
      for (let i = 0; i < count; i += 1) {
        const angle = (i / count) * TAU - card.age * (card.frenzy ? 0.026 : 0.016);
        const speed = game.difficulty.scaleSpeed(1.08 + (i % 3) * 0.14);
        game.spawnEnemyBullet(new Bullet(
          boss.x,
          boss.y,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          5,
          "enemy",
          card.frenzy ? "#e4ef65" : "#78d06a"
        ));
      }
    },

    ragweedPoisonBloom(boss, game, card) {
      if (card.age % game.difficulty.scaleFireInterval(62) === 1) {
        const count = game.difficulty.scaleCount(24);
        const gap = Math.floor(card.age / 62) % count;
        for (let i = 0; i < count; i += 1) {
          if (Math.abs(i - gap) <= 2) continue;
          const angle = (i / count) * TAU + card.age * 0.014;
          const speed = game.difficulty.scaleSpeed(0.96 + (i % 3) * 0.12);
          game.spawnEnemyBullet(new Bullet(boss.x, boss.y, Math.cos(angle) * speed, Math.sin(angle) * speed, 5, "enemy", i % 2 ? "#dce85a" : "#9ec64c"));
        }
      }
      if (card.age % game.difficulty.scaleFireInterval(88) === 1) {
        const drift = (Math.floor(card.age / 88) % 2 === 0 ? 1 : -1) * 0.45;
        for (let i = 0; i < 5; i += 1) {
          const x = 54 + i * 86;
          game.spawnEnemyBullet(new Bullet(x, -14, drift, game.difficulty.scaleSpeed(1.72 + (i % 2) * 0.12), 4, "enemy", "#c8dc54", { shape: "needle" }));
        }
      }
    },

    ragweedMistSurvival(boss, game, card) {
      BOSS_PATTERNS.ragweedPoisonBloom(boss, game, card);
      if (card.age % game.difficulty.scaleFireInterval(76) !== 1) return;
      const count = game.difficulty.scaleCount(card.frenzy ? 22 : 16);
      const gap = Math.floor(card.age / 76) % count;
      for (let i = 0; i < count; i += 1) {
        if (Math.abs(i - gap) <= 2) continue;
        const angle = (i / count) * TAU - card.age * 0.012;
        const speed = game.difficulty.scaleSpeed((card.frenzy ? 1.16 : 0.94) + (i % 2) * 0.16);
        game.spawnEnemyBullet(new Bullet(boss.x, boss.y + 6, Math.cos(angle) * speed, Math.sin(angle) * speed, 5, "enemy", "rgba(190, 214, 82, 0.76)"));
      }
    },

    ragweedWastelandFuneral(boss, game, card) {
      if (card.age % game.difficulty.scaleFireInterval(card.frenzy ? 38 : 54) === 1) {
        const count = game.difficulty.scaleCount(card.frenzy ? 20 : 14);
        for (let i = 0; i < count; i += 1) {
          const angle = (i / count) * TAU + card.age * (card.frenzy ? 0.036 : 0.022);
          const speed = game.difficulty.scaleSpeed((card.frenzy ? 1.32 : 1.06) + (i % 3) * 0.13);
          game.spawnEnemyBullet(new Bullet(boss.x, boss.y, Math.cos(angle) * speed, Math.sin(angle) * speed, 5, "enemy", card.frenzy ? "#eef05e" : "#b7cc4b"));
        }
      }
      if (card.age % game.difficulty.scaleFireInterval(card.frenzy ? 68 : 96) === 1) {
        const base = Math.atan2(game.player.hitPoint.y - boss.y, game.player.hitPoint.x - boss.x);
        const spread = game.difficulty.current === "easy" ? 2 : 3;
        for (let i = -spread; i <= spread; i += 1) {
          const angle = base + i * 0.18;
          const speed = game.difficulty.scaleSpeed(card.frenzy ? 2.15 : 1.82);
          game.spawnEnemyBullet(new Bullet(boss.x, boss.y + 18, Math.cos(angle) * speed, Math.sin(angle) * speed, 4, "enemy", "#d7e362", { shape: "needle" }));
        }
      }
      if (card.frenzy && !card.ragweedFrenzyCutin) {
        card.ragweedFrenzyCutin = true;
        game.startBossSpellCutin("大神威「荒野花粉葬」");
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
    { name: "神威「秋塵毒花」", pattern: "ragweedPoisonBloom", status: "stage3" },
    { name: "神威「雑草迷霧」", pattern: "ragweedMistSurvival", status: "stage3" },
    { name: "大神威「荒野花粉葬」", pattern: "ragweedWastelandFuneral", status: "stage3" },
  ];

  class Boss {
    constructor(definition = STAGE_DEFINITIONS.stage1.boss) {
      this.definition = definition;
      this.x = W / 2;
      this.y = -95;
      this.r = 42;
      this.age = 0;
      this.attackAge = 0;
      this.entered = false;
      this.dialogueStarted = false;
      this.defeated = false;
      this.transitioning = false;
      this.invincible = false;
      this.name = definition.name;
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
      this.image.onerror = () => {
        this.imageLoaded = false;
      };
      this.image.src = `${definition.asset}?v=${APP_VERSION}`;
    }

    update(game, deltaTime = FIXED_STEP_SECONDS) {
      this.age += 1;

      if (!this.entered) {
        this.y += 1.6;
        if (this.y >= 118) {
          this.entered = true;
          this.dialogueStarted = true;
          this.attackAge = 0;
          game.startDialogue(game.currentStage.bossScene, () => {
            game.state.bossNameTimer = 170;
            game.state.showMessage("戦闘開始", 90);
            game.audio.playBoss(game.currentStage.bossBgm);
            if (game.currentStageId === "stage2") game.startBossSpellCutin("ヒノキ将軍・檜風開陣");
            if (game.currentStageId === "stage3") game.startBossSpellCutin("ロード・ラグウィード・秋塵毒花");
            this.beginCurrentCard(game);
          });
        }
        return;
      }

      this.x = W / 2 + Math.sin(this.age * 0.018) * 78;
      if (!this.currentCard || this.defeated || this.transitioning) return;
      this.attackAge = this.currentCard.age;
      this.currentCard.update(this, game, deltaTime);
      this.hp = this.currentCard.hp;
      this.maxHp = this.currentCard.maxHp;
      if (this.currentCard.survival && this.currentCard.survivalTimer <= 0) {
        this.nextCard(game, "survival-timeout");
      } else if (!this.currentCard.survival && this.currentCard.hp <= 0) {
        this.nextCard(game, "hp-break");
      } else if (!this.currentCard.survival && this.currentCard.age >= this.currentCard.duration) {
        this.handlePhaseTimeout(game);
      }
    }

    createSpellCards() {
      return this.definition.spellCards.map((card) => new SpellCard(card));
    }

    beginCurrentCard(game) {
      this.currentCard = this.spellCards[this.cardIndex];
      if (!this.currentCard) return;
      this.currentCard.maxHp = Math.max(1, Math.round(this.currentCard.maxHp * game.difficulty.config.bossHpMultiplier));
      this.currentCard.start(this, game);
      this.invincible = this.currentCard.survival;
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
      if (clearedCard.resolved) return;
      clearedCard.resolved = true;
      const hpBreak = reason === "hp-break";
      const survivalEnd = reason === "survival-timeout";
      const phaseTimeout = reason === "phase-timeout";
      const survivalSuccess = survivalEnd && !clearedCard.failed;

      if (survivalEnd) game.audio.playSE("time_up", { maxVoices: 1 });

      if (hpBreak) {
        addScore(game, clearedCard.isSpell ? SCORE_VALUES.spellBreak : SCORE_VALUES.normalBreak);
        if (!game.missedDuringCard) {
          addScore(game, SCORE_VALUES.noMissBreak);
          game.state.showMessage(clearedCard.isSpell ? "神威突破！ BONUS!" : "BONUS!", 100);
          game.spawnBossPhaseBonus(this.x, this.y);
        } else {
          game.state.showMessage(clearedCard.isSpell ? "神威突破　NO BONUS" : "BREAK　NO BONUS", 90);
        }
      } else if (survivalSuccess) {
        addScore(game, SCORE_VALUES.spellBreak + SCORE_VALUES.noMissBreak);
        game.state.showMessage("SUCCESS　神威突破！", 120);
        game.audio.playSE("spell_success", { maxVoices: 1 });
        game.spawnBossPhaseBonus(this.x, this.y);
      } else if (survivalEnd) {
        game.state.showMessage("FAILED　NO BONUS", 65);
        game.audio.playSE("spell_failed", { maxVoices: 1 });
      } else if (phaseTimeout) {
        clearedCard.failed = true;
        game.state.showMessage("FAILED - TIME OVER / NO BONUS", 90);
        game.audio.playSE("time_up", { maxVoices: 1 });
        game.audio.playSE("spell_failed", { maxVoices: 1 });
      }

      game.missedDuringCard = false;
      clearedCard.end(this, game);
      this.invincible = false;
      this.cardIndex += 1;
      if (this.cardIndex >= this.spellCards.length) {
        this.enemyClearOnCardChange(game);
        this.transitioning = true;
        game.pendingBossDefeat = hpBreak || survivalSuccess ? 185 : 70;
        return;
      }
      this.enemyClearOnCardChange(game);
      this.transitioning = true;
      game.pendingBossCardStart = 75;
    }

    takeDamage(game, amount) {
      if (!this.currentCard || this.defeated || this.transitioning || this.invincible || !this.entered) return false;
      if (this.currentCard.survival || this.currentCard.resolved) return false;
      const appliedDamage = amount * BOSS_DAMAGE_MULTIPLIER;
      this.currentCard.hp = Math.max(0, this.currentCard.hp - appliedDamage);
      this.hp = this.currentCard.hp;
      addScore(game, appliedDamage * SCORE_VALUES.bossDamage);
      if (this.currentCard.hp <= 0) {
        if (this.currentCard.remainingLifeBars > 1) {
          this.breakCurrentLifeBar(game);
        } else {
          this.nextCard(game, "hp-break");
        }
      }
      return true;
    }

    breakCurrentLifeBar(game) {
      const card = this.currentCard;
      card.remainingLifeBars -= 1;
      card.hp = card.maxHp;
      this.hp = card.hp;
      this.maxHp = card.maxHp;
      this.enemyClearOnCardChange(game);
      game.state.showMessage(game.missedDuringCard ? "ゲージ破壊　NO BONUS" : "ゲージ破壊！ BONUS!", 90);
      if (!game.missedDuringCard) game.spawnBossPhaseBonus(this.x, this.y, 18);
      game.missedDuringCard = false;
      game.state.shake = Math.max(game.state.shake, 8);
    }

    handlePhaseTimeout(game) {
      if (!this.currentCard || this.currentCard.resolved) return;
      const card = this.currentCard;
      card.failed = true;
      game.missedDuringCard = true;
      game.audio.playSE("time_up", { maxVoices: 1 });
      game.audio.playSE("spell_failed", { maxVoices: 1 });
      if (card.remainingLifeBars > 1) {
        card.remainingLifeBars -= 1;
        card.hp = card.maxHp;
        card.age = 0;
        this.hp = card.hp;
        this.maxHp = card.maxHp;
        this.enemyClearOnCardChange(game);
        game.state.showMessage("FAILED - TIME OVER / NEXT GAUGE", 120);
        game.missedDuringCard = false;
        game.state.shake = Math.max(game.state.shake, 8);
        return;
      }
      this.nextCard(game, "phase-timeout");
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

      if (this.definition.asset === HINOKI_BOSS_ASSET || this.definition.asset === LORD_RAGWEED_ASSET) {
        this.drawBossPlaceholder(ctx);
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

    drawBossPlaceholder(ctx) {
      ctx.save();
      ctx.fillStyle = "rgba(15, 46, 29, 0.86)";
      ctx.strokeStyle = "rgba(221, 255, 205, 0.92)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(-46, -72, 92, 144, 12);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#f4ffe8";
      ctx.font = "900 15px system-ui, sans-serif";
      ctx.textAlign = "center";
      if (this.definition.asset === LORD_RAGWEED_ASSET) {
        ctx.fillText("ロード", 0, -20);
        ctx.fillText("ラグ", 0, 4);
        ctx.fillText("ウィード", 0, 28);
      } else {
        ctx.fillText("ヒノキ", 0, -10);
        ctx.fillText("将軍", 0, 14);
      }
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
      const crop = this.definition.imageCrop;
      if (crop) {
        ctx.drawImage(this.image, crop.sx, crop.sy, crop.sw, crop.sh, -48, -72, 96, 144);
      } else {
        ctx.drawImage(this.image, 0, 0, this.image.width, this.image.height, -48, -72, 96, 144);
      }
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
      this.auto = false;
      this.autoWait = 0;
      this.logOpen = false;
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
      this.autoWait = 0;
      this.logOpen = false;
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
      if (this.auto && line && this.charCount >= line.text.length) {
        this.autoWait += 1;
        if (this.autoWait >= 95) this.advance();
      } else {
        this.autoWait = 0;
      }
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
      this.autoWait = 0;
    }

    skip() {
      if (!this.active || this.closing) return;
      this.finish();
    }

    toggleAuto() {
      this.auto = !this.auto;
      this.autoWait = 0;
    }

    toggleLog() {
      if (!this.active || this.closing) return;
      this.logOpen = !this.logOpen;
    }

    handleControlTap(x, y) {
      if (!this.active || this.closing) return false;
      const controls = this.controlRects();
      for (const control of controls) {
        if (x < control.x || x > control.x + control.w || y < control.y || y > control.y + control.h) continue;
        if (control.action === "auto") this.toggleAuto();
        if (control.action === "log") this.toggleLog();
        if (control.action === "skip") this.skip();
        return true;
      }
      if (this.logOpen) {
        this.logOpen = false;
        return true;
      }
      return false;
    }

    controlRects() {
      const y = H - H * 0.4 + 18;
      return [
        { action: "auto", label: this.auto ? "AUTO ON" : "AUTO", x: W - 222, y, w: 64, h: 30 },
        { action: "log", label: "LOG", x: W - 150, y, w: 52, h: 30 },
        { action: "skip", label: "SKIP", x: W - 90, y, w: 62, h: 30 },
      ];
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
      if (this.logOpen) this.drawLog(ctx);
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
      if (!portraitLine) return;
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
      this.drawControls(ctx);
    }

    drawControls(ctx) {
      this.controlRects().forEach((control) => {
        ctx.fillStyle = control.action === "auto" && this.auto ? "rgba(255, 240, 168, 0.28)" : "rgba(255,255,255,0.10)";
        ctx.strokeStyle = "rgba(255,255,255,0.34)";
        ctx.lineWidth = 1;
        ctx.fillRect(control.x, control.y, control.w, control.h);
        ctx.strokeRect(control.x, control.y, control.w, control.h);
        ctx.fillStyle = "#f7fff0";
        ctx.font = "800 11px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(control.label, control.x + control.w / 2, control.y + 20);
      });
    }

    drawLog(ctx) {
      const x = 28;
      const y = 94;
      const w = W - 56;
      const h = H * 0.46;
      ctx.fillStyle = "rgba(0,0,0,0.88)";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = "rgba(255,255,255,0.34)";
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = "#fff4b8";
      ctx.font = "800 15px system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("DIALOGUE LOG", x + 16, y + 28);
      ctx.fillStyle = "#f7fff0";
      ctx.font = "14px system-ui, sans-serif";
      const start = Math.max(0, this.index - 5);
      let rowY = y + 56;
      for (let i = start; i <= this.index; i += 1) {
        const line = this.lines[i];
        if (!line) continue;
        const speaker = this.resolveSpeaker(line.speaker);
        const text = speaker ? `${speaker}：${line.text}` : line.text;
        this.drawWrappedText(ctx, text, x + 16, rowY, w - 32, 20, 2);
        rowY += 42;
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
      this.setSource(src);
    }

    setSource(src) {
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

    playStage(name = "stage1") {
      this.playBGM(name, true);
    }

    playBoss(name = "boss1") {
      this.playBGM(name, true);
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
      this.currentStageId = "stage1";
      this.state = new GameState();
      this.difficulty = new DifficultyManager();
      this.score = new ScoreManager(this);
      this.life = new LifeManager(this);
      this.power = new PowerManager();
      this.checkpoints = new CheckpointManager();
      this.save = new SaveManager();
      this.difficulty.set(this.save.data.settings?.lastDifficulty || "normal");
      this.background = new BackgroundManager(this.currentStage.background);
      this.audio = new AudioManager();
      this.fullscreen = new FullscreenManager(document.documentElement);
      this.bossImageCache = new Map();
      Object.values(STAGE_DEFINITIONS).forEach((stage) => this.preloadBossImage(stage.boss.asset));
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
      this.titleMenu = new MenuManager();
      this.stageSelectMenu = new MenuManager([
        { label: "STAGE 1　春の花粉参道", action: "stage1" },
        { label: "STAGE 2　檜風街道", action: "stage2" },
        { label: "STAGE 3　秋花粉の廃道", action: "stage3" },
        { label: "STAGE 4　COMING SOON", action: "stage4", disabled: true },
      ]);
      this.optionsMenu = new MenuManager([
        { label: "BGM VOLUME", action: "bgm" },
        { label: "SE VOLUME", action: "se" },
        { label: "MASTER MUTE", action: "mute" },
        { label: "BACK", action: "back" },
      ]);
      this.pauseMenu = new MenuManager();
      this.gameOverMenu = new MenuManager();
      this.pauseOptionsOpen = false;
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
      this.pendingBossCardStart = 0;
      this.continueFullPower = false;
      this.currentMode = "stageSelect";
      this.clearAdvanceTimer = 0;
      this.stageStartScore = 0;
      this.spawnedWaves = new Set();
      this.currentWave = 0;
      this.debugVisible = false;
      this.enemyBulletsSpawnedFrame = 0;
      this.enemyBulletSpawnHistory = [];
      this.spellKeyHeld = false;
      this.spellPointerHeld = false;
      this.titlePanel = "main";
      this.refreshTitleMenu();
      this.dialogue = new DialogueManager(DIALOGUE_SCENES, PORTRAIT_BASE, DIALOGUE_CONTEXT);
      this.lastTime = 0;
      this.updateAccumulator = 0;
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

    get currentStage() {
      return STAGE_DEFINITIONS[this.currentStageId] || STAGE_DEFINITIONS.stage1;
    }

    preloadBossImage(src) {
      if (!src || this.bossImageCache.has(src)) return;
      const image = new Image();
      image.src = `${src}?v=${APP_VERSION}`;
      this.bossImageCache.set(src, image);
    }

    configureStage(stageId) {
      this.currentStageId = STAGE_DEFINITIONS[stageId] ? stageId : "stage1";
      this.state.stageName = this.currentStage.title;
      DIALOGUE_CONTEXT.bossName = this.currentStage.boss.name;
      this.background.setSource(this.currentStage.background);
      this.preloadBossImage(this.currentStage.boss.asset);
      this.suginomikotoCutinLoaded = false;
      this.suginomikotoCutin.src = `${this.currentStage.boss.cutin}?v=${APP_VERSION}`;
    }

    captureRunState() {
      return {
        score: this.score.value,
        extendIndex: this.score.extendIndex,
        lives: this.life.lives,
        spellCount: this.playerSpellCount,
        power: this.power.value,
        grazeCount: this.grazeCount,
        grazeMilestoneIndex: this.grazeMilestoneIndex,
        continuesLeft: this.continuesLeft,
        continueCount: this.continueCount,
        difficulty: this.difficulty.current,
      };
    }

    getNextStageId() {
      const index = STAGE_ORDER.indexOf(this.currentStageId);
      if (index < 0) return null;
      const nextId = STAGE_ORDER[index + 1];
      return nextId && STAGE_DEFINITIONS[nextId] ? nextId : null;
    }

    beginArcade() {
      this.currentMode = "arcade";
      this.start(false, false, "stage1");
    }

    beginStageSelect(stageId) {
      this.currentMode = "stageSelect";
      this.start(false, false, stageId);
    }

    start(fromCheckpoint = false, keepScore = false, stageId = this.currentStageId, arcadeCarry = null) {
      this.configureStage(stageId);
      const startTime = fromCheckpoint ? this.checkpoints.currentPoint.time : 0;
      const preservedSpellCount = this.playerSpellCount;
      const preservedPower = this.power.value;
      const preservedStageStartScore = this.stageStartScore;
      const carried = arcadeCarry || null;
      this.state.resetRun(startTime);
      if (carried) {
        this.score.value = carried.score;
        this.score.extendIndex = carried.extendIndex;
        this.checkpoints.reset();
        this.continuesLeft = carried.continuesLeft;
        this.continueCount = carried.continueCount;
        this.difficulty.set(carried.difficulty);
      } else if (!keepScore) {
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
      this.playerSpellCount = carried ? carried.spellCount : keepScore ? preservedSpellCount : 3;
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
      this.grazeCount = carried ? carried.grazeCount : keepScore ? this.grazeCount : 0;
      this.grazeMilestoneIndex = carried ? carried.grazeMilestoneIndex : keepScore ? this.grazeMilestoneIndex : 0;
      this.grazeFlash = 0;
      this.missedDuringCard = false;
      this.pendingBossDefeat = 0;
      this.pendingBossCardStart = 0;
      this.clearAdvanceTimer = 0;
      this.continueFullPower = false;
      this.spawnedWaves = new Set(
        this.currentStage.waves
          .map((wave, index) => ({ wave, index }))
          .filter(({ wave }) => wave.time <= startTime)
          .map(({ index }) => index)
      );
      this.currentWave = this.spawnedWaves.size;
      this.enemyBulletsSpawnedFrame = 0;
      this.enemyBulletSpawnHistory = [];
      this.spellKeyHeld = false;
      this.spellPointerHeld = false;
      this.input.touchActive = false;
      this.input.mouseActive = false;
      this.input.fire = false;
      if (carried) this.power.value = carried.power;
      else if (keepScore) this.power.value = preservedPower;
      else this.power.reset();
      this.syncFollowers();
      this.life.reset();
      if (carried) {
        this.life.lives = Math.max(1, carried.lives);
      } else if (keepScore && fromCheckpoint) {
        this.life.lives = Math.max(1, this.life.lives);
      }
      this.stageStartScore = carried
        ? this.score.value
        : keepScore
          ? preservedStageStartScore
          : this.score.value;
      this.state.showMessage(
        fromCheckpoint ? `${this.checkpoints.currentPoint.name} から再開` : `${this.currentStage.title} 開始`,
        120
      );
      this.audio.playStage(this.currentStage.bgm);
      if (!fromCheckpoint) this.startDialogue(this.currentStage.introScene);
    }

    advanceArcadeStage() {
      const nextStageId = this.getNextStageId();
      if (!nextStageId) {
        this.returnToTitle();
        return;
      }
      const carried = this.captureRunState();
      this.start(false, true, nextStageId, carried);
    }

    returnToTitle() {
      this.state.mode = "title";
      this.titlePanel = "main";
      this.pauseOptionsOpen = false;
      this.refreshTitleMenu();
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
      this.state.shake = 0;
      this.state.message = "";
      this.state.messageTimer = 0;
      this.state.bossNameTimer = 0;
      this.particles = [];
      this.powerUpFlash = 0;
      this.grazeFlash = 0;
      this.clearAdvanceTimer = 0;
      document.body.classList.remove("dialogue-active");
      this.audio.stopStage();
    }

    leaveClearScreen() {
      if (this.currentMode === "arcade" && this.getNextStageId()) {
        this.advanceArcadeStage();
        return;
      }
      const returnToStageSelect = this.currentMode === "stageSelect";
      this.returnToTitle();
      if (returnToStageSelect) {
        this.titlePanel = "stage";
        this.stageSelectMenu.index = Math.max(0, STAGE_ORDER.indexOf(this.currentStageId));
        this.ensureTitleBGM();
      }
    }

    startDialogue(sceneName, onComplete = null) {
      this.input.fire = false;
      this.input.touchActive = false;
      this.input.mouseActive = false;
      this.dialogue.start(sceneName, onComplete);
    }

    bindInput() {
      window.addEventListener("keydown", (e) => {
        if (isBrandSplashActive()) return;
        this.audio.unlock();
        if (this.state.mode === "title") this.ensureTitleBGM();
        if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " ", "Shift", "x", "X", "f", "F", "Escape", "Enter"].includes(e.key)) e.preventDefault();
        if ((e.key === "f" || e.key === "F") && !e.repeat) {
          this.toggleFullscreen();
          return;
        }
        if (e.key === "F3") {
          if (!e.repeat) this.debugVisible = !this.debugVisible;
          return;
        }
        if (this.dialogue.active) {
          if (e.key === "Enter") this.dialogue.skip();
          if (e.key === "a" || e.key === "A") this.dialogue.toggleAuto();
          if (e.key === "l" || e.key === "L") this.dialogue.toggleLog();
          if (e.key === "z" || e.key === "Z" || e.key === " ") this.dialogue.advance();
          return;
        }
        if (this.state.mode === "clear") {
          if (!e.repeat && (e.key === "z" || e.key === "Z" || e.key === " " || e.key === "Enter" || e.key === "Escape")) {
            this.leaveClearScreen();
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
        if (isBrandSplashActive()) return;
        if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") this.input.left = false;
        if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") this.input.right = false;
        if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") this.input.up = false;
        if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") this.input.down = false;
        if (e.key === "Shift") this.input.slow = false;
        if (e.key === "z" || e.key === "Z" || e.key === " ") this.input.fire = false;
        if (e.key === "x" || e.key === "X") this.spellKeyHeld = false;
      });

      canvas.addEventListener("pointerdown", (e) => {
        if (isBrandSplashActive()) return;
        this.audio.unlock();
        if (this.state.mode === "title") this.ensureTitleBGM();
        if (e.button === 2) {
          e.preventDefault();
          if (!this.dialogue.active) this.activatePlayerSpell();
          return;
        }
        if (this.handleCanvasTap(e)) return;
        if (this.dialogue.active) {
          const pos = this.canvasPoint(e);
          if (this.dialogue.handleControlTap(pos.x, pos.y)) return;
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
        if (isBrandSplashActive()) return;
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
        if (isBrandSplashActive()) return;
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
        if (isBrandSplashActive()) return;
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
      if (this.titlePanel === "stage") {
        if (key === "ArrowUp" || key === "w" || key === "W") this.moveMenu(this.stageSelectMenu, -1);
        if (key === "ArrowDown" || key === "s" || key === "S") this.moveMenu(this.stageSelectMenu, 1);
        if (key === "z" || key === "Z" || key === " " || key === "Enter") this.activateStageSelectItem();
        if (key === "Escape") {
          this.audio.playSE("menu_cancel");
          this.titlePanel = "main";
        }
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
      const selected = this.titleMenu.selected();
      if (!selected || selected.disabled) return;
      const label = selected.label;
      this.audio.playSE("menu_decide");
      if (label === "START GAME") this.beginArcade();
      if (label === "STAGE SELECT" && this.save.isStageCleared("stage1")) {
        this.titlePanel = "stage";
        this.stageSelectMenu.index = 0;
      }
      if (label === "OPTIONS") this.openOptions();
      if (selected.action === "fullscreen") this.toggleFullscreen();
      if (label === "HOW TO PLAY") this.titlePanel = this.titlePanel === "how" ? "main" : "how";
      if (label === "HIGH SCORE") this.titlePanel = this.titlePanel === "score" ? "main" : "score";
    }

    ensureTitleBGM() {
      if (this.state.mode !== "title") return;
      if (this.audio.currentBGMName !== "stage1") {
        this.audio.playBGM("stage1", true);
        return;
      }
      if (this.audio.currentBGM?.paused) this.audio.resumeBGM();
    }

    refreshTitleMenu() {
      this.titleMenu.setItems([
        { label: "START GAME" },
        { label: "STAGE SELECT", disabled: !this.save.isStageCleared("stage1") },
        { label: "OPTIONS" },
        { label: "FULLSCREEN", action: "fullscreen", disabled: !this.fullscreen?.supported },
        { label: "HOW TO PLAY" },
        { label: "HIGH SCORE" },
      ]);
      this.stageSelectMenu.setItems([
        { label: STAGE_DEFINITIONS.stage1.selectLabel, action: "stage1" },
        {
          label: STAGE_DEFINITIONS.stage2.selectLabel,
          action: "stage2",
          disabled: !this.save.isStageCleared("stage1"),
        },
        {
          label: this.save.isStageCleared("stage2") ? STAGE_DEFINITIONS.stage3.selectLabel : "STAGE 3　未解放",
          action: "stage3",
          disabled: !this.save.isStageCleared("stage2"),
        },
        {
          label: this.save.isStageCleared("stage3") ? "STAGE 4　COMING SOON" : "STAGE 4　未解放",
          action: "stage4",
          disabled: true,
        },
      ]);
    }

    activateStageSelectItem() {
      const item = this.stageSelectMenu.selected();
      if (!item || item.disabled) return;
      this.audio.playSE("menu_decide");
      if (STAGE_DEFINITIONS[item.action]) this.beginStageSelect(item.action);
    }

    moveMenu(menu, delta) {
      menu.move(delta);
      this.audio.playSE("menu_move");
    }

    toggleFullscreen() {
      if (!this.fullscreen?.supported) return;
      this.fullscreen.toggle();
    }

    openOptions() {
      this.titlePanel = "options";
      this.optionsMenu.index = 0;
    }

    closeOptions() {
      this.audio.playSE("menu_cancel");
      if (this.state.mode === "paused" && this.pauseOptionsOpen) {
        this.pauseOptionsOpen = false;
        return;
      }
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
      this.pauseOptionsOpen = false;
      this.audio.pauseAll();
      this.pauseMenu.setItems([
        { label: "RESUME", action: "resume" },
        { label: "RETRY", action: "restart", confirm: "ステージを最初からやり直しますか？" },
        { label: "TITLE", action: "title", confirm: "タイトルへ戻りますか？" },
        { label: "OPTIONS", action: "options" },
        { label: "FULLSCREEN", action: "fullscreen", disabled: !this.fullscreen?.supported },
      ]);
    }

    resumeFromPause() {
      if (this.state.mode === "paused") {
        this.state.mode = "stage";
        this.audio.resumeAll();
      }
    }

    handlePauseKey(key) {
      if (this.pauseOptionsOpen) {
        if (key === "ArrowUp" || key === "w" || key === "W") this.moveMenu(this.optionsMenu, -1);
        if (key === "ArrowDown" || key === "s" || key === "S") this.moveMenu(this.optionsMenu, 1);
        if (key === "ArrowLeft" || key === "a" || key === "A") this.adjustOption(-1);
        if (key === "ArrowRight" || key === "d" || key === "D") this.adjustOption(1);
        if (key === "z" || key === "Z" || key === " " || key === "Enter") {
          if (this.optionsMenu.selected()?.action === "back") this.pauseOptionsOpen = false;
          else this.activateOptionItem();
        }
        if (key === "Escape" || key === "p" || key === "P") this.pauseOptionsOpen = false;
        return;
      }
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
      if (action === "restart") {
        this.saveCurrentRun(false);
        this.start(false, false, this.currentStageId);
      }
      if (action === "title") {
        this.saveCurrentRun(false);
        this.returnToTitle();
      }
      if (action === "options") {
        this.pauseOptionsOpen = true;
        this.optionsMenu.index = 0;
      }
      if (action === "fullscreen") this.toggleFullscreen();
    }

    openGameOverMenu() {
      this.state.mode = "gameover";
      this.audio.pauseAll();
      this.saveCurrentRun(false);
      this.gameOverMenu.setItems([
        { label: "CONTINUE", action: "continue", disabled: this.continuesLeft <= 0 },
        { label: "RETRY", action: "retry", confirm: "ステージを最初からやり直しますか？" },
        { label: "RETRY FROM CHECKPOINT", action: "checkpoint", confirm: "最後のチェックポイントから再開しますか？" },
        { label: "TITLE", action: "title", confirm: "タイトルへ戻りますか？" },
      ]);
    }

    handleGameOverKey(key) {
      if (key === "Escape" && this.gameOverMenu.confirm) {
        this.audio.playSE("menu_cancel");
        this.gameOverMenu.confirm = null;
        return;
      }
      if (key === "ArrowUp" || key === "w" || key === "W") this.moveMenu(this.gameOverMenu, -1);
      if (key === "ArrowDown" || key === "s" || key === "S") this.moveMenu(this.gameOverMenu, 1);
      if (
        this.gameOverMenu.confirm
        && (key === "ArrowLeft" || key === "ArrowRight" || key === "a" || key === "d" || key === "A" || key === "D")
      ) {
        this.moveMenu(this.gameOverMenu, 1);
      }
      if (key === "Escape") {
        this.audio.playSE("menu_cancel");
        this.returnToTitle();
      }
      if (key === "z" || key === "Z" || key === " " || key === "Enter") this.activateGameOverItem();
    }

    activateGameOverItem() {
      this.audio.playSE("menu_decide");
      if (this.gameOverMenu.confirm) {
        if (this.gameOverMenu.confirm.choice === 0) this.executeGameOverAction(this.gameOverMenu.confirm.action);
        else this.gameOverMenu.confirm = null;
        return;
      }
      const item = this.gameOverMenu.selected();
      if (!item || item.disabled) return;
      if (item.confirm) {
        this.gameOverMenu.confirm = { text: item.confirm, action: item.action, choice: 1 };
        return;
      }
      this.executeGameOverAction(item.action);
    }

    executeGameOverAction(action) {
      this.gameOverMenu.confirm = null;
      if (action === "continue") this.continueFromCheckpoint();
      if (action === "retry") this.start(false, false, this.currentStageId);
      if (action === "checkpoint") this.start(true, true, this.currentStageId);
      if (action === "title") this.returnToTitle();
    }

    continueFromCheckpoint() {
      if (this.continuesLeft <= 0) return;
      this.continuesLeft -= 1;
      this.continueCount += 1;
      this.score.reduceForContinue();
      if (!this.resumeInPlaceAfterContinue()) {
        this.start(true, true);
      }
      this.grazeCount = 0;
      this.grazeMilestoneIndex = 0;
      this.grazeFlash = 0;
      this.power.value = this.power.max;
      this.continueFullPower = true;
      this.syncFollowers();
      this.powerUpFlash = 38;
      this.player.invincible = Math.max(this.player.invincible, 180);
      this.state.showMessage("CONTINUE - POWER MAX！", 150);
      this.spawnBurst(this.player.x, this.player.y, "#ffe477", 42);
      this.audio.playSE("power_max", { maxVoices: 1 });
    }

    resumeInPlaceAfterContinue() {
      if (this.state.mode !== "gameover") return false;
      this.state.mode = "stage";
      this.dialogue.active = false;
      this.life.reset();
      this.life.lives = Math.max(1, this.life.lives);
      this.player.reset();
      this.player.invincible = 180;
      this.playerBullets = [];
      this.enemyBullets = [];
      this.lasers = [];
      this.powerItems = [];
      this.pointItems = [];
      this.particles = [];
      this.endPlayerSpell();
      this.playerSpellCooldown = 90;
      this.pendingBossDefeat = 0;
      this.clearAdvanceTimer = 0;
      this.state.shake = 0;
      this.state.message = "";
      this.state.messageTimer = 0;
      this.input.touchActive = false;
      this.input.mouseActive = false;
      this.input.fire = false;
      this.audio.resumeAll();
      if (this.audio.currentBGM?.paused) this.audio.resumeBGM();
      return true;
    }

    handleCanvasTap(e) {
      if (this.state.mode === "clear") {
        if (this.dialogue.active) return false;
        this.leaveClearScreen();
        return true;
      }
      if (this.state.mode !== "title" && this.state.mode !== "paused" && this.state.mode !== "gameover") return false;
      const pos = this.canvasPoint(e);
      if (this.state.mode === "title" && this.titlePanel === "main" && pos.y >= 626 && pos.y <= 664) {
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
        } else if (this.titlePanel === "stage") {
          this.stageSelectMenu.index = hit;
          this.activateStageSelectItem();
        } else {
          this.titleMenu.index = hit;
          this.activateTitleItem();
        }
      } else if (this.state.mode === "paused") {
        if (this.pauseOptionsOpen) {
          this.optionsMenu.index = hit;
          const action = this.optionsMenu.selected()?.action;
          if (action === "bgm" || action === "se") this.adjustOption(pos.x < W / 2 ? -1 : 1);
          else this.activateOptionItem();
        } else if (this.pauseMenu.confirm) {
          this.pauseMenu.confirm.choice = hit;
          this.activatePauseItem();
        } else {
          this.pauseMenu.index = hit;
          this.activatePauseItem();
        }
      } else if (this.state.mode === "gameover") {
        if (this.gameOverMenu.confirm) {
          this.gameOverMenu.confirm.choice = hit;
          this.activateGameOverItem();
        } else {
          this.gameOverMenu.index = hit;
          this.activateGameOverItem();
        }
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
      const startY = this.state.mode === "title"
        ? (this.titlePanel === "options" ? 365 : this.titlePanel === "stage" ? 380 : 332)
        : (this.pauseOptionsOpen ? 365 : 345);
      for (let i = 0; i < menu.items.length; i += 1) {
        const top = startY + i * 48;
        if (y >= top && y <= top + 38) return i;
      }
      return null;
    }

    getActiveMenu() {
      if (this.state.mode === "title") {
        if (this.titlePanel === "options") return this.optionsMenu;
        if (this.titlePanel === "stage") return this.stageSelectMenu;
        return this.titleMenu;
      }
      if (this.state.mode === "paused") return this.pauseOptionsOpen ? this.optionsMenu : this.pauseMenu;
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
      if (isBrandSplashActive()) {
        this.resetGamepadInput();
        return;
      }
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
        if (justPressed(2)) this.dialogue.toggleLog();
        if (justPressed(3)) this.dialogue.toggleAuto();
        this.gamepad.prevButtons = buttons;
        return;
      }

      if (this.state.mode === "title") {
        const titleMenu = this.titlePanel === "options"
          ? this.optionsMenu
          : this.titlePanel === "stage"
            ? this.stageSelectMenu
            : this.titleMenu;
        this.handleGamepadMenu(buttons, justPressed, axisX, axisY, titleMenu);
        if (justPressed(0)) {
          if (this.titlePanel === "options") this.activateOptionItem();
          else if (this.titlePanel === "stage") this.activateStageSelectItem();
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
        const pauseActiveMenu = this.pauseOptionsOpen ? this.optionsMenu : this.pauseMenu;
        this.handleGamepadMenu(buttons, justPressed, axisX, axisY, pauseActiveMenu);
        if (justPressed(0)) {
          if (this.pauseOptionsOpen) this.activateOptionItem();
          else this.activatePauseItem();
        }
        if (justPressed(1) || justPressed(8) || justPressed(9)) {
          if (this.pauseOptionsOpen) this.pauseOptionsOpen = false;
          else if (this.pauseMenu.confirm) this.pauseMenu.confirm = null;
          else this.resumeFromPause();
        }
      } else if (this.state.mode === "gameover") {
        this.handleGamepadMenu(buttons, justPressed, axisX, axisY, this.gameOverMenu);
        if (justPressed(0)) this.activateGameOverItem();
        if (justPressed(1)) {
          if (this.gameOverMenu.confirm) this.gameOverMenu.confirm = null;
          else this.returnToTitle();
        }
      } else if (this.state.mode === "clear") {
        if (justPressed(0) || justPressed(1)) this.leaveClearScreen();
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
      if (!this.lastTime) this.lastTime = time;
      const elapsedSeconds = Math.min(0.1, Math.max(0, (time - this.lastTime) / 1000));
      this.lastTime = time;
      this.updateAccumulator += elapsedSeconds;
      let steps = 0;
      while (this.updateAccumulator >= FIXED_STEP_SECONDS && steps < 6) {
        this.update(FIXED_STEP_SECONDS);
        this.updateAccumulator -= FIXED_STEP_SECONDS;
        steps += 1;
      }
      if (steps === 6) this.updateAccumulator = 0;
      this.draw();
      requestAnimationFrame(this.loop);
    };

    update(deltaTime = FIXED_STEP_SECONDS) {
      this.readGamepad();
      if (this.state.mode !== "paused") this.dialogue.update();
      document.body.classList.toggle("dialogue-active", this.dialogue.active);
      if (!this.dialogue.active && this.state.mode === "stage") this.updateStage(deltaTime);
      if (this.dialogue.active) return;
      if (this.state.mode === "paused" || this.state.mode === "gameover" || this.state.mode === "title") return;
      if (this.state.mode === "clear" && this.clearAdvanceTimer > 0) {
        this.clearAdvanceTimer -= 1;
        if (this.clearAdvanceTimer === 0) {
          this.advanceArcadeStage();
          return;
        }
      }
      this.particles.forEach((p) => p.update());
      this.particles = this.particles.filter((p) => p.life > 0);
      this.state.shake = Math.max(0, this.state.shake - 1);
      this.state.messageTimer = Math.max(0, this.state.messageTimer - 1);
      this.state.bossNameTimer = Math.max(0, this.state.bossNameTimer - 1);
      this.powerUpFlash = Math.max(0, this.powerUpFlash - 1);
      this.grazeFlash = Math.max(0, this.grazeFlash - 1);
    }

    updateStage(deltaTime = FIXED_STEP_SECONDS) {
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
      if (this.boss) this.boss.update(this, deltaTime);

      this.resolveCollisions();
      if (this.pendingBossCardStart > 0) {
        this.pendingBossCardStart -= 1;
        if (this.pendingBossCardStart === 0 && this.boss && !this.boss.defeated) {
          this.boss.transitioning = false;
          this.boss.beginCurrentCard(this);
        }
      }
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
          const damaged = this.boss.takeDamage(this, 1.25);
          if (damaged && this.playerSpellTimer % 12 === 0) this.spawnBurst(this.boss.x, this.boss.y, "#d7fbff", 8);
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
      this.currentStage.waves.forEach((wave, index) => {
        if (t >= wave.time && !this.spawnedWaves.has(index)) {
          this.spawnedWaves.add(index);
          this.currentWave = index + 1;
          this.spawnWave(wave.pattern);
        }
      });

      if (t >= this.currentStage.bossTime && !this.boss) {
        this.boss = new Boss(this.currentStage.boss);
        this.enemies = [];
        this.enemyBullets = [];
        this.state.showMessage(this.currentStage.warning, 150);
      }
    }

    spawnWave(pattern) {
      const defaultFamily = this.currentStage.enemyFamily;
      const spawn = (x, y, type, movement = "drift", family = defaultFamily) => this.spawnEnemy(x, y, type, movement, family);
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
      } else if (pattern === "hinokiVanguard") {
        const count = this.difficulty.current === "easy" ? 4 : 6;
        for (let i = 0; i < count; i += 1) {
          const row = Math.floor(i / 3);
          const col = i % 3;
          spawn(W / 2 + (col - 1) * 68, -35 - row * 70, "small", "drift");
        }
      } else if (pattern === "hinokiWing") {
        spawn(98, -40, "medium", "wing");
        spawn(W - 98, -95, "medium", "wing");
        if (this.difficulty.current === "hard") spawn(W / 2, -150, "small", "zigzag");
      } else if (pattern === "mixedFan") {
        for (let i = 0; i < 5; i += 1) {
          spawn(W / 2 + (i - 2) * 58, -35 - Math.abs(i - 2) * 38, i % 2 ? "small" : "medium", "drift", i === 2 ? "pollen" : "hinoki");
        }
      } else if (pattern === "hinokiSweep") {
        const count = this.difficulty.current === "easy" ? 4 : 6;
        for (let i = 0; i < count; i += 1) spawn(52 + i * (346 / Math.max(1, count - 1)), -35 - i * 34, "small", "wing");
      } else if (pattern === "hinokiHeavyEscort") {
        spawn(W / 2, -55, "large", "sine");
        spawn(82, -120, "small", "wing");
        spawn(W - 82, -150, "small", "wing");
      } else if (pattern === "pollenInterlude") {
        for (let i = 0; i < 5; i += 1) spawn(70 + i * 76, -35 - (i % 2) * 48, "small", "zigzag", "pollen");
      } else if (pattern === "hinokiFormation") {
        spawn(W / 2, -45, "medium", "sine");
        spawn(105, -105, "medium", "wing");
        spawn(W - 105, -105, "medium", "wing");
      } else if (pattern === "mixedCross") {
        for (let i = 0; i < 6; i += 1) spawn(i % 2 ? W - 92 : 92, -35 - i * 52, i % 3 === 0 ? "medium" : "small", "sine", i % 2 ? "hinoki" : "pollen");
      } else if (pattern === "hinokiFanFinale") {
        for (let i = 0; i < 7; i += 1) spawn(W / 2 + (i - 3) * 48, -35 - Math.abs(i - 3) * 30, i === 3 ? "large" : "small", i === 3 ? "sine" : "wing");
      } else if (pattern === "hinokiGuard") {
        spawn(110, -45, "large", "sine");
        spawn(W - 110, -95, "large", "sine");
      } else if (pattern === "ragweedBeeRush") {
        const count = this.difficulty.current === "easy" ? 4 : 6;
        for (let i = 0; i < count; i += 1) {
          const fromLeft = i % 2 === 0;
          spawn(fromLeft ? -28 : W + 28, 58 + i * 48, "small", fromLeft ? "rushRight" : "rushLeft");
        }
      } else if (pattern === "ragweedEyeCircle") {
        spawn(W / 2, -42, "medium", "hover");
        if (this.difficulty.current !== "easy") spawn(W / 2 + 96, -108, "small", "zigzag");
      } else if (pattern === "ragweedPincer") {
        spawn(-30, 82, "small", "rushRight");
        spawn(W + 30, 124, "small", "rushLeft");
        spawn(110, -72, "medium", "hover");
        if (this.difficulty.current !== "easy") spawn(W - 110, -108, "medium", "hover");
      } else if (pattern === "ragweedSpiderFan") {
        spawn(W / 2, -58, "large", "spider");
        spawn(82, -122, "small", "rushRight");
        spawn(W - 82, -156, "small", "rushLeft");
      } else if (pattern === "ragweedBeeCross") {
        const count = this.difficulty.current === "hard" ? 8 : 6;
        for (let i = 0; i < count; i += 1) {
          const fromLeft = i % 2 === 0;
          spawn(fromLeft ? -24 : W + 24, 46 + (i % 4) * 62, "small", fromLeft ? "rushRight" : "rushLeft");
        }
      } else if (pattern === "ragweedMixedAmbush") {
        spawn(W / 2, -44, "medium", "hover");
        spawn(70, -92, "large", "spider");
        spawn(W - 70, -124, "small", "rushLeft");
        if (this.difficulty.current !== "easy") spawn(W - 100, -178, "medium", "hover");
      } else if (pattern === "ragweedEyePair") {
        spawn(132, -46, "medium", "hover");
        spawn(W - 132, -94, "medium", "hover");
        if (this.difficulty.current === "hard") spawn(W / 2, -142, "small", "zigzag");
      } else if (pattern === "ragweedSpiderLine") {
        const count = this.difficulty.current === "easy" ? 2 : 3;
        for (let i = 0; i < count; i += 1) spawn(90 + i * 135, -52 - i * 58, "large", "spider");
      } else if (pattern === "ragweedAutumnStorm") {
        spawn(W / 2, -56, "large", "spider");
        for (let i = 0; i < 5; i += 1) spawn(55 + i * 85, -100 - (i % 2) * 52, i % 2 ? "medium" : "small", i % 2 ? "hover" : "zigzag");
      } else if (pattern === "ragweedGate") {
        spawn(94, -48, "large", "spider");
        spawn(W - 94, -92, "large", "spider");
        spawn(W / 2, -146, "medium", "hover");
      }
    }

    spawnEnemy(x, y, type, movement = "drift", family = this.currentStage.enemyFamily) {
      const enemy = new Enemy(x, y, type, movement, family);
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
      const previousPower = this.power.value;
      const oldStage = this.power.stage;
      const gained = this.power.add(item.amount);
      const stageChanged = this.power.stage > oldStage;
      const reachedMax = previousPower < this.power.max && this.power.value >= this.power.max;

      if (gained === 0) {
        addScore(this, item.amount >= POWER_CONFIG.largePValue ? POWER_CONFIG.maxLargeBonus : POWER_CONFIG.maxSmallBonus);
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
      // フェーズ終了処理が重複しても、アイテム数が暴走しないための最終防壁。
      const activeItemCount = this.powerItems.length + this.pointItems.length;
      if (activeItemCount >= 64) return;
      const powerCount = 8;
      const pointCount = 16;
      const total = Math.min(powerCount + pointCount, 64 - activeItemCount);
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
        if (i < Math.min(powerCount, total)) {
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
      const stageScore = Math.max(0, this.score.value - this.stageStartScore);
      this.save.saveRun(
        this.difficulty.current,
        this.currentStageId,
        stageScore,
        this.checkpoints.current,
        cleared,
        this.continueCount,
        this.score.value
      );
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
      this.startDialogue(this.currentStage.clearScene, () => {
        this.boss = null;
        this.state.mode = "clear";
        this.saveCurrentRun(true);
        this.refreshTitleMenu();
        this.state.showMessage(this.currentStage.clearMessage, 9999);
        this.startDialogue(this.currentStage.endingScene, () => {
          this.state.mode = "clear";
          if (this.currentMode === "arcade" && this.getNextStageId()) {
            this.clearAdvanceTimer = ARCADE_CLEAR_WAIT_FRAMES;
          }
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
      if (this.state.mode === "clear") {
        this.drawResult(
          this.currentStage.clearMessage,
          this.currentStage.clearSubtitle || `スコア ${this.score.value}`,
          this.currentStage.clearFooter
        );
      }
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
        ctx.fillStyle = "#080907";
        ctx.fillRect(0, bandY - 5, W, bandH + 10);
        ctx.save();
        ctx.translate(slideX, 0);
        this.drawImageCover(this.slipperNovaCutin, 0, bandY, W, bandH);
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
        ctx.save();
        ctx.translate(slideX, 0);
        this.drawImageCover(this.suginomikotoCutin, 0, bandY, W, bandH);
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
      ctx.fillText(this.currentStage.boss.cutinLabel, 18, H / 2 + 60);
      ctx.fillStyle = "#ffe479";
      ctx.font = "800 15px system-ui, sans-serif";
      ctx.fillText(this.bossSpellCutinName, 18, H / 2 + 86);
      ctx.restore();
    }

    drawImageCover(image, x, y, w, h) {
      const imageRatio = image.width / image.height;
      const targetRatio = w / h;
      let sx = 0;
      let sy = 0;
      let sw = image.width;
      let sh = image.height;
      if (imageRatio > targetRatio) {
        sw = image.height * targetRatio;
        sx = (image.width - sw) / 2;
      } else {
        sh = image.width / targetRatio;
        sy = (image.height - sh) / 2;
      }
      ctx.drawImage(image, sx, sy, sw, sh, x, y, w, h);
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
        const barBaseY = 86;
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

        const currentCard = this.boss.currentCard;
        const currentRatio = currentCard?.survival ? 1 : Math.max(0, this.boss.hp / this.boss.maxHp);
        if (currentCard?.lifeBars > 1) {
          for (let i = 0; i < currentCard.lifeBars; i += 1) {
            const barNumberFromBottom = currentCard.lifeBars - i;
            let state = "empty";
            let ratio = 0;
            if (barNumberFromBottom > currentCard.remainingLifeBars) {
              state = "empty";
            } else if (barNumberFromBottom === currentCard.remainingLifeBars) {
              state = "current";
              ratio = currentRatio;
            } else {
              state = "reserve";
              ratio = 1;
            }
            drawLifeBar(barBaseY + i * (barHeight + barGap), ratio, state);
          }
        } else if (this.boss.cardIndex === 0) {
          drawLifeBar(barBaseY, currentRatio);
        } else {
          // 1本目の破壊後に残り2本を追加し、下段（第2ライフ）から削る。
          const phase3State = this.boss.cardIndex === 2 ? "current" : "reserve";
          const phase2State = this.boss.cardIndex === 1 ? "current" : "empty";
          drawLifeBar(barBaseY, this.boss.cardIndex === 2 ? currentRatio : 1, phase3State);
          drawLifeBar(barBaseY + barHeight + barGap, this.boss.cardIndex === 1 ? currentRatio : 0, phase2State);
        }
        if (this.boss.currentCard && this.boss.currentCard.isSpell) {
          const card = this.boss.currentCard;
          const rest = card.survival
            ? Math.max(0, Math.ceil(card.survivalTimer))
            : Math.max(0, Math.ceil((card.duration - card.age) / 60));
          const survivalUrgent = card.survival && card.survivalTimer <= 10;
          ctx.fillStyle = survivalUrgent ? "rgba(102, 18, 14, 0.86)" : "rgba(8, 18, 15, 0.76)";
          const visibleBossBars = Math.max(1, card.lifeBars || (this.boss.cardIndex === 0 ? 1 : 2));
          const spellBoxY = barBaseY + visibleBossBars * (barHeight + barGap) + 8;
          ctx.fillRect(78, spellBoxY, W - 156, 28);
          ctx.fillStyle = survivalUrgent ? "#fff0e8" : "#fff1a8";
          ctx.font = `800 ${survivalUrgent ? 18 : 15}px system-ui, sans-serif`;
          ctx.textAlign = "center";
          ctx.fillText(card.survival ? `SURVIVE  ${rest}` : `${card.name}  ${rest}`, W / 2, spellBoxY + 20);
        }
      }

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
        ctx.fillText(this.currentStage.bossLabel, W / 2, 178);
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
        `WAVE ${this.currentWave} / ${this.currentStage.waves.length}`,
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
      ctx.fillText("サバイバー", W / 2, 276);
      ctx.fillStyle = "#fff1a6";
      ctx.font = "16px system-ui, sans-serif";
      ctx.fillText("King of Slipper 外伝ミニゲーム", W / 2, 320);
      if (this.titlePanel === "options") {
        this.drawOptions();
        return;
      }
      if (this.titlePanel === "stage") {
        ctx.fillStyle = "#f8ffe9";
        ctx.font = "900 28px system-ui, sans-serif";
        ctx.fillText("STAGE SELECT", W / 2, 360);
        this.drawMenu(this.stageSelectMenu, 380);
        ctx.fillStyle = "#fff0a8";
        ctx.font = "700 14px system-ui, sans-serif";
        const selectedStage = this.stageSelectMenu.selected()?.action;
        const selectedScore = selectedStage && STAGE_DEFINITIONS[selectedStage]
          ? this.save.getHighScore(this.difficulty.current, selectedStage)
          : 0;
        ctx.fillText(`SELECTED HIGH SCORE  ${selectedScore}`, W / 2, 600);
        ctx.fillStyle = "rgba(239, 255, 237, 0.75)";
        ctx.font = "13px system-ui, sans-serif";
        ctx.fillText("Stage4は将来のアップデートで実装予定", W / 2, 628);
        ctx.fillText("Esc / B で戻る", W / 2, 652);
        return;
      }
      this.drawMenu(this.titleMenu, 332, (item) => {
        if (item.action === "fullscreen") return this.fullscreen.label();
        return item.label;
      });
      ctx.fillStyle = "rgba(239, 255, 237, 0.82)";
      ctx.font = "13px system-ui, sans-serif";
      if (this.titlePanel === "how") {
        ctx.fillText("移動: 矢印/WASD/ドラッグ  低速: Shift/低速ボタン", W / 2, 632);
        ctx.fillText("ショット: Z/Space  履技: X/履技ボタン  ポーズ: Esc/P/MENU", W / 2, 656);
        ctx.fillText("マウス: 移動  左ボタンショット  右クリック履技", W / 2, 680);
        ctx.fillText("Xbox: 左スティック/D-pad移動  Aショット/決定  X履技  LB/RB低速", W / 2, 704);
      } else if (this.titlePanel === "score") {
        ctx.fillText(`EASY　S1 ${this.save.getHighScore("easy", "stage1")}　S2 ${this.save.getHighScore("easy", "stage2")}　S3 ${this.save.getHighScore("easy", "stage3")}`, W / 2, 632);
        ctx.fillText(`NORMAL　S1 ${this.save.getHighScore("normal", "stage1")}　S2 ${this.save.getHighScore("normal", "stage2")}　S3 ${this.save.getHighScore("normal", "stage3")}`, W / 2, 656);
        ctx.fillText(`HARD　S1 ${this.save.getHighScore("hard", "stage1")}　S2 ${this.save.getHighScore("hard", "stage2")}　S3 ${this.save.getHighScore("hard", "stage3")}`, W / 2, 680);
        ctx.fillText(`TOTAL ${this.save.getHighScore(this.difficulty.current, "total")}　S1 ${this.save.isStageCleared("stage1") ? "CLEAR" : "---"}　S2 ${this.save.isStageCleared("stage2") ? "CLEAR" : "---"}　S3 ${this.save.isStageCleared("stage3") ? "CLEAR" : "---"}`, W / 2, 712);
      } else {
        ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
        ctx.fillRect(86, 626, W - 172, 38);
        ctx.strokeStyle = "rgba(255, 240, 168, 0.58)";
        ctx.strokeRect(86, 626, W - 172, 38);
        ctx.fillStyle = "#fff0a8";
        ctx.font = "800 15px system-ui, sans-serif";
        ctx.fillText(`DIFFICULTY  < ${this.difficulty.label} >`, W / 2, 651);
        ctx.fillStyle = "rgba(239, 255, 237, 0.82)";
        ctx.font = "13px system-ui, sans-serif";
        ctx.fillText(`HIGH SCORE  ${this.save.getHighScore(this.difficulty.current, "stage1")}`, W / 2, 690);
        ctx.fillText("上下で選択、START選択中の左右で難易度変更", W / 2, 716);
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
      if (this.pauseOptionsOpen) {
        this.drawOptions();
        return;
      }
      this.drawMenu(this.pauseMenu, 345, (item) => {
        if (item.action === "fullscreen") return this.fullscreen.label();
        return item.label;
      });
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
      this.drawConfirm(this.gameOverMenu);
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

    drawResult(title, subtitle, footer = "") {
      ctx.fillStyle = "rgba(5, 13, 12, 0.72)";
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = "center";
      ctx.fillStyle = title === "GAME OVER" ? "#ffb8a8" : "#f8ffe9";
      ctx.font = "900 34px system-ui, sans-serif";
      ctx.fillText(title, W / 2, 330);
      ctx.fillStyle = "#eaffdf";
      ctx.font = "18px system-ui, sans-serif";
      ctx.fillText(subtitle, W / 2, 382);
      if (footer) {
        ctx.fillStyle = "#fff0a8";
        ctx.font = "700 16px system-ui, sans-serif";
        ctx.fillText(footer, W / 2, 414);
      }
      ctx.font = "15px system-ui, sans-serif";
      ctx.fillStyle = "#eaffdf";
      ctx.fillText(
        this.currentMode === "arcade" && this.getNextStageId()
          ? "次のステージへ進みます　Z / Space / タップでスキップ"
          : this.currentMode === "stageSelect"
            ? "Z / Space / タップでSTAGE SELECTへ"
            : "Z / Space / タップでタイトルへ",
        W / 2,
        footer ? 458 : 432
      );
    }
  }

  const game = new Game();
  const updateManager = new UpdateManager();
  window.addEventListener("keishis-splash-finished", () => {
    if (game.state.mode === "title") game.ensureTitleBGM();
  });
  if (new URLSearchParams(location.search).has("debug")) {
    window.__POLLEN_GAME__ = game;
  }
  updateManager.init();
  requestAnimationFrame(game.loop);
})();
