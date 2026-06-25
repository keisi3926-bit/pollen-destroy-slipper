(() => {
  "use strict";

  const BRAND_SPLASH_CONFIG = Object.freeze({
    logoSrc: "assets/brand/keishis-entrance-logo.png",
    audioSrc: "assets/brand/sweet-wind-jingle.mp3",
    totalDurationMs: 4500,
    fadeInMs: 700,
    fadeOutMs: 800,
    maxVolume: 0.65,
    preloadTimeoutMs: 2500,
    skipFadeMs: 200,
    inputLockMs: 300,
    reducedMotionDurationMs: 850,
    allowSkip: true,
  });

  const AUDIO_SETTINGS_KEY = "pollenDestroySlipperAudioSettings";

  class KeishisEntranceSplash {
    constructor(config = {}) {
      this.config = { ...BRAND_SPLASH_CONFIG, ...config };
      this.root = document.getElementById("brandSplash");
      this.logo = document.getElementById("brandSplashLogo");
      this.audio = new Audio(this.config.audioSrc);
      this.audio.preload = "auto";
      this.audio.loop = false;
      this.started = false;
      this.presenting = false;
      this.finishing = false;
      this.finished = false;
      this.audioPlaying = false;
      this.startTime = 0;
      this.timers = new Set();
      this.volumeTimer = 0;
      this.gamepadTimer = 0;
      this.previousGamepadConfirm = false;
      this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      this.boundSkip = (event) => this.handleSkip(event);
      this.boundVisibility = () => this.handleVisibility();
    }

    start({ force = false } = {}) {
      if (!this.root || !this.logo) return;
      if (this.started && !force) return;
      if (force) {
        this.unbindInput();
        this.stopAudio();
      }
      this.cleanupTimers();
      this.started = true;
      this.presenting = false;
      this.finishing = false;
      this.finished = false;
      this.audioPlaying = false;
      this.previousGamepadConfirm = false;
      document.body.classList.add("brand-splash-active");
      this.root.classList.remove("is-visible", "is-exiting");
      this.root.hidden = false;
      this.logo.src = this.config.logoSrc;
      this.bindInput();

      let settled = false;
      const begin = () => {
        if (settled) return;
        settled = true;
        this.beginPresentation();
      };
      if (this.logo.complete && this.logo.naturalWidth > 0) begin();
      else {
        this.logo.addEventListener("load", begin, { once: true });
        this.logo.addEventListener("error", begin, { once: true });
        this.setTimer(begin, this.config.preloadTimeoutMs);
      }
      this.audio.load();
    }

    replay() {
      this.stopAudio();
      this.start({ force: true });
    }

    beginPresentation() {
      if (this.presenting || this.finishing || this.finished) return;
      this.presenting = true;
      this.startTime = performance.now();
      requestAnimationFrame(() => this.root.classList.add("is-visible"));
      this.tryPlayAudio();

      const duration = this.reducedMotion
        ? this.config.reducedMotionDurationMs
        : this.config.totalDurationMs;
      const fadeOut = this.reducedMotion ? 180 : this.config.fadeOutMs;
      this.setTimer(() => this.finish(fadeOut), Math.max(0, duration - fadeOut));
    }

    getAudioSettings() {
      const defaults = { bgmVolume: 0.7, masterMute: false };
      try {
        return { ...defaults, ...JSON.parse(localStorage.getItem(AUDIO_SETTINGS_KEY) || "{}") };
      } catch {
        return defaults;
      }
    }

    tryPlayAudio() {
      const settings = this.getAudioSettings();
      if (settings.masterMute) return;
      const targetVolume = this.config.maxVolume * Math.max(0, Math.min(1, settings.bgmVolume));
      this.audio.currentTime = 0;
      this.audio.volume = 0;
      const playAttempt = this.audio.play();
      if (!playAttempt || typeof playAttempt.then !== "function") return;
      playAttempt.then(() => {
        if (this.finishing || this.finished) {
          this.stopAudio();
          return;
        }
        this.audioPlaying = true;
        const fadeIn = this.reducedMotion ? 120 : this.config.fadeInMs;
        const startedAt = performance.now();
        this.volumeTimer = window.setInterval(() => {
          const progress = Math.min(1, (performance.now() - startedAt) / fadeIn);
          this.audio.volume = targetVolume * progress;
          if (progress >= 1) this.clearVolumeTimer();
        }, 40);
      }).catch(() => {
        this.audioPlaying = false;
        this.stopAudio();
      });
    }

    handleSkip(event) {
      if (!this.config.allowSkip || this.finishing || this.finished) return;
      if (event.type === "keydown" && !["Enter", " ", "Escape"].includes(event.key)) return;
      event.preventDefault?.();
      event.stopPropagation?.();
      event.stopImmediatePropagation?.();
      this.finish(this.config.skipFadeMs);
    }

    handleVisibility() {
      if (document.visibilityState === "hidden" && !this.finished) {
        this.finish(this.config.skipFadeMs);
      }
    }

    bindInput() {
      if (this.config.allowSkip) {
        window.addEventListener("pointerdown", this.boundSkip, true);
        window.addEventListener("touchstart", this.boundSkip, { capture: true, passive: false });
        window.addEventListener("keydown", this.boundSkip, true);
      }
      document.addEventListener("visibilitychange", this.boundVisibility);
      this.pollGamepad();
    }

    unbindInput() {
      window.removeEventListener("pointerdown", this.boundSkip, true);
      window.removeEventListener("touchstart", this.boundSkip, true);
      window.removeEventListener("keydown", this.boundSkip, true);
      document.removeEventListener("visibilitychange", this.boundVisibility);
      if (this.gamepadTimer) cancelAnimationFrame(this.gamepadTimer);
      this.gamepadTimer = 0;
    }

    pollGamepad() {
      if (this.finishing || this.finished) return;
      const pads = navigator.getGamepads?.() || [];
      const confirmPressed = Array.from(pads).some((pad) => pad?.buttons?.[0]?.pressed);
      if (confirmPressed && !this.previousGamepadConfirm) {
        this.finish(this.config.skipFadeMs);
        return;
      }
      this.previousGamepadConfirm = confirmPressed;
      this.gamepadTimer = requestAnimationFrame(() => this.pollGamepad());
    }

    finish(fadeMs = this.config.fadeOutMs) {
      if (this.finishing || this.finished) return;
      this.finishing = true;
      this.presenting = false;
      this.cleanupTimers();
      this.root.style.setProperty("--brand-splash-exit-ms", `${fadeMs}ms`);
      this.root.classList.add("is-exiting");
      this.fadeOutAudio(fadeMs);
      this.setTimer(() => this.complete(), fadeMs);
    }

    fadeOutAudio(fadeMs) {
      this.clearVolumeTimer();
      if (!this.audioPlaying || this.audio.paused) return;
      const initialVolume = this.audio.volume;
      const startedAt = performance.now();
      this.volumeTimer = window.setInterval(() => {
        const progress = Math.min(1, (performance.now() - startedAt) / Math.max(1, fadeMs));
        this.audio.volume = initialVolume * (1 - progress);
        if (progress >= 1) {
          this.clearVolumeTimer();
          this.stopAudio();
        }
      }, 25);
    }

    complete() {
      if (this.finished) return;
      this.finished = true;
      this.finishing = false;
      this.unbindInput();
      this.cleanupTimers();
      this.stopAudio();
      this.root.hidden = true;
      this.root.classList.remove("is-visible", "is-exiting");
      document.body.classList.remove("brand-splash-active");
      this.installInputReleaseGuard();
      window.dispatchEvent(new CustomEvent("keishis-splash-finished"));
    }

    installInputReleaseGuard() {
      const block = (event) => {
        event.preventDefault?.();
        event.stopPropagation?.();
        event.stopImmediatePropagation?.();
      };
      ["click", "pointerup", "keyup"].forEach((type) => window.addEventListener(type, block, true));
      window.setTimeout(() => {
        ["click", "pointerup", "keyup"].forEach((type) => window.removeEventListener(type, block, true));
      }, this.config.inputLockMs);
    }

    stopAudio() {
      this.clearVolumeTimer();
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio.volume = 0;
      this.audioPlaying = false;
    }

    setTimer(callback, delay) {
      const timer = window.setTimeout(() => {
        this.timers.delete(timer);
        callback();
      }, delay);
      this.timers.add(timer);
      return timer;
    }

    cleanupTimers() {
      for (const timer of this.timers) window.clearTimeout(timer);
      this.timers.clear();
      this.clearVolumeTimer();
    }

    clearVolumeTimer() {
      if (this.volumeTimer) window.clearInterval(this.volumeTimer);
      this.volumeTimer = 0;
    }
  }

  const splash = new KeishisEntranceSplash();
  window.KeishisEntranceSplash = KeishisEntranceSplash;
  window.__KEISHIS_ENTRANCE_SPLASH__ = splash;
  window.replayKeishisEntranceSplash = () => splash.replay();
  splash.start();
})();
