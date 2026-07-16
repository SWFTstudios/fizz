/*
  July 14th intro — GSAP ScrollTrigger.
  Hero media stays full-bleed. A paper mask with transparent FIZZ letter
  cutouts scales from the I stem origin so the visitor flies through.
*/
(function () {
  'use strict';

  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var motionOff = document.documentElement.classList.contains('j14-no-motion') || reduced;
  if (reduced) document.documentElement.classList.add('j14-no-motion');

  var instances = [];

  var MOBILE_MQ = window.matchMedia('(max-width: 749px)');

  /** Desktop: Fizz_Logo_Intro.svg (3038×1888). Mobile: Fizz_Logo_INTRO_SVG_Mobile.svg (viewBox 1926×4512). */
  function getMaskMetrics() {
    if (MOBILE_MQ.matches) {
      return { aspect: 1926 / 4512, stem: 74 / 1926, origin: '43.15% 49.90%', cover: true };
    }
    return { aspect: 3038 / 1888, stem: 0.027, origin: '45.24% 49.76%', cover: true };
  }

  /**
   * Scale needed so the I stem hole covers the viewport width.
   * Both breakpoints use mask-size: cover for full-bleed paper.
   */
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
    this.track = section.querySelector('[data-j14-intro-track]');
    this.stage = section.querySelector('[data-j14-intro-stage]');
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
    this.st = null;
    this.autoScrollTimer = null;
    this.autoScrollTween = null;
    this.endScale = computeFlyThroughScale();

    var self = this;
    this.thumbs.forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        self.setSlide(parseInt(thumb.dataset.index, 10) || 0);
        self.restartAutoplay();
      });
    });

    this.restartAutoplay();

    if (motionOff) {
      this.showStatic();
      return;
    }

    var selfBuild = this;
    requestAnimationFrame(function () {
      selfBuild.buildTimeline();
      ScrollTrigger.refresh();
      selfBuild.autoScroll();
    });
  }

  Intro.prototype.showStatic = function () {
    if (this.mask) gsap.set(this.mask, { opacity: 0, visibility: 'hidden' });
    if (this.copy) gsap.set(this.copy, { opacity: 1, pointerEvents: 'auto' });
    if (this.copyParts.length) gsap.set(this.copyParts, { opacity: 1, y: 0 });
    if (this.hint) gsap.set(this.hint, { opacity: 0 });
    this.section.classList.add('is-zoomed', 'is-copy-in', 'is-done');
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

  Intro.prototype.buildTimeline = function () {
    var self = this;
    if (!this.track || !this.mask) return;

    var maskMetrics = getMaskMetrics();
    this.endScale = computeFlyThroughScale();
    gsap.set(this.mask, {
      scale: 1,
      opacity: 1,
      transformOrigin: maskMetrics.origin
    });
    if (this.copy) gsap.set(this.copy, { pointerEvents: 'none' });
    gsap.set(this.copyParts, { opacity: 0, y: 28 });
    if (this.hint) gsap.set(this.hint, { opacity: 0.7 });

    this.tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: this.track,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.65,
        invalidateOnRefresh: true,
        onUpdate: function (selfSt) {
          var p = selfSt.progress;
          self.section.classList.toggle('is-zoomed', p > 0.62);
          self.section.classList.toggle('is-copy-in', p > 0.82);
          self.section.classList.toggle('is-done', p >= 0.98);
          if (self.copy) {
            self.copy.style.pointerEvents = p > 0.82 ? 'auto' : 'none';
          }
        },
        onRefresh: function () {
          var metrics = getMaskMetrics();
          self.endScale = computeFlyThroughScale();
          if (self.tl && self.tl.progress() < 0.05) {
            gsap.set(self.mask, {
              scale: 1,
              opacity: 1,
              transformOrigin: metrics.origin
            });
          }
        }
      }
    });

    this.st = this.tl.scrollTrigger;

    /* Phase 1 — scale mask from I stem until cutout fills the viewport */
    this.tl.to(
      this.mask,
      {
        scale: function () {
          return self.endScale;
        },
        ease: 'power2.inOut',
        duration: 0.72
      },
      0
    );

    this.tl.to(this.mask, { opacity: 0, duration: 0.12 }, 0.68);

    if (this.hint) {
      this.tl.to(this.hint, { opacity: 0, duration: 0.08 }, 0);
    }

    /* Phase 2 — hero copy fade in */
    if (this.copyParts.length) {
      this.tl.to(
        this.copyParts,
        {
          opacity: 1,
          y: 0,
          stagger: 0.08,
          ease: 'power2.out',
          duration: 0.28
        },
        0.72
      );
    }
  };

  Intro.prototype.destroy = function () {
    if (this.timer) clearInterval(this.timer);
    if (this.autoScrollTimer) clearTimeout(this.autoScrollTimer);
    if (this.autoScrollTween) this.autoScrollTween.kill();
    if (this.tl) this.tl.kill();
    if (this.st) this.st.kill();
  };

  /**
   * On load, tween window scroll through the intro ScrollTrigger so the
   * visitor lands on hero copy without manually scrolling. Any user input cancels.
   */
  Intro.prototype.autoScroll = function () {
    var self = this;
    var d = this.section.dataset;
    if (motionOff || d.autoscrollEnabled !== 'true') return;
    if (window.Shopify && window.Shopify.designMode) return;
    if (window.scrollY > 4 || !this.st) return;

    var delay = (parseFloat(d.autoscrollDelay) || 0) * 1000;
    var duration = parseFloat(d.autoscrollDuration) || 2.2;
    var ease = d.autoscrollEase || 'power2.inOut';
    var target = (parseFloat(d.autoscrollTarget) || 88) / 100;
    var proxy = { y: window.scrollY };
    var cancelled = false;
    var events = ['wheel', 'touchstart', 'pointerdown', 'keydown'];

    function detach() {
      events.forEach(function (evt) {
        window.removeEventListener(evt, cancel);
      });
    }

    function cancel() {
      if (cancelled) return;
      cancelled = true;
      if (self.autoScrollTimer) {
        clearTimeout(self.autoScrollTimer);
        self.autoScrollTimer = null;
      }
      if (self.autoScrollTween) {
        self.autoScrollTween.kill();
        self.autoScrollTween = null;
      }
      detach();
    }

    events.forEach(function (evt) {
      window.addEventListener(evt, cancel, { passive: true });
    });

    this.autoScrollTimer = setTimeout(function () {
      self.autoScrollTimer = null;
      if (cancelled || !self.st) {
        detach();
        return;
      }
      var targetY = self.st.start + (self.st.end - self.st.start) * target;
      self.autoScrollTween = gsap.to(proxy, {
        y: targetY,
        duration: duration,
        ease: ease,
        onUpdate: function () {
          if (!cancelled) window.scrollTo(0, proxy.y);
        },
        onComplete: function () {
          self.autoScrollTween = null;
          detach();
        }
      });
    }, delay);
  };

  function init(scope) {
    scope.querySelectorAll('[data-j14-intro]').forEach(function (el) {
      instances.push(new Intro(el));
    });
    ScrollTrigger.refresh();
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
