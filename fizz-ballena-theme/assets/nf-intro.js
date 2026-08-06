/*
  NF Intro — slideshow hero.
  Optional scroll-zoom FIZZ mask (legacy). Ballena Fizz uses slides-only + water-fill loader.
*/
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var motionOff = document.documentElement.classList.contains('nf-no-motion') || reduced;
  if (reduced) document.documentElement.classList.add('nf-no-motion');

  var hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  var instances = [];
  var MOBILE_MQ = window.matchMedia('(max-width: 749px)');

  function getMaskMetrics() {
    if (MOBILE_MQ.matches) {
      return { aspect: 1926 / 4512, stem: 74 / 1926, origin: '43.15% 49.90%', cover: true };
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
    this.track = section.querySelector('[data-nf-intro-track]');
    this.stage = section.querySelector('[data-nf-intro-stage]');
    this.mask = section.querySelector('[data-nf-intro-mask]');
    this.copy = section.querySelector('[data-nf-intro-copy]');
    this.hint = section.querySelector('[data-nf-intro-hint]');
    this.copyParts = section.querySelectorAll(
      '.nf-intro__hero-eyebrow, .nf-intro__hero-heading, .nf-intro__hero-sub, .nf-intro__hero-cta'
    );
    this.slides = Array.prototype.slice.call(section.querySelectorAll('[data-nf-intro-slide]'));
    this.thumbs = Array.prototype.slice.call(section.querySelectorAll('[data-nf-intro-thumb]'));
    this.preloader = section.querySelector('[data-nf-preloader]');
    this.water = section.querySelector('[data-nf-preloader-water]');
    this.logo = section.querySelector('[data-nf-preloader-logo]');
    this.pctEl = section.querySelector('[data-nf-preloader-pct]');
    this.scrollZoom = section.getAttribute('data-scroll-zoom') === 'true';
    this.loaderEnabled =
      section.getAttribute('data-loader-enabled') !== 'false' &&
      this.preloader &&
      !motionOff;
    this.loaderDuration =
      (parseFloat(section.getAttribute('data-loader-duration')) || 5.6) * 1000;
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

    if (this.loaderEnabled) {
      this.runLoader(function () {
        self.afterLoader();
      });
    } else {
      this.finishLoaderVisual();
      this.afterLoader();
    }
  }

  Intro.prototype.afterLoader = function () {
    this.restartAutoplay();
    if (!this.scrollZoom || motionOff || !hasGsap) {
      this.showStatic();
      return;
    }
    var self = this;
    requestAnimationFrame(function () {
      self.buildTimeline();
      ScrollTrigger.refresh();
      self.autoScroll();
    });
  };

  Intro.prototype.setPct = function (n) {
    if (this.pctEl) this.pctEl.textContent = Math.round(n) + '%';
  };

  Intro.prototype.finishLoaderVisual = function () {
    this.section.classList.remove('is-loading');
    document.documentElement.classList.remove('bf-loader-active');
    if (this.preloader) {
      this.preloader.classList.add('is-done');
      this.preloader.style.pointerEvents = 'none';
      var pre = this.preloader;
      setTimeout(function () {
        if (pre) pre.style.display = 'none';
      }, 400);
    }
  };

  Intro.prototype.runLoader = function (done) {
    var self = this;
    this.section.classList.add('is-loading');
    document.documentElement.classList.add('bf-loader-active');
    var start = performance.now();
    var fillMs = this.loaderDuration * 0.82;
    var holdMs = this.loaderDuration * 0.06;
    var zoomMs = this.loaderDuration * 0.12;

    function frame(now) {
      var elapsed = now - start;
      if (elapsed < fillMs) {
        var t = elapsed / fillMs;
        var ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
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
        var scale = 1 + ze * 32;
        var opacity = 1 - Math.max(0, (z - 0.4) / 0.6);
        if (self.logo) self.logo.style.transform = 'scale(' + scale + ')';
        if (self.preloader) self.preloader.style.opacity = String(Math.max(0, opacity));
        requestAnimationFrame(frame);
        return;
      }

      self.finishLoaderVisual();
      if (done) done();
    }

    requestAnimationFrame(frame);
  };

  Intro.prototype.showStatic = function () {
    if (this.mask && hasGsap) gsap.set(this.mask, { opacity: 0, visibility: 'hidden' });
    else if (this.mask) {
      this.mask.style.opacity = '0';
      this.mask.style.visibility = 'hidden';
    }
    if (this.copy && hasGsap) gsap.set(this.copy, { opacity: 1, pointerEvents: 'auto' });
    else if (this.copy) {
      this.copy.style.opacity = '1';
      this.copy.style.pointerEvents = 'auto';
    }
    if (this.copyParts.length && hasGsap) gsap.set(this.copyParts, { opacity: 1, y: 0 });
    if (this.hint && hasGsap) gsap.set(this.hint, { opacity: 0 });
    else if (this.hint) this.hint.style.opacity = '0';
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
    if (!hasGsap || !this.track || !this.mask) return;
    var self = this;
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
          self.section.classList.toggle('is-copy-in', p > 0.72);
          self.section.classList.toggle('is-done', p > 0.92);
        }
      }
    });
    this.st = this.tl.scrollTrigger;

    this.tl.to(this.mask, { scale: this.endScale, duration: 0.7 }, 0);
    this.tl.to(this.mask, { opacity: 0, duration: 0.18 }, 0.62);
    if (this.hint) this.tl.to(this.hint, { opacity: 0, duration: 0.15 }, 0.55);
    if (this.copy) this.tl.set(this.copy, { pointerEvents: 'auto' }, 0.72);
    this.tl.to(this.copyParts, { opacity: 1, y: 0, stagger: 0.04, duration: 0.2 }, 0.72);
  };

  Intro.prototype.autoScroll = function () {
    if (!hasGsap || !this.scrollZoom) return;
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

  Intro.prototype.destroy = function () {
    if (this.timer) clearInterval(this.timer);
    if (this.autoScrollTimer) clearTimeout(this.autoScrollTimer);
    if (this.autoScrollTween) this.autoScrollTween.kill();
    if (this.tl) this.tl.kill();
    if (this.st) this.st.kill();
  };

  function init(scope) {
    scope.querySelectorAll('[data-nf-intro]').forEach(function (el) {
      instances.push(new Intro(el));
    });
    if (hasGsap) ScrollTrigger.refresh();
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
      var slide = block.closest('[data-nf-intro-slide]') || block.querySelector('[data-nf-intro-slide]');
      if (slide && slide.dataset.index != null) inst.setSlide(parseInt(slide.dataset.index, 10) || 0);
    });
  });
})();
