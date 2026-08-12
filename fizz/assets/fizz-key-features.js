/**
 * Fizz Key Features — scroll-scrubbed image sequence + glass feature cards.
 * Depends on GSAP + ScrollTrigger when available; falls back to scroll listener.
 */
(function () {
  "use strict";

  var FRAME_PAD = 8;
  var instances = [];

  function clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function parseFrames(root) {
    var el = root.querySelector("[data-fkf-frames]");
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
    this.rail = root.querySelector("[data-fkf-rail]");
    this.cards = Array.prototype.slice.call(root.querySelectorAll("[data-fkf-card]"));
    this.urls = parseFrames(root);
    this.frameCount = this.urls.length || parseInt(root.getAttribute("data-frame-count") || "121", 10);
    this.posterFrame = parseInt(root.getAttribute("data-poster-frame") || "0", 10) || 0;
    this.images = new Array(this.frameCount);
    this.loaded = {};
    this.current = -1;
    this.activeCard = -1;
    this.ctx = this.canvas ? this.canvas.getContext("2d") : null;
    this.destroyed = false;
    this._onScroll = null;
    this._onResize = null;
    this._trigger = null;
    this._tween = null;
    this._loadQueue = [];
    this._loading = 0;

    if (!this.track || !this.urls.length) return;

    if (prefersReducedMotion()) {
      this.root.classList.add("is-reduced");
      this.setActiveCard(0);
      this.showPosterOnly();
      return;
    }

    this.bindCards();
    this.preloadAround(this.posterFrame, 6);
    this.drawFrame(this.posterFrame);
    this.root.classList.add("is-ready");
    this.setActiveCard(0);
    this.initScrub();
  }

  KeyFeatures.prototype.showPosterOnly = function () {
    if (this.poster) this.poster.style.opacity = "1";
  };

  KeyFeatures.prototype.bindCards = function () {
    var self = this;
    this.cards.forEach(function (card, index) {
      card.addEventListener("click", function () {
        self.jumpToCard(index);
      });
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          self.jumpToCard(index);
        }
      });
      if (!card.hasAttribute("tabindex")) card.setAttribute("tabindex", "0");
    });
  };

  KeyFeatures.prototype.cardFrameRange = function (card) {
    var start = parseInt(card.getAttribute("data-frame-start") || "0", 10);
    var end = parseInt(card.getAttribute("data-frame-end") || String(this.frameCount - 1), 10);
    if (Number.isNaN(start)) start = 0;
    if (Number.isNaN(end)) end = this.frameCount - 1;
    return { start: start, end: Math.max(start, end) };
  };

  KeyFeatures.prototype.setActiveCard = function (index) {
    index = clamp(index, 0, Math.max(this.cards.length - 1, 0));
    if (index === this.activeCard) return;
    this.activeCard = index;
    this.cards.forEach(function (card, i) {
      card.classList.toggle("is-active", i === index);
      card.setAttribute("aria-current", i === index ? "true" : "false");
    });
    var active = this.cards[index];
    if (active && window.matchMedia("(max-width: 749px)").matches) {
      try {
        active.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      } catch (e) {
        active.scrollIntoView(false);
      }
    }
  };

  KeyFeatures.prototype.jumpToCard = function (index) {
    if (!this.cards[index] || !this.track) return;
    var range = this.cardFrameRange(this.cards[index]);
    var mid = (range.start + range.end) / 2;
    var progress = this.frameCount > 1 ? mid / (this.frameCount - 1) : 0;
    var rect = this.track.getBoundingClientRect();
    var total = this.track.offsetHeight - window.innerHeight;
    if (total <= 0) return;
    var top = window.scrollY + rect.top + progress * total;
    window.scrollTo({ top: top, behavior: prefersReducedMotion() ? "auto" : "smooth" });
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
      var next = this._loadQueue.shift();
      this.loadImage(next);
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
    if (index === this.current && this.images[index]) return;
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
    for (var i = 0; i < this.cards.length; i++) {
      var range = this.cardFrameRange(this.cards[i]);
      if (frame >= range.start && frame <= range.end) {
        match = i;
        break;
      }
      if (frame >= range.start) match = i;
    }
    this.setActiveCard(match);
  };

  KeyFeatures.prototype.progressToFrame = function (progress) {
    progress = clamp(progress, 0, 1);
    if (this.frameCount <= 1) return 0;
    return progress * (this.frameCount - 1);
  };

  KeyFeatures.prototype.initScrub = function () {
    var self = this;
    if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
      gsap.registerPlugin(ScrollTrigger);
      var state = { p: 0 };
      this._tween = gsap.to(state, {
        p: 1,
        ease: "none",
        scrollTrigger: {
          trigger: this.track,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.45,
          invalidateOnRefresh: true,
          onUpdate: function (selfTrigger) {
            self.drawFrame(self.progressToFrame(selfTrigger.progress));
          },
        },
      });
      this._trigger = this._tween.scrollTrigger;
    } else {
      this._onScroll = function () {
        if (self.destroyed) return;
        var rect = self.track.getBoundingClientRect();
        var total = self.track.offsetHeight - window.innerHeight;
        var progress = total <= 0 ? (rect.top < 0 ? 1 : 0) : clamp(-rect.top / total, 0, 1);
        self.drawFrame(self.progressToFrame(progress));
      };
      window.addEventListener("scroll", this._onScroll, { passive: true });
      this._onScroll();
    }

    this._onResize = function () {
      if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
    };
    window.addEventListener("resize", this._onResize, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", this._onResize);
    }
  };

  KeyFeatures.prototype.destroy = function () {
    this.destroyed = true;
    if (this._tween) this._tween.kill();
    if (this._trigger) this._trigger.kill();
    if (this._onScroll) window.removeEventListener("scroll", this._onScroll);
    if (this._onResize) {
      window.removeEventListener("resize", this._onResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", this._onResize);
      }
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
