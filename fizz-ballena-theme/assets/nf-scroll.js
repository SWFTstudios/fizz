/*
  July 14th theme — mosaic + sticky how scroll engine.
  Intro expand is handled by nf-intro.js (GSAP ScrollTrigger).
*/
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var motionOff = document.documentElement.classList.contains('nf-no-motion') || reduced;
  if (reduced) document.documentElement.classList.add('nf-no-motion');

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
    this.grid = section.querySelector('[data-nf-mosaic-grid]');
    var tiles = section.querySelectorAll('[data-nf-tile]');
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
    this.track = section.querySelector('[data-nf-how-track]');
    this.layers = Array.prototype.slice.call(section.querySelectorAll('[data-nf-how-layer]'));
    this.steps = Array.prototype.slice.call(section.querySelectorAll('[data-nf-how-step]'));
    this.counter = section.querySelector('[data-nf-how-counter]');
    this.active = -1;
    this.lockUntil = 0;
    this.lockedIndex = 0;
    this.onTriggerClick = this.onTriggerClick.bind(this);
    this.bindTriggers();
    this.setActive(0);
  }

  HowController.prototype.bindTriggers = function () {
    var self = this;
    this.steps.forEach(function (step, i) {
      var trigger = step.querySelector('[data-nf-how-goto]');
      if (!trigger) return;
      trigger.setAttribute('data-nf-how-index', String(i));
      trigger.addEventListener('click', self.onTriggerClick);
    });
  };

  HowController.prototype.onTriggerClick = function (event) {
    var trigger = event.currentTarget;
    var index = parseInt(trigger.getAttribute('data-nf-how-index') || '0', 10);
    this.goTo(index);
  };

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
      var isActive = i === index;
      step.classList.toggle('is-active', isActive);
      var trigger = step.querySelector('[data-nf-how-goto]');
      if (trigger) trigger.setAttribute('aria-current', isActive ? 'true' : 'false');
    });
    if (this.counter) {
      this.counter.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(this.layers.length).padStart(2, '0');
    }
  };

  HowController.prototype.goTo = function (index) {
    index = clamp(index, 0, Math.max(this.layers.length - 1, 0));
    this.setActive(index);

    if (motionOff) {
      var step = this.steps[index];
      if (step && typeof step.scrollIntoView === 'function') {
        step.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' });
      }
      return;
    }

    if (!this.track || !this.layers.length) return;

    var total = this.track.offsetHeight - window.innerHeight;
    if (total <= 0) return;

    var progress = (index + 0.5) / this.layers.length;
    var trackTop = this.track.getBoundingClientRect().top + window.pageYOffset;
    var targetY = trackTop + progress * total;

    this.lockedIndex = index;
    this.lockUntil = performance.now() + 900;
    window.scrollTo({ top: targetY, behavior: reduced ? 'auto' : 'smooth' });
  };

  HowController.prototype.update = function () {
    if (!this.track || !this.layers.length) return;
    var p = trackProgress(this.track);
    this.section.style.setProperty('--how-progress', p.toFixed(4));
    if (motionOff) return;
    if (this.lockUntil && performance.now() < this.lockUntil) {
      this.setActive(this.lockedIndex);
      return;
    }
    this.lockUntil = 0;
    var index = Math.min(this.layers.length - 1, Math.floor(p * this.layers.length));
    this.setActive(index);
  };

  HowController.prototype.destroy = function () {
    var self = this;
    this.steps.forEach(function (step) {
      var trigger = step.querySelector('[data-nf-how-goto]');
      if (trigger) trigger.removeEventListener('click', self.onTriggerClick);
    });
  };

  var controllers = [];

  function initScope(scope) {
    scope.querySelectorAll('[data-nf-mosaic]').forEach(function (el) {
      controllers.push(new MosaicController(el));
    });
    scope.querySelectorAll('[data-nf-how]').forEach(function (el) {
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
        var idx = ctrl.steps.indexOf(block.closest('[data-nf-how-step]'));
        if (idx >= 0) ctrl.goTo(idx);
      }
    });
  });
})();
