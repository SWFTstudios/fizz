/**
 * Fizz Key Features — native sticky pin + rAF-lerped frame scrub.
 * Dual mobile/desktop WebP sequences switch at max-width 1099px.
 * Full active-breakpoint sequence preloads on approach (not only ±24).
 * No GSAP / Lenis — lagged scrub was fighting adjacent sticky sections.
 */
(function () {
  "use strict";

  var FRAME_PAD = 8;
  var LERP = 0.18;
  var DPR_CAP = 3;
  var MAX_CONCURRENT = 8;
  var DECODE_WINDOW = 24;
  var MOBILE_MQ = "(max-width: 1099px)";
  var SIZE = {
    mobile: { w: 1080, h: 1922 },
    desktop: { w: 1600, h: 1280 }
  };
  var instances = [];

  function clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function isDesignMode() {
    return !!(window.Shopify && window.Shopify.designMode);
  }

  function isMobileViewport() {
    return window.matchMedia(MOBILE_MQ).matches;
  }

  function viewportHeight() {
    if (window.visualViewport && window.visualViewport.height) {
      return window.visualViewport.height;
    }
    return window.innerHeight || 1;
  }

  function parseFramesEl(root, selector) {
    var el = root.querySelector(selector);
    if (!el) return [];
    try {
      var data = JSON.parse(el.textContent || "[]");
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  function introIsDone() {
    if (document.documentElement.hasAttribute("data-nf-intro-done")) return true;
    var el = document.querySelector("[data-nf-preloader]");
    if (!el) return true;
    return el.classList.contains("is-done");
  }

  function KeyFeatures(root) {
    this.root = root;
    this.track = root.querySelector("[data-fkf-track]");
    this.sticky = root.querySelector("[data-fkf-sticky]");
    this.canvas = root.querySelector("[data-fkf-canvas]");
    this.poster = root.querySelector("[data-fkf-poster]");
    this.cards = Array.prototype.slice.call(root.querySelectorAll("[data-fkf-card]"));
    this.cardsLayer = root.querySelector("[data-fkf-cards-layer]");
    this.urlsMobile = parseFramesEl(root, "[data-fkf-frames-mobile]");
    this.urlsDesktop = parseFramesEl(root, "[data-fkf-frames-desktop]");
    if (!this.urlsMobile.length && !this.urlsDesktop.length) {
      var legacy = parseFramesEl(root, "[data-fkf-frames]");
      this.urlsMobile = legacy;
      this.urlsDesktop = legacy;
    }
    this.posterFrame = parseInt(root.getAttribute("data-poster-frame") || "0", 10) || 0;
    this.images = [];
    this.loaded = {};
    this.urls = [];
    this.frameCount = parseInt(root.getAttribute("data-frame-count") || "121", 10);
    this.current = -1;
    this.painted = -1;
    this.activeCard = -1;
    this.mode = null;
    this.ctx = this.canvas ? this.canvas.getContext("2d", { alpha: true }) : null;
    this.destroyed = false;
    this.targetFrame = 0;
    this.displayFrame = -1;
    this._inView = false;
    this._rafId = 0;
    this._io = null;
    this._preloadIo = null;
    this._onScroll = null;
    this._onResize = null;
    this._loadQueue = [];
    this._queued = {};
    this._loading = 0;
    this._preloadAll = false;
    this._wantFullPreload = false;
    this._hasPainted = false;
    this._idleId = 0;
    this._idleKind = "";
    this._introCleanup = null;
    this._onIntroDone = null;

    var initialUrls = isMobileViewport() ? this.urlsMobile : this.urlsDesktop;
    if (!this.track) return;

    if (prefersReducedMotion() || isDesignMode() || !initialUrls.length) {
      this.root.classList.add("is-reduced");
      this.cards.forEach(function (card) {
        card.classList.add("is-in");
      });
      this.setActiveCard(0);
      this.showPosterOnly();
      return;
    }

    this.bindCards();
    this.applyMode(isMobileViewport() ? "mobile" : "desktop", true);
    this.setActiveCard(0);
    this.initScrub();
  }

  KeyFeatures.prototype.applyMode = function (mode, force) {
    if (!force && mode === this.mode) return;
    this.mode = mode;
    this.urls = mode === "mobile" ? this.urlsMobile : this.urlsDesktop;
    this.frameCount =
      this.urls.length ||
      parseInt(this.root.getAttribute("data-frame-count") || "121", 10);
    this.images = new Array(this.frameCount);
    this.loaded = {};
    this._loadQueue = [];
    this._queued = {};
    this._loading = 0;
    this._preloadAll = false;
    this.painted = -1;
    this._hasPainted = false;
    this.root.classList.remove("is-ready");

    var size = SIZE[mode] || SIZE.desktop;
    this.root.setAttribute("data-fkf-mode", mode);
    this.root.style.setProperty("--fkf-aspect", size.w + " / " + size.h);

    if (this.poster) {
      var posterSrc =
        mode === "mobile"
          ? this.poster.getAttribute("data-poster-mobile")
          : this.poster.getAttribute("data-poster-desktop");
      if (posterSrc) this.poster.src = posterSrc;
      this.poster.width = size.w;
      this.poster.height = size.h;
      this.poster.style.opacity = "";
    }

    var frame = this.current >= 0 ? this.current : this.posterFrame;
    this.current = -1;
    this.displayFrame = frame;
    this.targetFrame = frame;
    if (isDesignMode() || this.root.classList.contains("is-reduced")) {
      this.showPosterOnly();
      return;
    }
    this.resizeCanvas();
    this.preloadAround(frame, 6);
    this.drawFrame(frame);
    if (mode === "mobile") this.updateWheel(this.cardFloatIndex(frame));
    else this.clearWheel();
    if (this._wantFullPreload) this.preloadAll();
  };

  KeyFeatures.prototype.showPosterOnly = function () {
    if (this.poster) this.poster.style.opacity = "1";
  };

  KeyFeatures.prototype.resizeCanvas = function () {
    if (!this.canvas) return;
    var rect = this.canvas.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;
    var dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    var w = Math.max(1, Math.round(rect.width * dpr));
    var h = Math.max(1, Math.round(rect.height * dpr));
    if (this.canvas.width === w && this.canvas.height === h) return;
    this.canvas.width = w;
    this.canvas.height = h;
    if (this.painted >= 0 && this.images[this.painted]) {
      this.paint(this.images[this.painted]);
    }
  };

  KeyFeatures.prototype.bindCards = function () {
    var self = this;
    this.cards.forEach(function (card) {
      var index = parseInt(card.getAttribute("data-index") || "0", 10);
      card.addEventListener("click", function () {
        self.jumpToCard(index);
      });
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          self.jumpToCard(index);
        }
      });
    });
  };

  KeyFeatures.prototype.cardFrameRange = function (card) {
    var start = parseInt(card.getAttribute("data-frame-start") || "0", 10);
    var end = parseInt(card.getAttribute("data-frame-end") || String(this.frameCount - 1), 10);
    if (Number.isNaN(start)) start = 0;
    if (Number.isNaN(end)) end = this.frameCount - 1;
    return { start: start, end: Math.max(start, end) };
  };

  KeyFeatures.prototype.cardsForIndex = function (index) {
    return this.cards.filter(function (card) {
      return parseInt(card.getAttribute("data-index") || "-1", 10) === index;
    });
  };

  KeyFeatures.prototype.setActiveCard = function (index) {
    index = clamp(index, 0, Math.max(this.featureCount() - 1, 0));
    var self = this;
    this.activeCard = index;

    this.cards.forEach(function (card) {
      var i = parseInt(card.getAttribute("data-index") || "0", 10);
      var range = self.cardFrameRange(card);
      var frame = self.current < 0 ? 0 : self.current;
      var isActive = i === index;
      var isPast = frame > range.end;
      var isIn = frame >= range.start || isPast || isActive;

      card.classList.toggle("is-active", isActive);
      card.classList.toggle("is-past", isPast && !isActive);
      card.classList.toggle("is-in", isIn);
      card.setAttribute("aria-current", isActive ? "true" : "false");
    });
  };

  KeyFeatures.prototype.featureCount = function () {
    var max = -1;
    this.cards.forEach(function (card) {
      var i = parseInt(card.getAttribute("data-index") || "0", 10);
      if (i > max) max = i;
    });
    return max + 1;
  };

  KeyFeatures.prototype.jumpToCard = function (index) {
    var card = this.cardsForIndex(index)[0];
    if (!card || !this.track) return;
    var range = this.cardFrameRange(card);
    var mid = (range.start + range.end) / 2;
    var progress = this.frameCount > 1 ? mid / (this.frameCount - 1) : 0;
    var vh = viewportHeight();
    var rect = this.track.getBoundingClientRect();
    var total = this.track.offsetHeight - vh;
    if (total <= 0) return;
    var top = window.scrollY + rect.top + progress * total;
    window.scrollTo({ top: top, behavior: "auto" });
  };

  KeyFeatures.prototype.enqueueFrame = function (index, urgent) {
    index = clamp(index, 0, this.frameCount - 1);
    if (this.images[index] || this.loaded[index] === "loading" || this.loaded[index] === "ready") {
      return;
    }
    if (this._queued[index]) {
      if (urgent) {
        var at = this._loadQueue.indexOf(index);
        if (at > 0) {
          this._loadQueue.splice(at, 1);
          this._loadQueue.unshift(index);
        }
      }
      return;
    }
    this._queued[index] = true;
    if (urgent) this._loadQueue.unshift(index);
    else this._loadQueue.push(index);
  };

  KeyFeatures.prototype.loadImage = function (index) {
    var self = this;
    index = clamp(index, 0, this.frameCount - 1);
    if (this.images[index] || this.loaded[index] === "loading") return;
    var url = this.urls[index];
    if (!url) return;
    this.loaded[index] = "loading";
    delete this._queued[index];
    var img = new Image();
    img.decoding = "async";
    img.onload = function () {
      self.images[index] = img;
      self.loaded[index] = "ready";
      self._loading = Math.max(0, self._loading - 1);
      self.decodeAround(self.current >= 0 ? self.current : index);
      if (self.current === index) self.paintDecoded(img, index);
      self.flushQueue();
    };
    img.onerror = function () {
      self.loaded[index] = "error";
      self._loading = Math.max(0, self._loading - 1);
      delete self._queued[index];
      self.flushQueue();
    };
    this._loading += 1;
    img.src = url;
  };

  KeyFeatures.prototype.flushQueue = function () {
    while (this._loadQueue.length && this._loading < MAX_CONCURRENT) {
      this.loadImage(this._loadQueue.shift());
    }
  };

  KeyFeatures.prototype.preloadAround = function (center, radius) {
    radius = radius == null ? FRAME_PAD : radius;
    var order = [center];
    var d;
    for (d = 1; d <= radius; d++) {
      order.push(center + d, center - d);
    }
    for (d = 0; d < order.length; d++) {
      var idx = order[d];
      if (idx < 0 || idx >= this.frameCount) continue;
      this.enqueueFrame(idx, true);
    }
    this.flushQueue();
  };

  KeyFeatures.prototype.preloadAll = function () {
    if (this.destroyed || this._preloadAll) return;
    if (!introIsDone()) return;
    this._preloadAll = true;
    var center = clamp(
      Math.round(this.displayFrame >= 0 ? this.displayFrame : this.posterFrame),
      0,
      this.frameCount - 1
    );
    var i;
    for (i = center; i < this.frameCount; i++) this.enqueueFrame(i, false);
    for (i = center - 1; i >= 0; i--) this.enqueueFrame(i, false);
    this.flushQueue();
  };

  KeyFeatures.prototype.decodeImage = function (img) {
    if (!img || img.__fkfDecoded) return;
    if (!img.decode) {
      img.__fkfDecoded = true;
      return;
    }
    img
      .decode()
      .then(function () {
        img.__fkfDecoded = true;
      })
      .catch(function () {
        img.__fkfDecoded = true;
      });
  };

  KeyFeatures.prototype.decodeAround = function (center) {
    center = clamp(Math.round(center || 0), 0, this.frameCount - 1);
    var i;
    var img;
    for (i = center - DECODE_WINDOW; i <= center + DECODE_WINDOW; i++) {
      if (i < 0 || i >= this.frameCount) continue;
      img = this.images[i];
      if (img) this.decodeImage(img);
    }
  };

  KeyFeatures.prototype.nearestLoaded = function (index) {
    if (this.images[index]) return index;
    var d;
    var hi;
    var lo;
    for (d = 1; d < this.frameCount; d++) {
      hi = index + d;
      lo = index - d;
      if (hi < this.frameCount && this.images[hi]) return hi;
      if (lo >= 0 && this.images[lo]) return lo;
    }
    return -1;
  };

  KeyFeatures.prototype.paint = function (img) {
    if (!this.ctx || !this.canvas || !img) return;
    var w = this.canvas.width;
    var h = this.canvas.height;
    this.ctx.clearRect(0, 0, w, h);
    this.ctx.drawImage(img, 0, 0, w, h);
    if (!this._hasPainted) {
      this._hasPainted = true;
      this.root.classList.add("is-ready");
    }
  };

  KeyFeatures.prototype.paintDecoded = function (img, index) {
    var self = this;
    if (img.decode && !img.__fkfDecoded) {
      img
        .decode()
        .then(function () {
          img.__fkfDecoded = true;
          if (self.destroyed) return;
          if (self.current === index) {
            self.paint(img);
            self.painted = index;
          }
        })
        .catch(function () {
          img.__fkfDecoded = true;
          if (self.destroyed) return;
          if (self.current === index) {
            self.paint(img);
            self.painted = index;
          }
        });
      return;
    }
    this.paint(img);
    this.painted = index;
  };

  KeyFeatures.prototype.drawFrame = function (index) {
    index = clamp(Math.round(index), 0, this.frameCount - 1);
    this.current = index;
    var vel = Math.abs(this.targetFrame - this.displayFrame);
    var radius = Math.max(FRAME_PAD, Math.min(24, Math.ceil(vel * 4) + FRAME_PAD));
    this.preloadAround(index, radius);
    this.decodeAround(index);
    if (this.images[index]) {
      this.paintDecoded(this.images[index], index);
    } else {
      this.loadImage(index);
      var near = this.nearestLoaded(index);
      if (near >= 0 && this.images[near]) {
        this.paint(this.images[near]);
        this.painted = near;
      }
    }
    this.syncCardFromFrame(index);
  };

  KeyFeatures.prototype.syncCardFromFrame = function (frame) {
    if (!this.cards.length) return;
    var match = 0;
    var seen = {};
    for (var i = 0; i < this.cards.length; i++) {
      var card = this.cards[i];
      var idx = parseInt(card.getAttribute("data-index") || "0", 10);
      if (seen[idx]) continue;
      seen[idx] = true;
      var range = this.cardFrameRange(card);
      if (frame >= range.start && frame <= range.end) {
        match = idx;
        break;
      }
      if (frame >= range.start) match = idx;
    }
    if (match !== this.activeCard) this.setActiveCard(match);
    else this.setActiveCard(match);
  };

  KeyFeatures.prototype.wheelEnabled = function () {
    return (
      isMobileViewport() &&
      !prefersReducedMotion() &&
      !this.root.classList.contains("is-reduced")
    );
  };

  KeyFeatures.prototype.cardFloatIndex = function (frame) {
    var n = this.featureCount();
    if (n <= 1) return 0;
    var mids = [];
    var seen = {};
    var i;
    var card;
    var idx;
    var range;
    for (i = 0; i < this.cards.length; i++) {
      card = this.cards[i];
      idx = parseInt(card.getAttribute("data-index") || "0", 10);
      if (seen[idx]) continue;
      seen[idx] = true;
      range = this.cardFrameRange(card);
      mids[idx] = (range.start + range.end) / 2;
    }
    if (frame <= mids[0]) return 0;
    if (frame >= mids[n - 1]) return n - 1;
    for (i = 0; i < n - 1; i++) {
      var a = mids[i];
      var b = mids[i + 1];
      if (frame <= b) {
        if (b === a) return i;
        return i + (frame - a) / (b - a);
      }
    }
    return n - 1;
  };

  KeyFeatures.prototype.clearWheel = function () {
    this.cards.forEach(function (card) {
      card.style.removeProperty("--fkf-wheel-y");
      card.style.removeProperty("--fkf-wheel-scale");
      card.style.removeProperty("--fkf-wheel-opacity");
      card.style.removeProperty("--fkf-wheel-z");
      card.style.pointerEvents = "";
    });
  };

  KeyFeatures.prototype.updateWheel = function (cardPos) {
    if (!this.wheelEnabled()) {
      this.clearWheel();
      return;
    }
    var band = this.cardsLayer ? this.cardsLayer.clientHeight : 0;
    var slot = Math.max(44, Math.round((band || 220) * 0.28));
    var fade = 1.45;
    var i;
    var card;
    var idx;
    var delta;
    var abs;
    var y;
    var scale;
    var opacity;
    var z;
    for (i = 0; i < this.cards.length; i++) {
      card = this.cards[i];
      idx = parseInt(card.getAttribute("data-index") || "0", 10);
      delta = idx - cardPos;
      abs = Math.abs(delta);
      y = delta * slot;
      scale = Math.max(0.72, 1 - abs * 0.12);
      opacity = abs >= fade ? 0 : Math.max(0, 1 - abs * 0.48);
      z = String(Math.round((1 - Math.min(abs, 2) / 2) * 10));
      card.style.setProperty("--fkf-wheel-y", y + "px");
      card.style.setProperty("--fkf-wheel-scale", String(scale));
      card.style.setProperty("--fkf-wheel-opacity", String(opacity));
      card.style.setProperty("--fkf-wheel-z", z);
      card.style.pointerEvents = abs < 1.15 ? "auto" : "none";
    }
  };

  KeyFeatures.prototype.trackProgress = function () {
    if (!this.track) return 0;
    var vh = viewportHeight();
    var rect = this.track.getBoundingClientRect();
    var total = rect.height - vh;
    if (total <= 0) return rect.top < 0 ? 1 : 0;
    return clamp(-rect.top / total, 0, 1);
  };

  KeyFeatures.prototype.progressToFrame = function (progress) {
    progress = clamp(progress, 0, 1);
    if (this.frameCount <= 1) return 0;
    return progress * (this.frameCount - 1);
  };

  KeyFeatures.prototype.sectionIsNear = function () {
    if (!this.root) return false;
    var rect = this.root.getBoundingClientRect();
    var vh = viewportHeight();
    return rect.top < vh * 3 && rect.bottom > -vh;
  };

  KeyFeatures.prototype.hashTargetsSection = function () {
    var hash = (window.location.hash || "").replace(/^#/, "");
    if (!hash) return false;
    if (this.root.id && this.root.id === hash) return true;
    try {
      return !!(this.root.querySelector && this.root.querySelector("#" + hash));
    } catch (e) {
      return false;
    }
  };

  KeyFeatures.prototype.cancelIdle = function () {
    if (!this._idleId) return;
    if (this._idleKind === "idle" && window.cancelIdleCallback) {
      window.cancelIdleCallback(this._idleId);
    } else {
      window.clearTimeout(this._idleId);
    }
    this._idleId = 0;
    this._idleKind = "";
  };

  KeyFeatures.prototype.requestPreload = function () {
    var self = this;
    if (this.destroyed || this._wantFullPreload) return;
    this._wantFullPreload = true;

    function start() {
      if (self.destroyed) return;
      self.preloadAll();
    }

    function afterIntro() {
      if (self.destroyed) return;
      if (!introIsDone()) return;
      if (self.hashTargetsSection() || self.sectionIsNear()) {
        start();
        return;
      }
      self.cancelIdle();
      if (window.requestIdleCallback) {
        self._idleKind = "idle";
        self._idleId = window.requestIdleCallback(start, { timeout: 2500 });
      } else {
        self._idleKind = "timeout";
        self._idleId = window.setTimeout(start, 400);
      }
    }

    if (introIsDone()) {
      afterIntro();
      return;
    }

    this._onIntroDone = function () {
      afterIntro();
    };
    document.addEventListener("nf:intro:done", this._onIntroDone);

    var pre = document.querySelector("[data-nf-preloader]");
    if (pre && typeof MutationObserver === "function") {
      var mo = new MutationObserver(function () {
        if (!introIsDone()) return;
        mo.disconnect();
        afterIntro();
      });
      mo.observe(pre, { attributes: true, attributeFilter: ["class"] });
      this._introCleanup = function () {
        mo.disconnect();
      };
    }

    window.addEventListener("load", afterIntro, { once: true });
  };

  KeyFeatures.prototype.tick = function () {
    if (this.destroyed || !this.track) return;
    var nextMode = isMobileViewport() ? "mobile" : "desktop";
    if (nextMode !== this.mode) this.applyMode(nextMode, false);
    this.resizeCanvas();
    this.targetFrame = this.progressToFrame(this.trackProgress());
    if (this.displayFrame < 0) this.displayFrame = this.targetFrame;
    this.displayFrame = lerp(this.displayFrame, this.targetFrame, LERP);
    if (Math.abs(this.displayFrame - this.targetFrame) < 0.03) {
      this.displayFrame = this.targetFrame;
    }
    this.drawFrame(this.displayFrame);
    this.updateWheel(this.cardFloatIndex(this.displayFrame));
  };

  KeyFeatures.prototype.startLoop = function () {
    var self = this;
    if (this._rafId || this.destroyed) return;
    var loop = function () {
      self._rafId = 0;
      if (self.destroyed || !self._inView) return;
      self.tick();
      self._rafId = window.requestAnimationFrame(loop);
    };
    this._rafId = window.requestAnimationFrame(loop);
  };

  KeyFeatures.prototype.initScrub = function () {
    var self = this;
    this._inView = true;

    this._onScroll = function () {
      if (self._inView) self.startLoop();
    };
    this._onResize = function () {
      if (self.destroyed) return;
      self.resizeCanvas();
      if (self._inView) self.startLoop();
    };

    if (typeof IntersectionObserver === "function") {
      this._preloadIo = new IntersectionObserver(
        function (entries) {
          var entry = entries[0];
          if (entry && entry.isIntersecting) self.requestPreload();
        },
        { rootMargin: "200% 0px" }
      );
      this._preloadIo.observe(this.root);

      this._io = new IntersectionObserver(
        function (entries) {
          var entry = entries[0];
          self._inView = !!(entry && entry.isIntersecting);
          if (self._inView) self.startLoop();
        },
        { rootMargin: "120px 0px" }
      );
      this._io.observe(this.root);
    } else {
      this.requestPreload();
    }

    if (this.hashTargetsSection() || this.sectionIsNear()) {
      this.requestPreload();
    } else {
      window.addEventListener(
        "load",
        function () {
          if (self.destroyed) return;
          if (self.hashTargetsSection() || self.sectionIsNear()) self.requestPreload();
        },
        { once: true }
      );
    }

    window.addEventListener("scroll", this._onScroll, { passive: true });
    window.addEventListener("resize", this._onResize, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", this._onResize);
      window.visualViewport.addEventListener("scroll", this._onScroll, { passive: true });
    }
    this.startLoop();
  };

  KeyFeatures.prototype.destroy = function () {
    this.destroyed = true;
    this._inView = false;
    this.clearWheel();
    this.cancelIdle();
    if (this._introCleanup) {
      this._introCleanup();
      this._introCleanup = null;
    }
    if (this._onIntroDone) {
      document.removeEventListener("nf:intro:done", this._onIntroDone);
      this._onIntroDone = null;
    }
    if (this._rafId) {
      window.cancelAnimationFrame(this._rafId);
      this._rafId = 0;
    }
    if (this._io) {
      this._io.disconnect();
      this._io = null;
    }
    if (this._preloadIo) {
      this._preloadIo.disconnect();
      this._preloadIo = null;
    }
    if (this._onScroll) window.removeEventListener("scroll", this._onScroll);
    if (this._onResize) window.removeEventListener("resize", this._onResize);
    if (window.visualViewport) {
      if (this._onResize) window.visualViewport.removeEventListener("resize", this._onResize);
      if (this._onScroll) window.visualViewport.removeEventListener("scroll", this._onScroll);
    }
  };

  function initAll(scope) {
    var roots = (scope || document).querySelectorAll("[data-fizz-key-features]");
    roots.forEach(function (root) {
      if (root.__fkf) return;
      var inst = new KeyFeatures(root);
      root.__fkf = inst;
      instances.push(inst);
    });
  }

  function destroyAll() {
    instances.forEach(function (inst) {
      if (inst && inst.destroy) inst.destroy();
    });
    instances = [];
    document.querySelectorAll("[data-fizz-key-features]").forEach(function (root) {
      delete root.__fkf;
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initAll(document);
    });
  } else {
    initAll(document);
  }

  document.addEventListener("shopify:section:load", function (e) {
    if (e.target) initAll(e.target);
  });
  document.addEventListener("shopify:section:unload", function (e) {
    if (!e.target) return;
    var root = e.target.querySelector("[data-fizz-key-features]");
    if (root && root.__fkf) {
      root.__fkf.destroy();
      delete root.__fkf;
    }
  });

  window.FizzKeyFeatures = { initAll: initAll, destroyAll: destroyAll };
})();
