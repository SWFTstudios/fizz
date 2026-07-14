/*
  July 14th theme — mosaic + sticky how scroll engine.
  Intro expand is handled by j14-intro.js (GSAP ScrollTrigger).
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

  function trackProgress(track) {
    var rect = track.getBoundingClientRect();
    var total = rect.height - window.innerHeight;
    if (total <= 0) return rect.top < 0 ? 1 : 0;
    return clamp(-rect.top / total, 0, 1);
  }

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
    var rect = this.section.getBoundingClientRect();
    var vh = window.innerHeight;
    var enter = clamp((vh - rect.top) / (vh * 0.9), 0, 1);
    var lift = (1 - easeOutCubic(enter)) * Math.min(vh * 0.22, 260);
    this.grid.style.transform = 'translateY(' + lift.toFixed(1) + 'px)';
  };

  MosaicController.prototype.destroy = function () {
    if (this.observer) this.observer.disconnect();
  };

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

  var controllers = [];

  function initScope(scope) {
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
      if (ctrl instanceof HowController) {
        var idx = ctrl.steps.indexOf(block.closest('[data-j14-how-step]'));
        if (idx >= 0) ctrl.setActive(idx);
      }
    });
  });
})();
