const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function classList() {
  const values = new Set();
  return {
    add(...items) { items.forEach((item) => values.add(item)); },
    remove(...items) { items.forEach((item) => values.delete(item)); },
    contains(item) { return values.has(item); },
  };
}

function eventTarget() {
  const listeners = new Map();
  return {
    addEventListener(type, handler) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(handler);
    },
    removeEventListener(type, handler) {
      listeners.get(type)?.delete(handler);
    },
    dispatchEvent(event) {
      for (const handler of listeners.get(event.type) || []) handler(event);
    },
  };
}

const windowTarget = eventTarget();
const documentTarget = eventTarget();
const body = { classList: classList() };
body.classList.add("brand-splash-active");
const root = {
  classList: classList(),
  hidden: false,
  style: { setProperty() {} },
};
const logo = {
  complete: true,
  naturalWidth: 1672,
  src: "",
  addEventListener() {},
};

let pauseCount = 0;
class AudioStub {
  constructor(src) {
    this.src = src;
    this.volume = 1;
    this.currentTime = 0;
    this.paused = true;
  }
  load() {}
  play() {
    this.paused = false;
    return Promise.resolve();
  }
  pause() {
    this.paused = true;
    pauseCount += 1;
  }
}

const sandbox = {
  Audio: AudioStub,
  CustomEvent: class {
    constructor(type, options = {}) {
      this.type = type;
      this.detail = options.detail;
    }
  },
  console,
  localStorage: { getItem: () => JSON.stringify({ bgmVolume: 0.5, masterMute: false }) },
  navigator: { getGamepads: () => [] },
  performance,
  requestAnimationFrame: (callback) => setTimeout(callback, 0),
  cancelAnimationFrame: clearTimeout,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  document: {
    ...documentTarget,
    body,
    visibilityState: "visible",
    getElementById(id) {
      if (id === "brandSplash") return root;
      if (id === "brandSplashLogo") return logo;
      return null;
    },
  },
  window: {
    ...windowTarget,
    matchMedia: () => ({ matches: false }),
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
  },
};
sandbox.window.window = sandbox.window;

const source = fs.readFileSync(path.join(__dirname, "..", "brand-splash.js"), "utf8");
vm.runInNewContext(source, sandbox, { filename: "brand-splash.js" });

const splash = sandbox.window.__KEISHIS_ENTRANCE_SPLASH__;
assert.ok(splash, "splash instance should be exposed for diagnostics");
assert.equal(root.hidden, false, "splash should cover the initial frame");
assert.equal(body.classList.contains("brand-splash-active"), true, "game shell should remain hidden during splash");
assert.equal(logo.src, "assets/brand/keishis-entrance-logo.png");

splash.finish(0);
splash.finish(0);

setTimeout(() => {
  assert.equal(splash.finished, true, "finish should complete exactly once");
  assert.equal(root.hidden, true, "completed splash should be removed from rendering");
  assert.equal(body.classList.contains("brand-splash-active"), false, "title should be revealed after completion");
  assert.equal(splash.audio.paused, true, "jingle should be stopped after completion");
  assert.ok(pauseCount >= 1, "audio cleanup should always run");
  console.log("brand splash test passed");
}, 20);
