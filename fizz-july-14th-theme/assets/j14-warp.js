/*
  July 14th — warp colorways slider.
  Flat translateX track + SVG wave overlays (Webflow warp-slider silhouette).
  Drag 1:1, snap on release, infinite loop via clones.
*/
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var motionOff = document.documentElement.classList.contains('j14-no-motion') || reduced;

  function Warp(section) {
    this.section = section;
    this.viewport = section.querySelector('.j14-warp__viewport');
    this.track = section.querySelector('[data-j14-warp-track]');
    this.caption = {
      name: section.querySelector('[data-j14-warp-name]'),
      price: section.querySelector('[data-j14-warp-price]'),
      cta: section.querySelector('[data-j14-warp-cta]')
    };
    this.syncScene = section.dataset.syncScene === 'true';
    this.x = 0;
    this.index = 0;
    this.slideStride = 0;
    this.count = 0;
    this.clones = 0;
    this.dragging = false;
    this.startX = 0;
    this.startTx = 0;
    this.lastX = 0;
    this.lastT = 0;
    this.velocity = 0;
    this.moved = false;
    this.raf = 0;
    this._onMove = this.onMove.bind(this);
    this._onUp = this.onUp.bind(this);
    this._onResize = this.onResize.bind(this);

    if (!this.track || !this.viewport) return;

    this.originalSlides = Array.prototype.slice.call(
      this.track.querySelectorAll('[data-j14-warp-slide]:not([data-clone])')
    );
    this.count = this.originalSlides.length;
    if (!this.count) return;

    this.buildDots();
    this.bindControls();
    this.setupLoop();
    this.measure();
    this.goTo(0, false);
    this.bindDrag();
    window.addEventListener('resize', this._onResize, { passive: true });
  }

  Warp.prototype.setupLoop = function () {
    /* Remove prior clones (theme editor reload) */
    this.track.querySelectorAll('[data-clone]').forEach(function (el) {
      el.remove();
    });

    this.clones = Math.min(3, this.count);
    var self = this;
    var prefix = [];
    var suffix = [];
    for (var i = 0; i < this.clones; i++) {
      var head = this.originalSlides[this.count - this.clones + i];
      var tail = this.originalSlides[i];
      if (head) {
        var c1 = head.cloneNode(true);
        c1.setAttribute('data-clone', 'pre');
        c1.classList.remove('is-active');
        prefix.push(c1);
      }
      if (tail) {
        var c2 = tail.cloneNode(true);
        c2.setAttribute('data-clone', 'post');
        c2.classList.remove('is-active');
        suffix.push(c2);
      }
    }
    prefix.forEach(function (node) {
      self.track.insertBefore(node, self.track.firstChild);
    });
    suffix.forEach(function (node) {
      self.track.appendChild(node);
    });
  };

  Warp.prototype.slides = function () {
    return Array.prototype.slice.call(this.track.querySelectorAll('[data-j14-warp-slide]'));
  };

  Warp.prototype.realSlideAt = function (index) {
    return this.originalSlides[((index % this.count) + this.count) % this.count];
  };

  Warp.prototype.measure = function () {
    var slide = this.track.querySelector('[data-j14-warp-slide][data-index="0"]:not([data-clone])');
    if (!slide) slide = this.realSlideAt(0);
    if (!slide) return;
    var style = window.getComputedStyle(this.track);
    var gap = parseFloat(style.columnGap || style.gap) || 0;
    this.slideStride = slide.getBoundingClientRect().width + gap;
  };

  Warp.prototype.offsetForIndex = function (index) {
    var viewportW = this.viewport.clientWidth;
    var el = this.track.querySelector(
      '[data-j14-warp-slide][data-index="' + (((index % this.count) + this.count) % this.count) + '"]:not([data-clone])'
    );
    var slideW = el ? el.getBoundingClientRect().width : this.slideStride;
    var centerPad = (viewportW - slideW) / 2;
    return -(this.clones + index) * this.slideStride + centerPad;
  };

  Warp.prototype.applyX = function (x) {
    this.x = x;
    this.track.style.transform = 'translate3d(' + x.toFixed(2) + 'px, 0, 0)';
  };

  Warp.prototype.normalizeLoop = function () {
    if (!this.slideStride || this.count < 2) return;
    var min = this.offsetForIndex(0) - this.slideStride * 0.5;
    var max = this.offsetForIndex(this.count - 1) + this.slideStride * 0.5;
    if (this.x > min + this.slideStride * this.clones) {
      this.applyX(this.x - this.count * this.slideStride);
    } else if (this.x < max - this.slideStride * this.clones) {
      this.applyX(this.x + this.count * this.slideStride);
    }
  };

  Warp.prototype.nearestIndex = function () {
    if (!this.slideStride) return 0;
    var best = 0;
    var bestDist = Infinity;
    for (var i = 0; i < this.count; i++) {
      var target = this.offsetForIndex(i);
      var dist = Math.abs(this.x - target);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    }
    return best;
  };

  Warp.prototype.goTo = function (index, animate) {
    index = ((index % this.count) + this.count) % this.count;
    this.index = index;
    this.measure();
    var target = this.offsetForIndex(index);
    if (animate && !motionOff) {
      this.animateTo(target);
    } else {
      this.applyX(target);
    }
    this.setActive(index);
  };

  Warp.prototype.animateTo = function (target) {
    var self = this;
    var start = this.x;
    var dist = target - start;
    if (Math.abs(dist) < 0.5) {
      this.applyX(target);
      return;
    }
    var duration = motionOff ? 1 : Math.min(520, 280 + Math.abs(dist) * 0.35);
    var t0 = performance.now();
    if (this.raf) cancelAnimationFrame(this.raf);
    function frame(now) {
      var p = Math.min(1, (now - t0) / duration);
      var eased = 1 - Math.pow(1 - p, 3);
      self.applyX(start + dist * eased);
      if (p < 1) {
        self.raf = requestAnimationFrame(frame);
      } else {
        self.raf = 0;
        self.applyX(target);
        self.normalizeLoop();
      }
    }
    this.raf = requestAnimationFrame(frame);
  };

  Warp.prototype.setActive = function (index) {
    var self = this;
    this.slides().forEach(function (slide) {
      var real = parseInt(slide.getAttribute('data-index'), 10);
      slide.classList.toggle('is-active', real === index);
    });
    if (this.dots) {
      this.dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === index);
      });
    }
    var info = this.realSlideAt(index).dataset;
    if (this.caption.name) this.caption.name.textContent = info.name || '';
    if (this.caption.price) {
      if (info.price) {
        this.caption.price.textContent = info.price;
        this.caption.price.hidden = false;
      } else {
        this.caption.price.textContent = '';
        this.caption.price.hidden = true;
      }
    }
    if (this.caption.cta && info.href) this.caption.cta.setAttribute('href', info.href);
    if (this.syncScene) {
      var data = this.realSlideAt(index).dataset;
      var style = this.section.style;
      if (data.bg) style.setProperty('--ways-bg', data.bg);
      if (data.bgEnd) style.setProperty('--ways-bg-end', data.bgEnd);
      if (data.btn) style.setProperty('--ways-btn', data.btn);
      if (data.btnText) style.setProperty('--ways-btn-text', data.btnText);
      if (data.text) style.setProperty('--ways-text', data.text);
    }
  };

  Warp.prototype.buildDots = function () {
    this.dotsWrap = this.section.querySelector('[data-j14-warp-dots]');
    if (!this.dotsWrap) return;
    var self = this;
    this.dotsWrap.innerHTML = '';
    this.originalSlides.forEach(function (slide, i) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'j14-warp__dot';
      dot.setAttribute('aria-label', 'Color ' + (i + 1));
      if (slide.dataset.swatch) dot.style.setProperty('--dot-color', slide.dataset.swatch);
      dot.addEventListener('click', function () {
        self.goTo(i, true);
      });
      self.dotsWrap.appendChild(dot);
    });
    this.dots = Array.prototype.slice.call(this.dotsWrap.children);
  };

  Warp.prototype.bindControls = function () {
    var self = this;
    var prev = this.section.querySelector('[data-j14-warp-prev]');
    var next = this.section.querySelector('[data-j14-warp-next]');
    if (prev)
      prev.addEventListener('click', function () {
        self.goTo(self.index - 1, true);
      });
    if (next)
      next.addEventListener('click', function () {
        self.goTo(self.index + 1, true);
      });
    this.track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        self.goTo(self.index + 1, true);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        self.goTo(self.index - 1, true);
      }
    });
  };

  Warp.prototype.bindDrag = function () {
    var self = this;
    this.viewport.addEventListener('pointerdown', function (e) {
      if (e.button != null && e.button !== 0) return;
      self.dragging = true;
      self.moved = false;
      self.startX = e.clientX;
      self.startTx = self.x;
      self.lastX = e.clientX;
      self.lastT = performance.now();
      self.velocity = 0;
      self.section.classList.add('is-dragging');
      if (self.raf) cancelAnimationFrame(self.raf);
      try {
        self.viewport.setPointerCapture(e.pointerId);
      } catch (err) {}
      window.addEventListener('pointermove', self._onMove, { passive: false });
      window.addEventListener('pointerup', self._onUp);
      window.addEventListener('pointercancel', self._onUp);
    });
    this.viewport.addEventListener(
      'click',
      function (e) {
        if (self.moved) {
          e.preventDefault();
          e.stopPropagation();
          self.moved = false;
        }
      },
      true
    );
  };

  Warp.prototype.onMove = function (e) {
    if (!this.dragging) return;
    e.preventDefault();
    var dx = e.clientX - this.startX;
    if (Math.abs(dx) > 4) this.moved = true;
    var now = performance.now();
    var dt = Math.max(1, now - this.lastT);
    this.velocity = ((e.clientX - this.lastX) / dt) * 16;
    this.lastX = e.clientX;
    this.lastT = now;
    this.applyX(this.startTx + dx);
  };

  Warp.prototype.onUp = function () {
    if (!this.dragging) return;
    this.dragging = false;
    this.section.classList.remove('is-dragging');
    window.removeEventListener('pointermove', this._onMove);
    window.removeEventListener('pointerup', this._onUp);
    window.removeEventListener('pointercancel', this._onUp);

    this.normalizeLoop();
    var base = this.nearestIndex();
    var idx = base;
    if (!motionOff && Math.abs(this.velocity) > 1.2) {
      idx = this.velocity < 0 ? base + 1 : base - 1;
    }
    this.goTo(idx, true);
  };

  Warp.prototype.onResize = function () {
    this.measure();
    this.goTo(this.index, false);
  };

  Warp.prototype.destroy = function () {
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('pointermove', this._onMove);
    window.removeEventListener('pointerup', this._onUp);
    if (this.raf) cancelAnimationFrame(this.raf);
  };

  var instances = [];

  function init(scope) {
    scope.querySelectorAll('[data-j14-warp]').forEach(function (el) {
      instances.push(new Warp(el));
    });
  }

  function destroyIn(scope) {
    instances = instances.filter(function (inst) {
      if (scope.contains(inst.section)) {
        inst.destroy();
        return false;
      }
      return true;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      init(document);
    });
  } else {
    init(document);
  }

  document.addEventListener('shopify:section:load', function (event) {
    destroyIn(event.target);
    init(event.target);
  });
  document.addEventListener('shopify:section:unload', function (event) {
    destroyIn(event.target);
  });
})();
