/*
  July 14th intro — load-only GSAP timeline (no scroll scrub).
  Hero media stays full-bleed. A paper mask with transparent FIZZ letter
  cutouts scales from the I stem, then is permanently removed so the visitor
  lands on the hero. Interrupt jumps to the completed state.
*/
(function () {
  'use strict';

  if (typeof gsap === 'undefined') return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var motionOff = document.documentElement.classList.contains('j14-no-motion') || reduced;
  if (reduced) document.documentElement.classList.add('j14-no-motion');

  var instances = [];
  var MOBILE_MQ = window.matchMedia('(max-width: 749px)');
  var INTERRUPT_EVENTS = ['wheel', 'touchstart', 'pointerdown', 'keydown'];

  /**
   * Desktop: Fizz_Logo_Intro.svg (viewBox ≈ 3036×1886, PNG 3038×1888).
   * Mobile: Fizz_Logo_INTRO_SVG_Mobile.svg (viewBox 1926×3128).
   */
  function getMaskMetrics() {
    if (MOBILE_MQ.matches) {
      return { aspect: 1926 / 3128, stem: 135 / 1926, origin: '37.59% 49.78%', cover: true };
    }
    return { aspect: 3038 / 1888, stem: 0.027, origin: '45.24% 49.76%', cover: true };
  }

  function computeFlyThroughScale() {
    var m = getMaskMetrics();
    var w = window.innerWidth;
    var h = window.innerHeight;
    var logoW = m.cover ? Math.max(w, h * m.aspect) : Math.min(w, h * m.aspect);
    var stemPx = logoW * m.stem;
    if (!stemPx) return 40;
    return (w / stemPx) * 1.08;
  }

  function Intro(section) {
    this.section = section;
    this.mask = section.querySelector('[data-j14-intro-mask]');
    this.copy = section.querySelector('[data-j14-intro-copy]');
    this.hint = section.querySelector('[data-j14-intro-hint]');
    this.copyParts = section.querySelectorAll(
      '.j14-intro__hero-eyebrow, .j14-intro__hero-heading, .j14-intro__hero-sub, .j14-intro__hero-cta'
    );
    this.slides = Array.prototype.slice.call(section.querySelectorAll('[data-j14-intro-slide]'));
    this.thumbs = Array.prototype.slice.call(section.querySelectorAll('[data-j14-intro-thumb]'));
    this.active = 0;
    this.timer = null;
    this.tl = null;
    this.delayTimer = null;
    this.completed = false;
    this.onInterrupt = null;

    var self = this;
    this.thumbs.forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        self.setSlide(parseInt(thumb.dataset.index, 10) || 0);
        self.restartAutoplay();
      });
    });

    this.restartAutoplay();

    var d = section.dataset;
    var animEnabled = d.autoscrollEnabled !== 'false';
    var designMode = window.Shopify && window.Shopify.designMode;

    if (motionOff || designMode || !animEnabled) {
      this.showStatic();
      return;
    }

    requestAnimationFrame(function () {
      self.playIntro();
    });
  }

  Intro.prototype.tearDownMask = function () {
    if (!this.mask) return;
    gsap.set(this.mask, {
      opacity: 0,
      scale: 1,
      visibility: 'hidden',
      clearProps: 'willChange'
    });
    this.mask.style.display = 'none';
    this.mask.style.willChange = 'auto';
  };

  Intro.prototype.finish = function () {
    if (this.completed) return;
    this.completed = true;
    this.detachInterrupt();
    this.tearDownMask();
    if (this.copy) gsap.set(this.copy, { opacity: 1, pointerEvents: 'auto' });
    if (this.copyParts.length) gsap.set(this.copyParts, { opacity: 1, y: 0 });
    if (this.hint) gsap.set(this.hint, { opacity: 0.7 });
    this.section.classList.add('is-zoomed', 'is-copy-in', 'is-done');
  };

  Intro.prototype.showStatic = function () {
    this.tearDownMask();
    if (this.copy) gsap.set(this.copy, { opacity: 1, pointerEvents: 'auto' });
    if (this.copyParts.length) gsap.set(this.copyParts, { opacity: 1, y: 0 });
    if (this.hint) gsap.set(this.hint, { opacity: 0 });
    this.section.classList.add('is-zoomed', 'is-copy-in', 'is-done');
    this.completed = true;
  };

  Intro.prototype.setSlide = function (index) {
    if (!this.slides.length) return;
    this.active = ((index % this.slides.length) + this.slides.length) % this.slides.length;
    var active = this.active;
    this.slides.forEach(function (slide, i) {
      slide.classList.toggle('is-active', i === active);
      var video = slide.querySelector('video');
      if (video) {
        if (i === active) {
          var p = video.play();
          if (p && p.catch) p.catch(function () {});
        } else {
          video.pause();
        }
      }
    });
    this.thumbs.forEach(function (thumb, i) {
      thumb.classList.toggle('is-active', i === active);
    });
  };

  Intro.prototype.restartAutoplay = function () {
    var interval = parseInt(this.section.dataset.autoplayInterval, 10) || 0;
    if (this.timer) clearInterval(this.timer);
    if (!interval || this.slides.length < 2 || motionOff) return;
    var self = this;
    this.timer = setInterval(function () {
      self.setSlide(self.active + 1);
    }, interval * 1000);
  };

  Intro.prototype.detachInterrupt = function () {
    if (!this.onInterrupt) return;
    INTERRUPT_EVENTS.forEach(function (evt) {
      window.removeEventListener(evt, this.onInterrupt);
    }, this);
    this.onInterrupt = null;
  };

  Intro.prototype.attachInterrupt = function () {
    var self = this;
    this.onInterrupt = function () {
      self.skipToEnd();
    };
    INTERRUPT_EVENTS.forEach(function (evt) {
      window.addEventListener(evt, self.onInterrupt, { passive: true });
    });
  };

  Intro.prototype.skipToEnd = function () {
    if (this.completed) return;
    if (this.delayTimer) {
      clearTimeout(this.delayTimer);
      this.delayTimer = null;
    }
    if (this.tl) {
      this.tl.progress(1);
      this.tl.kill();
      this.tl = null;
    }
    this.finish();
  };

  Intro.prototype.playIntro = function () {
    var self = this;
    if (!this.mask) {
      this.showStatic();
      return;
    }

    var d = this.section.dataset;
    var delay = (parseFloat(d.autoscrollDelay) || 0) * 1000;
    var duration = parseFloat(d.autoscrollDuration) || 2.2;
    var ease = d.autoscrollEase || 'power2.inOut';
    if (ease === 'none') ease = 'none';

    var metrics = getMaskMetrics();
    this.endScale = computeFlyThroughScale();

    gsap.set(this.mask, {
      scale: 1,
      opacity: 1,
      visibility: 'visible',
      display: 'block',
      transformOrigin: metrics.origin,
      willChange: 'transform, opacity'
    });
    if (this.copy) gsap.set(this.copy, { pointerEvents: 'none', opacity: 0 });
    gsap.set(this.copyParts, { opacity: 0, y: 28 });
    if (this.hint) gsap.set(this.hint, { opacity: 0.7 });

    this.attachInterrupt();

    this.delayTimer = setTimeout(function () {
      self.delayTimer = null;
      if (self.completed) return;

      self.endScale = computeFlyThroughScale();
      var fly = duration * 0.72;
      var fadeStart = duration * 0.55;
      var fadeDur = duration * 0.22;
      var copyStart = duration * 0.7;
      var copyDur = duration * 0.3;

      self.tl = gsap.timeline({
        onComplete: function () {
          self.tl = null;
          self.finish();
        }
      });

      self.tl.to(
        self.mask,
        {
          scale: self.endScale,
          ease: ease,
          duration: fly,
          onUpdate: function () {
            var p = self.tl ? self.tl.progress() : 1;
            self.section.classList.toggle('is-zoomed', p > 0.55);
            self.section.classList.toggle('is-copy-in', p > 0.75);
          }
        },
        0
      );

      self.tl.to(
        self.mask,
        {
          opacity: 0,
          duration: fadeDur,
          ease: 'power1.in',
          onComplete: function () {
            self.tearDownMask();
          }
        },
        fadeStart
      );

      if (self.hint) {
        self.tl.to(self.hint, { opacity: 0, duration: 0.2 }, 0);
      }

      if (self.copyParts.length) {
        self.tl.to(
          self.copyParts,
          {
            opacity: 1,
            y: 0,
            stagger: Math.min(0.08, copyDur / 4),
            ease: 'power2.out',
            duration: copyDur * 0.85
          },
          copyStart
        );
      }

      if (self.copy) {
        self.tl.set(self.copy, { opacity: 1, pointerEvents: 'auto' }, copyStart);
      }

      /* Restore scroll hint after landing on hero */
      if (self.hint) {
        self.tl.to(self.hint, { opacity: 0.7, duration: 0.25 }, duration * 0.9);
      }
    }, delay);
  };

  Intro.prototype.destroy = function () {
    this.detachInterrupt();
    if (this.timer) clearInterval(this.timer);
    if (this.delayTimer) clearTimeout(this.delayTimer);
    if (this.tl) this.tl.kill();
  };

  function init(scope) {
    scope.querySelectorAll('[data-j14-intro]').forEach(function (el) {
      instances.push(new Intro(el));
    });
  }

  function destroy(scope) {
    instances = instances.filter(function (inst) {
      if (scope.contains(inst.section)) {
        inst.destroy();
        return false;
      }
      return true;
    });
  }

  function boot() {
    init(document);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  document.addEventListener('shopify:section:load', function (event) {
    destroy(event.target);
    init(event.target);
  });
  document.addEventListener('shopify:section:unload', function (event) {
    destroy(event.target);
  });
  document.addEventListener('shopify:block:select', function (event) {
    var block = event.target;
    instances.forEach(function (inst) {
      if (!inst.section.contains(block)) return;
      var slide = block.closest('[data-j14-intro-slide]') || block.querySelector('[data-j14-intro-slide]');
      if (slide) inst.setSlide(parseInt(slide.dataset.index, 10) || 0);
    });
  });
})();
