/**
 * BF Flavor Sequence — native sticky pin + rAF-lerped frame scrub.
 * Desktop: parked behind the previous section, covered by the next.
 * Mobile: simple pin (no sibling -100vh). Same lerp path as Key Features.
 */
(function () {
  "use strict";

  var FRAME_PAD = 8;
  var LERP = 0.18;
  var DPR_CAP = 3;
  var MAX_CONCURRENT = 8;
  var DECODE_WINDOW = 24;
  var SIZE = { w: 1280, h: 1280 };
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
    return window.matchMedia("(max-width: 749px)").matches;
  }

  function viewportHeight() {
    if (window.visualViewport && window.visualViewport.height) {
      return window.visualViewport.height;
    }
    return window.innerHeight || 1;
  }

  function introIsDone() {
    if (document.documentElement.hasAttribute("data-nf-intro-done")) return true;
    var el = document.querySelector("[data-nf-preloader]");
    if (!el) return true;
    return el.classList.contains("is-done");
  }

  function parseFramesEl(root) {
    var el = root.querySelector("[data-bfs-frames]");
    if (!el) return [];
    try {
      var data = JSON.parse(el.textContent || "[]");
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  function FlavorSequence(root) {
    this.root = root;
    this.wrap = root.closest(".shopify-section") || root;
    this.track = root.querySelector("[data-bfs-track]");
    this.canvas = root.querySelector("[data-bfs-canvas]");
    this.poster = root.querySelector("[data-bfs-poster]");
    this.urls = parseFramesEl(root);
    this.posterFrame = parseInt(root.getAttribute("data-poster-frame") || "0", 10) || 0;
    this.scrollVh = parseFloat(root.getAttribute("data-scroll-vh") || "360") || 360;
    this.frameCount = this.urls.length || parseInt(root.getAttribute("data-frame-count") || "121", 10);
    this.images = new Array(this.frameCount);
    this.loaded = {};
    this.current = -1;
    this.painted = -1;
    this.overlap = 0;
    this.ctx = this.canvas ? this.canvas.getContext("2d", { alpha: false }) : null;
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

    if (prefersReducedMotion() || isDesignMode()) {
      this.root.classList.add("is-reduced");
      this.showPosterOnly();
      return;
    }

    if (!this.track || !this.urls.length) return;

    this.syncOverlap();
    this.resizeCanvas();
    this.preloadAround(this.posterFrame, 6);
    this.drawFrame(this.posterFrame);
    this.initScrub();
  }

  FlavorSequence.prototype.showPosterOnly = function () {
    if (this.poster) this.poster.style.opacity = "1";
  };

  FlavorSequence.prototype.isSimplePin = function () {
    return isMobileViewport();
  };

  FlavorSequence.prototype.syncOverlap = function () {
    if (this.isSimplePin()) {
      this.overlap = 0;
      if (this.wrap) this.wrap.style.setProperty("--bfs-overlap", "0px");
      return;
    }
    var prev = this.wrap ? this.wrap.previousElementSibling : null;
    var overlap = viewportHeight();
    if (prev && prev.offsetHeight) overlap = prev.offsetHeight;
    this.overlap = overlap;
    if (this.wrap) this.wrap.style.setProperty("--bfs-overlap", overlap + "px");
  };

  FlavorSequence.prototype.resizeCanvas = function () {
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

  FlavorSequence.prototype.enqueueFrame = function (index, urgent) {
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

  FlavorSequence.prototype.loadImage = function (index) {
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

  FlavorSequence.prototype.flushQueue = function () {
    while (this._loadQueue.length && this._loading < MAX_CONCURRENT) {
      this.loadImage(this._loadQueue.shift());
    }
  };

  FlavorSequence.prototype.preloadAround = function (center, radius) {
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

  FlavorSequence.prototype.preloadAll = function () {
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

  FlavorSequence.prototype.decodeImage = function (img) {
    if (!img || img.__bfsDecoded) return;
    if (!img.decode) {
      img.__bfsDecoded = true;
      return;
    }
    img
      .decode()
      .then(function () {
        img.__bfsDecoded = true;
      })
      .catch(function () {
        img.__bfsDecoded = true;
      });
  };

  FlavorSequence.prototype.decodeAround = function (center) {
    center = clamp(Math.round(center || 0), 0, this.frameCount - 1);
    var i;
    var img;
    for (i = center - DECODE_WINDOW; i <= center + DECODE_WINDOW; i++) {
      if (i < 0 || i >= this.frameCount) continue;
      img = this.images[i];
      if (img) this.decodeImage(img);
    }
  };

  FlavorSequence.prototype.nearestLoaded = function (index) {
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

  FlavorSequence.prototype.paint = function (img) {
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

  FlavorSequence.prototype.paintDecoded = function (img, index) {
    var self = this;
    if (img.decode && !img.__bfsDecoded) {
      img
        .decode()
        .then(function () {
          img.__bfsDecoded = true;
          if (self.destroyed) return;
          if (self.current === index) {
            self.paint(img);
            self.painted = index;
          }
        })
        .catch(function () {
          img.__bfsDecoded = true;
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

  FlavorSequence.prototype.drawFrame = function (index) {
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
  };

  FlavorSequence.prototype.trackProgress = function () {
    if (!this.track) return 0;
    var vh = viewportHeight();
    var rect = this.track.getBoundingClientRect();
    if (this.isSimplePin()) {
      var total = rect.height - vh;
      if (total <= 0) return rect.top < 0 ? 1 : 0;
      return clamp(-rect.top / total, 0, 1);
    }
    var scrolled = -rect.top;
    var overlap = this.overlap || 0;
    var scrubPx = (this.scrollVh / 100) * vh;
    if (scrubPx <= 0) return scrolled > overlap ? 1 : 0;
    if (scrolled <= overlap) return 0;
    return clamp((scrolled - overlap) / scrubPx, 0, 1);
  };

  FlavorSequence.prototype.progressToFrame = function (progress) {
    progress = clamp(progress, 0, 1);
    if (this.frameCount <= 1) return 0;
    return progress * (this.frameCount - 1);
  };

  FlavorSequence.prototype.tick = function () {
    if (this.destroyed || !this.track) return;
    this.syncOverlap();
    this.resizeCanvas();
    this.targetFrame = this.progressToFrame(this.trackProgress());
    if (this.displayFrame < 0) this.displayFrame = this.targetFrame;
    this.displayFrame = lerp(this.displayFrame, this.targetFrame, LERP);
    if (Math.abs(this.displayFrame - this.targetFrame) < 0.03) {
      this.displayFrame = this.targetFrame;
    }
    this.drawFrame(this.displayFrame);
  };

  FlavorSequence.prototype.startLoop = function () {
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

  FlavorSequence.prototype.sectionIsNear = function () {
    if (!this.root) return false;
    var rect = this.root.getBoundingClientRect();
    var vh = viewportHeight();
    return rect.top < vh * 3 && rect.bottom > -vh;
  };

  FlavorSequence.prototype.hashTargetsSection = function () {
    var hash = (window.location.hash || "").replace(/^#/, "");
    if (!hash) return false;
    if (this.root.id && this.root.id === hash) return true;
    try {
      return !!(this.root.querySelector && this.root.querySelector("#" + hash));
    } catch (e) {
      return false;
    }
  };

  FlavorSequence.prototype.cancelIdle = function () {
    if (!this._idleId) return;
    if (this._idleKind === "idle" && window.cancelIdleCallback) {
      window.cancelIdleCallback(this._idleId);
    } else {
      window.clearTimeout(this._idleId);
    }
    this._idleId = 0;
    this._idleKind = "";
  };

  FlavorSequence.prototype.requestPreload = function () {
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

  FlavorSequence.prototype.initScrub = function () {
    var self = this;
    this._inView = true;

    this._onScroll = function () {
      if (self._inView) self.startLoop();
    };
    this._onResize = function () {
      if (self.destroyed) return;
      self.syncOverlap();
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

  FlavorSequence.prototype.destroy = function () {
    this.destroyed = true;
    this._inView = false;
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
    var roots = (scope || document).querySelectorAll("[data-bf-flavor-sequence]");
    roots.forEach(function (root) {
      if (root.__bfs) return;
      var inst = new FlavorSequence(root);
      root.__bfs = inst;
      instances.push(inst);
    });
  }

  function destroyAll() {
    instances.forEach(function (inst) {
      if (inst && inst.destroy) inst.destroy();
    });
    instances = [];
    document.querySelectorAll("[data-bf-flavor-sequence]").forEach(function (root) {
      delete root.__bfs;
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
    var root = e.target.querySelector("[data-bf-flavor-sequence]");
    if (root && root.__bfs) {
      root.__bfs.destroy();
      delete root.__bfs;
    }
  });

  window.BfFlavorSequence = { initAll: initAll, destroyAll: destroyAll };
})();
