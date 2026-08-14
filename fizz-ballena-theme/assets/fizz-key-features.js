/**
 * Fizz Key Features — native scroll scrub + feature cards.
 * Dual mobile/desktop frame sequences switch at max-width 1099px.
 * Uses rAF progress (same pattern as nf-scroll How-to); no GSAP scrub.
 */
(function () {
  "use strict";

  var FRAME_PAD = 8;
  var MOBILE_MQ = "(max-width: 1099px)";
  var SIZE = {
    mobile: { w: 1080, h: 1922 },
    desktop: { w: 1600, h: 1280 },
  };
  var instances = [];

  function clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function isMobileViewport() {
    return window.matchMedia(MOBILE_MQ).matches;
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

  function KeyFeatures(root) {
    this.root = root;
    this.track = root.querySelector("[data-fkf-track]");
    this.sticky = root.querySelector("[data-fkf-sticky]");
    this.canvas = root.querySelector("[data-fkf-canvas]");
    this.poster = root.querySelector("[data-fkf-poster]");
    this.cards = Array.prototype.slice.call(root.querySelectorAll("[data-fkf-card]"));
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
    this.activeCard = -1;
    this.mode = null;
    this.ctx = this.canvas ? this.canvas.getContext("2d") : null;
    this.destroyed = false;
    this._onScroll = null;
    this._onResize = null;
    this._ticking = false;
    this._loadQueue = [];
    this._loading = 0;

    var initialUrls = isMobileViewport() ? this.urlsMobile : this.urlsDesktop;
    if (!this.track || !initialUrls.length) return;

    if (prefersReducedMotion()) {
      this.applyMode(isMobileViewport() ? "mobile" : "desktop", true);
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
    this.root.classList.add("is-ready");
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
    this._loading = 0;

    var size = SIZE[mode] || SIZE.desktop;
    if (this.canvas) {
      this.canvas.width = size.w;
      this.canvas.height = size.h;
    }

    this.root.setAttribute("data-fkf-mode", mode);
    this.root.style.setProperty("--fkf-aspect", size.w + " / " + size.h);

    if (this.poster) {
      var posterSrc =
        mode === "mobile"
          ? this.poster.getAttribute("data-poster-mobile")
          : this.poster.getAttribute("data-poster-desktop");
      if (posterSrc) {
        this.poster.src = posterSrc;
      }
      this.poster.width = size.w;
      this.poster.height = size.h;
    }

    var frame = this.current >= 0 ? this.current : this.posterFrame;
    this.current = -1;
    this.preloadAround(frame, 6);
    this.drawFrame(frame);
  };

  KeyFeatures.prototype.showPosterOnly = function () {
    if (this.poster) this.poster.style.opacity = "1";
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
    var indexChanged = index !== this.activeCard;
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

    // Only nudge the horizontal card sheet when the beat changes — never
    // scrollIntoView (that fights page scroll and makes scrub feel glitchy).
    if (indexChanged && window.matchMedia(MOBILE_MQ).matches) {
      this.scrollCardSheetTo(index);
    }
  };

  KeyFeatures.prototype.scrollCardSheetTo = function (index) {
    var layer = this.root.querySelector("[data-fkf-cards-layer]");
    var active = this.cardsForIndex(index)[0];
    if (!layer || !active) return;
    var target =
      active.offsetLeft - (layer.clientWidth - active.offsetWidth) / 2;
    if (typeof layer.scrollTo === "function") {
      layer.scrollTo({ left: Math.max(0, target), behavior: "auto" });
    } else {
      layer.scrollLeft = Math.max(0, target);
    }
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
    var rect = this.track.getBoundingClientRect();
    var total = this.track.offsetHeight - window.innerHeight;
    if (total <= 0) return;
    var top = window.scrollY + rect.top + progress * total;
    window.scrollTo({ top: top, behavior: "auto" });
  };

  KeyFeatures.prototype.loadImage = function (index) {
    var self = this;
    index = clamp(index, 0, this.frameCount - 1);
    if (this.images[index] || this.loaded[index] === "loading") return;
    var url = this.urls[index];
    if (!url) return;
    this.loaded[index] = "loading";
    var img = new Image();
    img.decoding = "async";
    img.onload = function () {
      self.images[index] = img;
      self.loaded[index] = "ready";
      self._loading = Math.max(0, self._loading - 1);
      if (self.current === index) self.paint(img);
      self.flushQueue();
    };
    img.onerror = function () {
      self.loaded[index] = "error";
      self._loading = Math.max(0, self._loading - 1);
      self.flushQueue();
    };
    this._loading += 1;
    img.src = url;
  };

  KeyFeatures.prototype.flushQueue = function () {
    while (this._loadQueue.length && this._loading < 4) {
      this.loadImage(this._loadQueue.shift());
    }
  };

  KeyFeatures.prototype.preloadAround = function (center, radius) {
    radius = radius == null ? FRAME_PAD : radius;
    var order = [center];
    for (var d = 1; d <= radius; d++) {
      order.push(center + d, center - d);
    }
    for (var i = 0; i < order.length; i++) {
      var idx = order[i];
      if (idx < 0 || idx >= this.frameCount) continue;
      if (this.images[idx] || this.loaded[idx] === "loading" || this.loaded[idx] === "ready") continue;
      this._loadQueue.push(idx);
    }
    this.flushQueue();
  };

  KeyFeatures.prototype.paint = function (img) {
    if (!this.ctx || !this.canvas || !img) return;
    var w = this.canvas.width;
    var h = this.canvas.height;
    this.ctx.clearRect(0, 0, w, h);
    this.ctx.drawImage(img, 0, 0, w, h);
  };

  KeyFeatures.prototype.drawFrame = function (index) {
    index = clamp(Math.round(index), 0, this.frameCount - 1);
    if (index === this.current && this.images[index]) {
      this.syncCardFromFrame(index);
      return;
    }
    this.current = index;
    this.preloadAround(index, FRAME_PAD);
    if (this.images[index]) {
      this.paint(this.images[index]);
    } else {
      this.loadImage(index);
      var fallback = this.nearestLoaded(index);
      if (fallback != null) this.paint(this.images[fallback]);
    }
    this.syncCardFromFrame(index);
  };

  KeyFeatures.prototype.nearestLoaded = function (index) {
    if (this.images[index]) return index;
    for (var d = 1; d < this.frameCount; d++) {
      if (this.images[index - d]) return index - d;
      if (this.images[index + d]) return index + d;
    }
    return null;
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
    this.setActiveCard(match);
  };

  KeyFeatures.prototype.trackProgress = function () {
    if (!this.track) return 0;
    var rect = this.track.getBoundingClientRect();
    var total = rect.height - window.innerHeight;
    if (total <= 0) return rect.top < 0 ? 1 : 0;
    return clamp(-rect.top / total, 0, 1);
  };

  KeyFeatures.prototype.progressToFrame = function (progress) {
    progress = clamp(progress, 0, 1);
    if (this.frameCount <= 1) return 0;
    return progress * (this.frameCount - 1);
  };

  /**
   * Native scroll scrub (same pattern as nf-scroll How-to).
   * No GSAP ScrollTrigger — lagged scrub was fighting adjacent sticky sections.
   */
  KeyFeatures.prototype.initScrub = function () {
    var self = this;
    this._ticking = false;

    this._render = function () {
      self._ticking = false;
      if (self.destroyed || !self.track) return;
      var nextMode = isMobileViewport() ? "mobile" : "desktop";
      if (nextMode !== self.mode) {
        self.applyMode(nextMode, false);
      }
      var frame = Math.round(self.progressToFrame(self.trackProgress()));
      if (frame !== self.current) {
        self.drawFrame(frame);
      } else {
        self.syncCardFromFrame(frame);
      }
    };

    this._requestRender = function () {
      if (self._ticking || self.destroyed) return;
      self._ticking = true;
      window.requestAnimationFrame(self._render);
    };

    this._onScroll = this._requestRender;
    this._onResize = this._requestRender;

    window.addEventListener("scroll", this._onScroll, { passive: true });
    window.addEventListener("resize", this._onResize, { passive: true });
    this._requestRender();
  };

  KeyFeatures.prototype.destroy = function () {
    this.destroyed = true;
    if (this._onScroll) window.removeEventListener("scroll", this._onScroll);
    if (this._onResize) window.removeEventListener("resize", this._onResize);
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
