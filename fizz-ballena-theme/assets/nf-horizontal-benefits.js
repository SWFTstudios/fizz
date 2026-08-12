/**
 * NF Horizontal Benefits — Webflow-style vertical→horizontal scrub.
 * Native rAF + CSS sticky (same family as fizz-key-features / nf-scroll).
 * No GSAP ScrollTrigger pin.
 */
(function () {
  "use strict";

  var MQ = "(max-width: 749px)";
  var instances = [];

  function clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function HorizontalBenefits(root) {
    this.root = root;
    this.track = root.querySelector("[data-nf-hben-track]");
    this.sticky = root.querySelector("[data-nf-hben-sticky]");
    this.viewport = root.querySelector("[data-nf-hben-viewport]");
    this.rail = root.querySelector("[data-nf-hben-rail]");
    this.scrollSpeed =
      (parseFloat(root.getAttribute("data-scroll-speed") || "100") || 100) / 100;
    this.destroyed = false;
    this._ticking = false;
    this._maxX = 0;
    this._onScroll = null;
    this._onResize = null;
    this._mq = window.matchMedia(MQ);
    this._onMq = null;
    this._imgHandlers = [];

    if (!this.track || !this.sticky || !this.viewport || !this.rail) return;

    if (
      prefersReducedMotion() ||
      document.documentElement.classList.contains("nf-no-motion")
    ) {
      this.root.classList.add("is-reduced");
      this.clearScrub();
      return;
    }

    this.bind();
    this.measure();
    this.initScrub();
    this.root.classList.add("is-ready");
  }

  HorizontalBenefits.prototype.isMobile = function () {
    return this._mq.matches;
  };

  HorizontalBenefits.prototype.clearScrub = function () {
    if (this.track) this.track.style.height = "";
    if (this.rail) this.rail.style.transform = "";
    this.root.classList.remove("is-scrubbing");
  };

  HorizontalBenefits.prototype.measure = function () {
    if (this.destroyed || !this.track || !this.rail || !this.viewport) return;

    if (this.isMobile()) {
      this.clearScrub();
      return;
    }

    // Reset transform so scrollWidth is accurate
    this.rail.style.transform = "translate3d(0,0,0)";
    this.track.style.height = "";

    var stickyH = this.sticky.offsetHeight || window.innerHeight;
    var maxX = Math.max(0, this.rail.scrollWidth - this.viewport.clientWidth);
    this._maxX = maxX;

    if (maxX <= 1) {
      this.clearScrub();
      return;
    }

    var runway = stickyH + maxX * this.scrollSpeed;
    this.track.style.height = Math.round(runway) + "px";
    this.root.classList.add("is-scrubbing");
    this.render();
  };

  HorizontalBenefits.prototype.trackProgress = function () {
    if (!this.track) return 0;
    var rect = this.track.getBoundingClientRect();
    var total = rect.height - window.innerHeight;
    if (total <= 0) return rect.top < 0 ? 1 : 0;
    return clamp(-rect.top / total, 0, 1);
  };

  HorizontalBenefits.prototype.render = function () {
    if (this.destroyed || !this.rail) return;
    if (this.isMobile() || this._maxX <= 1) {
      this.rail.style.transform = "";
      return;
    }
    var p = this.trackProgress();
    var x = -(this._maxX * p);
    this.rail.style.transform = "translate3d(" + x.toFixed(2) + "px,0,0)";
  };

  HorizontalBenefits.prototype.requestRender = function () {
    var self = this;
    if (self._ticking || self.destroyed) return;
    self._ticking = true;
    window.requestAnimationFrame(function () {
      self._ticking = false;
      self.render();
    });
  };

  HorizontalBenefits.prototype.bind = function () {
    var self = this;

    this._onScroll = function () {
      self.requestRender();
    };
    this._onResize = function () {
      self.measure();
    };
    this._onMq = function () {
      self.measure();
    };

    window.addEventListener("scroll", this._onScroll, { passive: true });
    window.addEventListener("resize", this._onResize, { passive: true });
    if (this._mq.addEventListener) {
      this._mq.addEventListener("change", this._onMq);
    } else if (this._mq.addListener) {
      this._mq.addListener(this._onMq);
    }

    var imgs = this.root.querySelectorAll(".nf-hbenefits__img");
    for (var i = 0; i < imgs.length; i++) {
      var img = imgs[i];
      if (img.complete) continue;
      var handler = function () {
        self.measure();
      };
      img.addEventListener("load", handler);
      this._imgHandlers.push({ el: img, fn: handler });
    }
  };

  HorizontalBenefits.prototype.initScrub = function () {
    this.requestRender();
  };

  HorizontalBenefits.prototype.destroy = function () {
    this.destroyed = true;
    if (this._onScroll) window.removeEventListener("scroll", this._onScroll);
    if (this._onResize) window.removeEventListener("resize", this._onResize);
    if (this._mq) {
      if (this._mq.removeEventListener && this._onMq) {
        this._mq.removeEventListener("change", this._onMq);
      } else if (this._mq.removeListener && this._onMq) {
        this._mq.removeListener(this._onMq);
      }
    }
    for (var i = 0; i < this._imgHandlers.length; i++) {
      var h = this._imgHandlers[i];
      h.el.removeEventListener("load", h.fn);
    }
    this._imgHandlers = [];
    this.clearScrub();
  };

  function initAll(scope) {
    var roots = (scope || document).querySelectorAll("[data-nf-hbenefits]");
    roots.forEach(function (root) {
      if (root.__nfHben) return;
      var inst = new HorizontalBenefits(root);
      root.__nfHben = inst;
      instances.push(inst);
    });
  }

  function destroyIn(scope) {
    if (!scope) return;
    var roots = scope.querySelectorAll
      ? scope.querySelectorAll("[data-nf-hbenefits]")
      : [];
    if (scope.matches && scope.matches("[data-nf-hbenefits]")) {
      roots = [scope];
    }
    Array.prototype.forEach.call(roots, function (root) {
      if (root.__nfHben) {
        root.__nfHben.destroy();
        delete root.__nfHben;
      }
    });
    instances = instances.filter(function (inst) {
      return inst && !inst.destroyed;
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
    if (e.target) destroyIn(e.target);
  });
  document.addEventListener("shopify:section:reorder", function () {
    instances.forEach(function (inst) {
      if (inst && !inst.destroyed && inst.measure) inst.measure();
    });
  });
  document.addEventListener("shopify:block:select", function () {
    instances.forEach(function (inst) {
      if (inst && !inst.destroyed && inst.measure) inst.measure();
    });
  });

  window.NfHorizontalBenefits = { initAll: initAll };
})();
