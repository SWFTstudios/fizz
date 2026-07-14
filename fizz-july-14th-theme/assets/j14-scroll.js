/*
  July 14th theme — shared scroll engine.
  Powers: intro window expansion, mosaic slide-up, sticky how-to step transitions.
  One rAF loop, passive listeners, disabled for prefers-reduced-motion / theme setting.
*/
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var motionOff = document.documentElement.classList.contains('j14-no-motion') || reduced;
  if (reduced) document.documentElement.classList.add('j14-no-motion');

  var clamp = function (v, min, max) {
    return Math.min(max, Math.max(min, v));
  };
  var easeOutCubic = function (t) {
    return 1 - Math.pow(1 - t, 3);
  };

  /* Progress of a track element: 0 when its top hits the viewport top,
     1 when its bottom reaches the viewport bottom. */
  function trackProgress(track) {
    var rect = track.getBoundingClientRect();
    var total = rect.height - window.innerHeight;
    if (total <= 0) return rect.top < 0 ? 1 : 0;
    return clamp(-rect.top / total, 0, 1);
  }

  /* ---------------- Intro ---------------- */

  function IntroController(section) {
    this.section = section;
    this.track = section.querySelector('[data-j14-intro-track]');
    this.windowEl = section.querySelector('[data-j14-intro-window]');
    this.left = section.querySelector('[data-j14-intro-left]');
    this.right = section.querySelector('[data-j14-intro-right]');
    this.hint = section.querySelector('[data-j14-intro-hint]');
    this.slides = Array.prototype.slice.call(section.querySelectorAll('[data-j14-intro-slide]'));
    this.thumbs = Array.prototype.slice.call(section.querySelectorAll('[data-j14-intro-thumb]'));
    this.active = 0;
    this.timer = null;

    var self = this;
    this.thumbs.forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        self.setSlide(parseInt(thumb.dataset.index, 10) || 0);
        self.restartAutoplay();
      });
    });
    this.restartAutoplay();
  }

  IntroController.prototype.setSlide = function (index) {
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

  IntroController.prototype.restartAutoplay = function () {
    var interval = parseInt(this.section.dataset.autoplayInterval, 10) || 0;
    if (this.timer) clearInterval(this.timer);
    if (!interval || this.slides.length < 2 || motionOff) return;
    var self = this;
    this.timer = setInterval(function () {
      self.setSlide(self.active + 1);
    }, interval * 1000);
  };

  IntroController.prototype.update = function () {
    if (!this.track || !this.windowEl || motionOff) return;
    var p = trackProgress(this.track);

    /* Window expansion: base size -> cover viewport. */
    var zoomP = easeOutCubic(clamp(p / 0.85, 0, 1));
    var baseW = this.windowEl.offsetWidth || 1;
    var baseH = this.windowEl.offsetHeight || 1;
    var targetScale = Math.max(window.innerWidth / baseW, window.innerHeight / baseH) * 1.02;
    var scale = 1 + (targetScale - 1) * zoomP;
    this.windowEl.style.transform = 'scale(' + scale.toFixed(4) + ')';

    /* Letters slide outward and fade. */
    var shift = zoomP * window.innerWidth * 0.6;
    var fade = 1 - clamp((p - 0.25) / 0.35, 0, 1);
    if (this.left) {
      this.left.style.transform = 'translateX(' + (-shift).toFixed(1) + 'px)';
      this.left.style.opacity = fade;
    }
    if (this.right) {
      this.right.style.transform = 'translateX(' + shift.toFixed(1) + 'px)';
      this.right.style.opacity = fade;
    }
    if (this.hint) {
      this.hint.style.opacity = 1 - clamp(p / 0.08, 0, 1);
    }

    this.section.classList.toggle('is-zoomed', p > 0.7);
    this.section.classList.toggle('is-done', p >= 0.995);
  };

  IntroController.prototype.destroy = function () {
    if (this.timer) clearInterval(this.timer);
  };

  /* ---------------- Mosaic ---------------- */

  function MosaicController(section) {
    this.section = section;
    this.grid = section.querySelector('[data-j14-mosaic-grid]');
    var tiles = section.querySelectorAll('[data-j14-tile]');
    tiles.forEach(function (tile, i) {
      tile.style.setProperty('--tile-index', i % 12);
    });
    if ('IntersectionObserver' in window && !motionOff) {
      this.observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) entry.target.classList.add('is-in');
          });
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.1 }
      );
      var obs = this.observer;
      tiles.forEach(function (tile) {
        obs.observe(tile);
      });
    } else {
      tiles.forEach(function (tile) {
        tile.classList.add('is-in');
      });
    }
  }

  MosaicController.prototype.update = function () {
    if (!this.grid || motionOff) return;
    /* Slide the whole grid up from below as the section enters the viewport. */
    var rect = this.section.getBoundingClientRect();
    var vh = window.innerHeight;
    var enter = clamp((vh - rect.top) / (vh * 0.9), 0, 1);
    var lift = (1 - easeOutCubic(enter)) * Math.min(vh * 0.22, 260);
    this.grid.style.transform = 'translateY(' + lift.toFixed(1) + 'px)';
  };

  MosaicController.prototype.destroy = function () {
    if (this.observer) this.observer.disconnect();
  };

  /* ---------------- Sticky How ---------------- */

  function HowController(section) {
    this.section = section;
    this.track = section.querySelector('[data-j14-how-track]');
    this.layers = Array.prototype.slice.call(section.querySelectorAll('[data-j14-how-layer]'));
    this.steps = Array.prototype.slice.call(section.querySelectorAll('[data-j14-how-step]'));
    this.counter = section.querySelector('[data-j14-how-counter]');
    this.active = -1;
    this.setActive(0);
  }

  HowController.prototype.setActive = function (index) {
    index = clamp(index, 0, Math.max(this.layers.length - 1, 0));
    if (index === this.active) return;
    var prev = this.active;
    this.active = index;
    this.layers.forEach(function (layer, i) {
      layer.classList.toggle('is-active', i === index);
      layer.classList.toggle('is-prev', i === prev && prev < index);
    });
    this.steps.forEach(function (step, i) {
      step.classList.toggle('is-active', i === index);
    });
    if (this.counter) {
      this.counter.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(this.layers.length).padStart(2, '0');
    }
  };

  HowController.prototype.update = function () {
    if (!this.track || !this.layers.length) return;
    var p = trackProgress(this.track);
    this.section.style.setProperty('--how-progress', p.toFixed(4));
    if (motionOff) return;
    var index = Math.min(this.layers.length - 1, Math.floor(p * this.layers.length));
    this.setActive(index);
  };

  HowController.prototype.destroy = function () {};

  /* ---------------- Registry + loop ---------------- */

  var controllers = [];

  function initScope(scope) {
    scope.querySelectorAll('[data-j14-intro]').forEach(function (el) {
      controllers.push(new IntroController(el));
    });
    scope.querySelectorAll('[data-j14-mosaic]').forEach(function (el) {
      controllers.push(new MosaicController(el));
    });
    scope.querySelectorAll('[data-j14-how]').forEach(function (el) {
      controllers.push(new HowController(el));
    });
    render();
  }

  function destroyScope(scope) {
    controllers = controllers.filter(function (ctrl) {
      if (scope.contains(ctrl.section)) {
        ctrl.destroy();
        return false;
      }
      return true;
    });
  }

  var ticking = false;
  function render() {
    controllers.forEach(function (ctrl) {
      if (ctrl.update) ctrl.update();
    });
    ticking = false;
  }
  function requestRender() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(render);
    }
  }

  window.addEventListener('scroll', requestRender, { passive: true });
  window.addEventListener('resize', requestRender, { passive: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initScope(document);
    });
  } else {
    initScope(document);
  }

  /* Theme editor support */
  document.addEventListener('shopify:section:load', function (event) {
    destroyScope(event.target);
    initScope(event.target);
  });
  document.addEventListener('shopify:section:unload', function (event) {
    destroyScope(event.target);
  });
  document.addEventListener('shopify:block:select', function (event) {
    var block = event.target;
    controllers.forEach(function (ctrl) {
      if (!ctrl.section.contains(block)) return;
      if (ctrl instanceof IntroController) {
        var slide = block.closest('[data-j14-intro-slide]') || block.querySelector('[data-j14-intro-slide]');
        if (slide) ctrl.setSlide(parseInt(slide.dataset.index, 10) || 0);
      }
      if (ctrl instanceof HowController) {
        var idx = ctrl.steps.indexOf(block.closest('[data-j14-how-step]'));
        if (idx >= 0) ctrl.setActive(idx);
      }
    });
  });
})();
