(function () {
  var instances = new WeakMap();

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function Slider(root) {
    this.root = root;
    this.copySlides = Array.prototype.slice.call(root.querySelectorAll('[data-nf-pls-copy-slide]'));
    this.stages = Array.prototype.slice.call(root.querySelectorAll('[data-nf-pls-stage]'));
    this.prevBtn = root.querySelector('[data-nf-pls-prev]');
    this.nextBtn = root.querySelector('[data-nf-pls-next]');
    this.currentEl = root.querySelector('[data-nf-pls-current]');
    this.totalEl = root.querySelector('[data-nf-pls-total]');
    this.count = Math.max(this.copySlides.length, this.stages.length);
    this.index = 0;
    this.timer = null;
    this.autoplayMs = parseInt(root.dataset.autoplayMs || '0', 10) || 0;

    if (this.count < 1) return;

    if (prefersReducedMotion()) {
      this.root.classList.add('nf-pls--reduced-motion');
      this.autoplayMs = 0;
    }

    if (this.totalEl) this.totalEl.textContent = pad2(this.count);

    var self = this;
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', function () {
        self.go(self.index - 1);
        self.restartAutoplay();
      });
    }
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', function () {
        self.go(self.index + 1);
        self.restartAutoplay();
      });
    }

    this.root.addEventListener('mouseenter', function () {
      self.stopAutoplay();
    });
    this.root.addEventListener('mouseleave', function () {
      self.startAutoplay();
    });
    this.root.addEventListener('focusin', function () {
      self.stopAutoplay();
    });
    this.root.addEventListener('focusout', function (event) {
      if (!self.root.contains(event.relatedTarget)) self.startAutoplay();
    });

    this.root.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        self.go(self.index - 1);
        self.restartAutoplay();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        self.go(self.index + 1);
        self.restartAutoplay();
      }
    });

    this.go(0, true);
    this.startAutoplay();
  }

  Slider.prototype.go = function (nextIndex, instant) {
    if (this.count < 1) return;
    var next = ((nextIndex % this.count) + this.count) % this.count;
    this.index = next;

    var self = this;
    this.copySlides.forEach(function (slide, i) {
      var active = i === self.index;
      slide.classList.toggle('is-active', active);
      if (active) slide.removeAttribute('hidden');
      else slide.setAttribute('hidden', '');
    });

    this.stages.forEach(function (stage, i) {
      stage.classList.remove('is-active', 'is-prev', 'is-peek');
      if (i === self.index) {
        stage.classList.add('is-active');
      } else if (i === (self.index - 1 + self.count) % self.count && self.count > 1) {
        stage.classList.add('is-prev');
      } else if (i === (self.index + 1) % self.count && self.count > 1) {
        stage.classList.add('is-peek');
      }
    });

    if (this.currentEl) this.currentEl.textContent = pad2(this.index + 1);
    if (instant) {
      /* no-op: CSS handles transitions; reduced-motion class disables them */
    }
  };

  Slider.prototype.startAutoplay = function () {
    var self = this;
    this.stopAutoplay();
    if (this.autoplayMs <= 0 || this.count < 2) return;
    this.timer = window.setInterval(function () {
      self.go(self.index + 1);
    }, this.autoplayMs);
  };

  Slider.prototype.stopAutoplay = function () {
    if (this.timer) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  };

  Slider.prototype.restartAutoplay = function () {
    this.stopAutoplay();
    this.startAutoplay();
  };

  Slider.prototype.destroy = function () {
    this.stopAutoplay();
  };

  function init(root) {
    if (!root || instances.has(root)) return;
    var slider = new Slider(root);
    instances.set(root, slider);
  }

  function destroy(root) {
    var slider = instances.get(root);
    if (!slider) return;
    slider.destroy();
    instances.delete(root);
  }

  function initAll(scope) {
    var container = scope || document;
    container.querySelectorAll('[data-nf-pls]').forEach(init);
  }

  function boot() {
    initAll();

    document.addEventListener('shopify:section:load', function (event) {
      var root = event.target.querySelector('[data-nf-pls]');
      if (!root) return;
      destroy(root);
      init(root);
    });

    document.addEventListener('shopify:section:unload', function (event) {
      var root = event.target.querySelector('[data-nf-pls]');
      if (root) destroy(root);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
