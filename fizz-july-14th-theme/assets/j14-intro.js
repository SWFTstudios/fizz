/*
  July 14th intro — GSAP ScrollTrigger.
  Media is always full-bleed / object-fit: cover. We animate clip-path from an
  uppercase I stem to the full viewport so imagery is not scale-zoomed.

  On load (when enabled), the page auto-scrolls through the intro track so the
  expand plays without a manual scroll. Touch / wheel / menu open cancel it.
*/
(function () {
  'use strict';

  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var motionOff = document.documentElement.classList.contains('j14-no-motion') || reduced;
  if (reduced) document.documentElement.classList.add('j14-no-motion');

  var instances = [];

  function insetClip(top, right, bottom, left) {
    return 'inset(' + top + '% ' + right + '% ' + bottom + '% ' + left + '%)';
  }

  /** I-stem clip matching the wordmark gap box (percent of sticky stage). */
  function stemClip(stage, gap) {
    if (!stage || !gap) return insetClip(18, 47, 18, 47);
    var sr = stage.getBoundingClientRect();
    var gr = gap.getBoundingClientRect();
    if (!sr.width || !sr.height) return insetClip(18, 47, 18, 47);
    var top = ((gr.top - sr.top) / sr.height) * 100;
    var left = ((gr.left - sr.left) / sr.width) * 100;
    var bottom = ((sr.bottom - gr.bottom) / sr.height) * 100;
    var right = ((sr.right - gr.right) / sr.width) * 100;
    return insetClip(
      Math.max(0, top),
      Math.max(0, right),
      Math.max(0, bottom),
      Math.max(0, left)
    );
  }

  function afterPageTransition(cb) {
    var tries = 0;
    function tick() {
      var tx = document.getElementById('j14-tx');
      var busy = tx && tx.classList.contains('is-active');
      if (busy && tries < 50) {
        tries += 1;
        window.setTimeout(tick, 60);
        return;
      }
      cb();
    }
    tick();
  }

  function Intro(section) {
    this.section = section;
    this.track = section.querySelector('[data-j14-intro-track]');
    this.stage = section.querySelector('[data-j14-intro-stage]');
    this.gap = section.querySelector('[data-j14-intro-gap]');
    this.left = section.querySelector('[data-j14-intro-left]');
    this.right = section.querySelector('[data-j14-intro-right]');
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
    this.autoScrollTween = null;
    this.autoScrolling = false;
    this._cancelAutoScroll = this.cancelAutoScroll.bind(this);

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

    /* Measure after fonts/layout; slight delay avoids wrong stem clip. */
    requestAnimationFrame(function () {
      self.buildTimeline();
      ScrollTrigger.refresh();
      self.maybeAutoScroll();
    });
  }

  Intro.prototype.showStatic = function () {
    if (this.stage) gsap.set(this.stage, { clipPath: insetClip(0, 0, 0, 0), webkitClipPath: insetClip(0, 0, 0, 0) });
    if (this.left) gsap.set(this.left, { opacity: 0, x: 0 });
    if (this.right) gsap.set(this.right, { opacity: 0, x: 0 });
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

  Intro.prototype.bindAutoScrollCancel = function () {
    window.addEventListener('wheel', this._cancelAutoScroll, { passive: true });
    window.addEventListener('touchstart', this._cancelAutoScroll, { passive: true });
    window.addEventListener('keydown', this._cancelAutoScroll, { passive: true });
  };

  Intro.prototype.unbindAutoScrollCancel = function () {
    window.removeEventListener('wheel', this._cancelAutoScroll);
    window.removeEventListener('touchstart', this._cancelAutoScroll);
    window.removeEventListener('keydown', this._cancelAutoScroll);
  };

  Intro.prototype.cancelAutoScroll = function () {
    if (!this.autoScrolling) return;
    this.autoScrolling = false;
    this.section.classList.remove('is-auto-scrolling');
    if (this.autoScrollTween) {
      this.autoScrollTween.kill();
      this.autoScrollTween = null;
    }
    this.unbindAutoScrollCancel();
  };

  Intro.prototype.maybeAutoScroll = function () {
    var self = this;
    if (this.section.dataset.autoScroll !== 'true') return;
    if (!this.st || !this.track) return;
    /* Deep-linked further down the page — don't yank shoppers back */
    if (window.scrollY > 48) return;
    if (window.location.hash && window.location.hash !== '#') return;

    var delay = parseFloat(this.section.dataset.autoScrollDelay, 10);
    if (isNaN(delay)) delay = 0.5;
    var duration = parseFloat(this.section.dataset.autoScrollDuration, 10);
    if (isNaN(duration) || duration < 0.4) duration = 2.8;

    afterPageTransition(function () {
      gsap.delayedCall(delay, function () {
        if (document.documentElement.classList.contains('j14-menu-open')) return;
        if (window.scrollY > 48) return;
        self.playAutoScroll(duration);
      });
    });
  };

  Intro.prototype.playAutoScroll = function (duration) {
    var self = this;
    if (!this.st) return;

    ScrollTrigger.refresh();
    var endY = this.st.end;
    var startY = window.scrollY || 0;
    if (endY <= startY + 8) return;

    this.autoScrolling = true;
    this.section.classList.add('is-auto-scrolling');
    this.bindAutoScrollCancel();

    var proxy = { y: startY };
    this.autoScrollTween = gsap.to(proxy, {
      y: endY,
      duration: duration,
      ease: 'power1.inOut',
      onUpdate: function () {
        if (!self.autoScrolling) return;
        window.scrollTo(0, proxy.y);
      },
      onComplete: function () {
        self.cancelAutoScroll();
        /* Land precisely at the intro end so scrub settles */
        window.scrollTo(0, endY);
        if (typeof ScrollTrigger.update === 'function') ScrollTrigger.update();
      }
    });
  };

  Intro.prototype.buildTimeline = function () {
    var self = this;
    if (!this.track || !this.stage) return;

    var startClip = stemClip(this.stage, this.gap);
    gsap.set(this.stage, { clipPath: startClip, webkitClipPath: startClip });
    gsap.set([this.left, this.right].filter(Boolean), { opacity: 1, x: 0, xPercent: 0 });
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
          /* Recalculate I stem from the gap after layout. */
          if (self.tl && self.tl.progress() < 0.05) {
            var clip = stemClip(self.stage, self.gap);
            gsap.set(self.stage, { clipPath: clip, webkitClipPath: clip });
          }
        }
      }
    });

    this.st = this.tl.scrollTrigger;

    /* Phase 1 — expand I mask + letters depart (0 → ~0.72 of timeline) */
    this.tl.to(
      this.stage,
      {
        clipPath: insetClip(0, 0, 0, 0),
        webkitClipPath: insetClip(0, 0, 0, 0),
        ease: 'power2.inOut',
        duration: 0.72
      },
      0
    );

    if (this.left) {
      this.tl.to(
        this.left,
        { xPercent: -160, opacity: 0, ease: 'power2.in', duration: 0.45 },
        0.12
      );
    }
    if (this.right) {
      this.tl.to(
        this.right,
        { xPercent: 160, opacity: 0, ease: 'power2.in', duration: 0.45 },
        0.12
      );
    }
    if (this.hint) {
      this.tl.to(this.hint, { opacity: 0, duration: 0.08 }, 0);
    }

    /* Phase 2 — slow fade of hero copy (0.72 → 1) */
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
    this.cancelAutoScroll();
    if (this.timer) clearInterval(this.timer);
    if (this.tl) this.tl.kill();
    if (this.st) this.st.kill();
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

  /* Pause/cancel when the mobile menu opens */
  var menuObserver = new MutationObserver(function () {
    if (!document.documentElement.classList.contains('j14-menu-open')) return;
    instances.forEach(function (inst) {
      inst.cancelAutoScroll();
    });
  });
  menuObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
})();
