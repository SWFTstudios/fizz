/*
  NeoFizz hero — black shell + destination-in FIZZ stencil (white→blue fill),
  I-stem zoom + fade, then NeoLeaf clip-path window.
*/
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var motionOff =
    document.documentElement.classList.contains('nf-no-motion') || reduced;
  if (reduced) document.documentElement.classList.add('nf-no-motion');

  var designMode = !!(window.Shopify && Shopify.designMode);
  var CP_BRS = '--nf-hero-cp-brs';

  function Hero(section) {
    this.section = section;
    this.track = section.querySelector('[data-nf-hero-track]');
    this.stage = section.querySelector('[data-nf-hero-stage]');
    this.frame = section.querySelector('[data-nf-hero-frame]');
    this.media = section.querySelector('[data-nf-hero-media]');
    this.copy = section.querySelector('[data-nf-hero-copy]');
    this.heading = section.querySelector('[data-nf-hero-heading]');
    this.copySide = section.querySelector('[data-nf-hero-copy-side]');
    this.dotsWrap = section.querySelector('[data-nf-hero-dots]');
    this.ctas = section.querySelector('[data-nf-hero-ctas]');
    this.overMediaEls = Array.prototype.slice.call(
      section.querySelectorAll('[data-nf-hero-over-media]')
    );
    this._overMediaRaf = 0;
    this._onResizeOverMedia = null;
    this.slides = Array.prototype.slice.call(
      section.querySelectorAll('[data-nf-hero-slide]')
    );
    this.dots = Array.prototype.slice.call(
      section.querySelectorAll('[data-nf-hero-dot]')
    );
    this.preloader = section.querySelector('[data-nf-preloader]');
    this.water = section.querySelector('[data-nf-preloader-water]');
    this.logo = section.querySelector('[data-nf-preloader-logo]');
    this.pctEl = section.querySelector('[data-nf-preloader-pct]');
    this.active = 0;
    this.timer = null;
    this.tl = null;
    this.st = null;
    this._runwayPx = 0;
    this.interval =
      (parseFloat(section.getAttribute('data-autoplay-interval')) || 5) * 1000;
    this.loaderDuration =
      (parseFloat(section.getAttribute('data-loader-duration')) || 5.6) * 1000;
    this.scrollLength =
      parseFloat(section.getAttribute('data-scroll-length')) || 180;
    this.loaderEnabled =
      section.getAttribute('data-loader-enabled') !== 'false' && this.preloader;

    this.bindDots();
    this.bindOverMedia();

    if (motionOff || designMode) {
      this.applyStaticInset();
      this.revealImmediate(true);
      return;
    }

    if (this.loaderEnabled) {
      section.classList.add('is-loading');
      this.runLoader();
    } else {
      this.revealImmediate(false);
    }
  }

  Hero.prototype.bindDots = function () {
    var self = this;
    this.dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        var idx = parseInt(dot.getAttribute('data-index'), 10) || 0;
        self.goTo(idx);
        self.startAutoplay();
      });
    });
  };

  Hero.prototype.goTo = function (idx) {
    if (!this.slides.length) return;
    this.active =
      ((idx % this.slides.length) + this.slides.length) % this.slides.length;
    this.slides.forEach(function (slide, i) {
      slide.classList.toggle('is-active', i === this.active);
    }, this);
    this.dots.forEach(function (dot, i) {
      dot.classList.toggle('is-active', i === this.active);
    }, this);
  };

  Hero.prototype.startAutoplay = function () {
    var self = this;
    this.stopAutoplay();
    if (this.slides.length < 2 || motionOff) return;
    this.timer = setInterval(function () {
      self.goTo(self.active + 1);
    }, this.interval);
  };

  Hero.prototype.stopAutoplay = function () {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  };

  Hero.prototype.setPct = function (n) {
    if (this.pctEl) this.pctEl.textContent = Math.round(n) + '%';
  };

  Hero.prototype.scrollRunwayPx = function () {
    /* Merchant setting is vh units; floor so the clip always has real sticky travel */
    return Math.max(
      Math.round((this.scrollLength / 100) * window.innerHeight),
      Math.round(window.innerHeight * 1.2)
    );
  };

  Hero.prototype.measureClip = function () {
    if (!this.stage || !this.frame) {
      return { top: 0, right: 0, bottom: 0, left: 0, borderRadius: 20 };
    }
    var stage = this.stage.getBoundingClientRect();
    var frame = this.frame.getBoundingClientRect();
    var radius = parseFloat(getComputedStyle(this.frame).borderRadius);
    if (isNaN(radius)) radius = window.innerWidth >= 1100 ? 48 : 20;
    return {
      top: Math.max(0, frame.top - stage.top),
      right: Math.max(0, stage.right - frame.right),
      bottom: Math.max(0, stage.bottom - frame.bottom),
      left: Math.max(0, frame.left - stage.left),
      borderRadius: radius
    };
  };

  Hero.prototype.clipPathValue = function (m) {
    return (
      'inset(' +
      m.top +
      'px ' +
      m.right +
      'px ' +
      m.bottom +
      'px ' +
      m.left +
      'px round var(' +
      CP_BRS +
      ', 0px))'
    );
  };

  Hero.prototype.rectsOverlap = function (a, b) {
    return !(
      a.right < b.left ||
      a.left > b.right ||
      a.bottom < b.top ||
      a.top > b.bottom
    );
  };

  Hero.prototype.parseInsetClip = function (clip, stageRect) {
    if (!clip || clip === 'none') return null;
    var match = String(clip).match(/inset\(\s*([^)]+)\)/i);
    if (!match) return null;
    var raw = match[1].split(/round/i)[0].trim().split(/\s+/);
    var vals = raw.map(function (part) {
      if (part.indexOf('%') !== -1) {
        return (parseFloat(part) / 100) * stageRect.height;
      }
      return parseFloat(part) || 0;
    });
    var top;
    var right;
    var bottom;
    var left;
    if (vals.length === 1) {
      top = right = bottom = left = vals[0];
    } else if (vals.length === 2) {
      top = bottom = vals[0];
      right = left = vals[1];
    } else if (vals.length === 3) {
      top = vals[0];
      right = left = vals[1];
      bottom = vals[2];
    } else {
      top = vals[0];
      right = vals[1];
      bottom = vals[2];
      left = vals[3];
    }
    return {
      top: stageRect.top + top,
      right: stageRect.right - right,
      bottom: stageRect.bottom - bottom,
      left: stageRect.left + left
    };
  };

  Hero.prototype.getVisibleMediaRect = function () {
    if (!this.stage || !this.media) return null;
    var stageRect = this.stage.getBoundingClientRect();
    var clip =
      getComputedStyle(this.media).clipPath ||
      getComputedStyle(this.media).webkitClipPath;
    var insetRect = this.parseInsetClip(clip, stageRect);
    if (insetRect) return insetRect;
    if (
      (this.section.classList.contains('is-shrunk') ||
        this.section.classList.contains('is-static-inset')) &&
      this.frame
    ) {
      return this.frame.getBoundingClientRect();
    }
    return this.media.getBoundingClientRect();
  };

  Hero.prototype.syncCopyOverMedia = function () {
    if (!this.overMediaEls || !this.overMediaEls.length) return;
    var mediaRect = this.getVisibleMediaRect();
    var self = this;
    this.overMediaEls.forEach(function (el) {
      if (!mediaRect) {
        el.classList.remove('is-over-media');
        return;
      }
      el.classList.toggle(
        'is-over-media',
        self.rectsOverlap(el.getBoundingClientRect(), mediaRect)
      );
    });
  };

  Hero.prototype.scheduleCopyOverMedia = function () {
    var self = this;
    if (this._overMediaRaf) return;
    this._overMediaRaf = requestAnimationFrame(function () {
      self._overMediaRaf = 0;
      self.syncCopyOverMedia();
    });
  };

  Hero.prototype.bindOverMedia = function () {
    var self = this;
    this._onResizeOverMedia = function () {
      self.scheduleCopyOverMedia();
    };
    window.addEventListener('resize', this._onResizeOverMedia);
    this.syncCopyOverMedia();
  };

  Hero.prototype.unbindOverMedia = function () {
    if (this._onResizeOverMedia) {
      window.removeEventListener('resize', this._onResizeOverMedia);
      this._onResizeOverMedia = null;
    }
    if (this._overMediaRaf) {
      cancelAnimationFrame(this._overMediaRaf);
      this._overMediaRaf = 0;
    }
  };

  Hero.prototype.emitChrome = function () {
    var overHero = !this.section.classList.contains('is-shrunk');
    document.dispatchEvent(
      new CustomEvent('nf:hero-chrome', {
        detail: { overHero: overHero, section: this.section }
      })
    );
  };

  Hero.prototype.setShrunk = function (shrunk) {
    var was = this.section.classList.contains('is-shrunk');
    this.section.classList.toggle('is-shrunk', !!shrunk);
    if (was === !!shrunk) return;
    this.emitChrome();
    /* Layout may shift with stacked frame; remasure clip once */
    if (typeof ScrollTrigger !== 'undefined' && !this._refreshingShrink) {
      this._refreshingShrink = true;
      ScrollTrigger.refresh();
      this._refreshingShrink = false;
    }
  };

  Hero.prototype.applyStaticInset = function () {
    this.section.classList.add('is-static-inset');
    this.setShrunk(true);
    this.clearRunway();
    if (!this.media || !this.frame) return;
    var self = this;
    requestAnimationFrame(function () {
      var m = self.measureClip();
      self.section.style.setProperty(CP_BRS, m.borderRadius + 'px');
      self.media.style.clipPath = self.clipPathValue(m);
      self.syncCopyOverMedia();
    });
  };

  Hero.prototype.clearRunway = function () {
    if (this.track) {
      this.track.style.height = '';
      this.track.style.minHeight = '';
    }
    this.section.style.minHeight = '';
    if (this.stage) {
      this.stage.style.position = '';
      this.stage.style.top = '';
    }
    if (this.media) {
      this.media.style.clipPath = '';
      this.section.style.removeProperty(CP_BRS);
    }
  };

  Hero.prototype.setRunway = function () {
    var stageH = this.stage ? this.stage.offsetHeight : window.innerHeight;
    var runway = this.scrollRunwayPx();
    this._runwayPx = runway;
    /*
      Sticky is limited by its *parent* height. The track must be taller than
      the stage or the shell unsticks before the clip finishes.
    */
    if (this.track) {
      this.track.style.height = stageH + runway + 'px';
    }
    this.section.style.minHeight = stageH + runway + 'px';
    if (this.stage) {
      this.stage.style.position = 'sticky';
      this.stage.style.top = '0';
    }
    return runway;
  };

  Hero.prototype.initScrollShrink = function () {
    if (
      motionOff ||
      !this.track ||
      !this.stage ||
      !this.frame ||
      !this.media ||
      typeof gsap === 'undefined' ||
      typeof ScrollTrigger === 'undefined'
    ) {
      this.applyStaticInset();
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    this.killScroll();

    var self = this;
    this.setRunway();

    this.section.style.setProperty(CP_BRS, '0px');
    gsap.set(this.media, {
      clipPath: 'inset(0px round var(' + CP_BRS + ', 0px))'
    });

    /* Opacity only — do not animate transform (conflicts with CSS position centering) */
    if (this.copySide) gsap.set(this.copySide, { autoAlpha: 0 });
    if (this.dotsWrap) gsap.set(this.dotsWrap, { autoAlpha: 0 });
    if (this.ctas) gsap.set(this.ctas, { scale: 1.08 });

    this.tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: this.track,
        start: 'top top',
        end: function () {
          /* Match sticky travel exactly (track height − stage height) */
          var travel =
            (self.track ? self.track.offsetHeight : 0) -
            (self.stage ? self.stage.offsetHeight : 0);
          return '+=' + Math.max(travel, self._runwayPx);
        },
        scrub: true,
        invalidateOnRefresh: true,
        onRefresh: function () {
          self.setRunway();
        },
        onUpdate: function (selfSt) {
          /* Header chrome only — copy ink uses visible-media overlap */
          self.setShrunk(selfSt.progress >= 0.99);
          self.scheduleCopyOverMedia();
        }
      }
    });

    this.st = this.tl.scrollTrigger;
    this.emitChrome();

    /*
      Clip finishes mid-timeline, then hold the finished window so the page
      only continues after the scale-down is fully visible.
    */
    this.tl.to(
      this.section,
      {
        [CP_BRS]: function () {
          return self.measureClip().borderRadius + 'px';
        },
        duration: 0.12
      },
      0
    );

    this.tl.to(
      this.media,
      {
        clipPath: function () {
          return self.clipPathValue(self.measureClip());
        },
        duration: 0.72
      },
      0
    );

    if (this.copySide) {
      this.tl.to(this.copySide, { autoAlpha: 1, duration: 0.22 }, 0.4);
    }
    if (this.ctas) {
      this.tl.to(this.ctas, { scale: 1, duration: 0.22 }, 0.4);
    }
    if (this.dotsWrap) {
      this.tl.to(this.dotsWrap, { autoAlpha: 1, duration: 0.18 }, 0.48);
    }

    /* Hold completed window for the rest of the sticky travel */
    this.tl.to({}, { duration: 0.28 }, 0.72);

    ScrollTrigger.refresh();
  };

  Hero.prototype.killScroll = function () {
    if (this.tl) {
      if (this.tl.scrollTrigger) this.tl.scrollTrigger.kill();
      this.tl.kill();
      this.tl = null;
      this.st = null;
    }
  };

  Hero.prototype.revealImmediate = function (staticInset) {
    var self = this;
    this.section.classList.remove('is-loading');
    this.section.classList.add('is-ready');
    if (this.preloader) {
      this.preloader.classList.add('is-done');
      this.preloader.style.display = 'none';
    }
    this.startAutoplay();
    if (staticInset) {
      this.applyStaticInset();
      this.emitChrome();
      return;
    }
    this.setShrunk(false);
    this.emitChrome();
    requestAnimationFrame(function () {
      self.initScrollShrink();
    });
  };

  Hero.prototype.runLoader = function () {
    var self = this;
    var start = performance.now();
    var fillMs = this.loaderDuration * 0.82;
    var holdMs = this.loaderDuration * 0.06;
    var zoomMs = this.loaderDuration * 0.12;

    function frame(now) {
      var elapsed = now - start;
      if (elapsed < fillMs) {
        var t = elapsed / fillMs;
        var ease =
          t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        var pct = ease * 100;
        if (self.water) self.water.style.transform = 'translateY(' + (100 - pct) + '%)';
        self.setPct(pct);
        requestAnimationFrame(frame);
        return;
      }

      self.setPct(100);
      if (self.water) self.water.style.transform = 'translateY(0%)';

      var afterFill = elapsed - fillMs;
      if (afterFill < holdMs) {
        requestAnimationFrame(frame);
        return;
      }

      var z = (afterFill - holdMs) / zoomMs;
      if (z < 1) {
        var ze = z * z;
        /* Scale high enough that the filled I covers the viewport before fade */
        var scale = 1 + ze * 32;
        var opacity = 1 - Math.max(0, (z - 0.4) / 0.6);
        if (self.logo) self.logo.style.transform = 'scale(' + scale + ')';
        if (self.preloader) self.preloader.style.opacity = String(Math.max(0, opacity));
        requestAnimationFrame(frame);
        return;
      }

      self.finishLoader();
    }

    requestAnimationFrame(frame);
  };

  Hero.prototype.finishLoader = function () {
    var self = this;
    this.section.classList.remove('is-loading');
    this.section.classList.add('is-ready');
    if (this.preloader) {
      this.preloader.classList.add('is-done');
      this.preloader.style.pointerEvents = 'none';
      setTimeout(function () {
        if (self.preloader) self.preloader.style.display = 'none';
      }, 400);
    }
    this.startAutoplay();
    this.setShrunk(false);
    this.emitChrome();
    requestAnimationFrame(function () {
      self.initScrollShrink();
    });
  };

  Hero.prototype.destroy = function () {
    this.stopAutoplay();
    this.killScroll();
    this.unbindOverMedia();
    this.clearRunway();
  };

  function initAll() {
    document.querySelectorAll('[data-nf-hero]').forEach(function (el) {
      if (el._nfHero) {
        el._nfHero.destroy();
      }
      el._nfHero = new Hero(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  document.addEventListener('shopify:section:load', function (e) {
    if (e.target && e.target.querySelector && e.target.querySelector('[data-nf-hero]')) {
      initAll();
    }
  });

  document.addEventListener('shopify:section:unload', function (e) {
    var hero = e.target && e.target.querySelector && e.target.querySelector('[data-nf-hero]');
    if (hero && hero._nfHero) {
      hero._nfHero.destroy();
      hero._nfHero = null;
    }
  });
})();
