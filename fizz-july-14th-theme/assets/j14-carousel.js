/*
  July 14th theme — scroll-snap carousel with pointer drag.
  Used by the colorways section ([data-j14-carousel]) and any rail
  marked with [data-j14-rail].
*/
(function () {
  'use strict';

  function Carousel(section) {
    this.section = section;
    this.rail = section.querySelector('[data-j14-rail]');
    this.slides = Array.prototype.slice.call(section.querySelectorAll('[data-j14-slide]'));
    this.dotsWrap = section.querySelector('[data-j14-dots]');
    this.syncScene = section.dataset.syncScene === 'true';
    this.active = -1;
    if (!this.rail || !this.slides.length) return;

    this.buildDots();
    this.bindArrows();
    this.bindDrag();

    var self = this;
    this.rail.addEventListener(
      'scroll',
      function () {
        window.requestAnimationFrame(function () {
          self.detectActive();
        });
      },
      { passive: true }
    );
    window.addEventListener(
      'resize',
      function () {
        self.detectActive();
      },
      { passive: true }
    );
    this.setActive(0, false);
  }

  Carousel.prototype.buildDots = function () {
    if (!this.dotsWrap) return;
    var self = this;
    this.dotsWrap.innerHTML = '';
    this.slides.forEach(function (slide, i) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'j14-ways__dot';
      dot.setAttribute('aria-label', 'Slide ' + (i + 1));
      var swatch = slide.dataset.swatch;
      if (swatch) dot.style.setProperty('--dot-color', swatch);
      dot.addEventListener('click', function () {
        self.scrollTo(i);
      });
      self.dotsWrap.appendChild(dot);
    });
    this.dots = Array.prototype.slice.call(this.dotsWrap.children);
  };

  Carousel.prototype.bindArrows = function () {
    var self = this;
    var prev = this.section.querySelector('[data-j14-prev]');
    var next = this.section.querySelector('[data-j14-next]');
    if (prev)
      prev.addEventListener('click', function () {
        self.scrollTo(Math.max(0, self.active - 1));
      });
    if (next)
      next.addEventListener('click', function () {
        self.scrollTo(Math.min(self.slides.length - 1, self.active + 1));
      });
  };

  Carousel.prototype.bindDrag = function () {
    var rail = this.rail;
    var isDown = false;
    var startX = 0;
    var startScroll = 0;
    var moved = false;

    rail.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return; /* touch already scrolls natively */
      isDown = true;
      moved = false;
      startX = e.clientX;
      startScroll = rail.scrollLeft;
      rail.classList.add('is-dragging');
    });
    window.addEventListener('pointermove', function (e) {
      if (!isDown) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      rail.scrollLeft = startScroll - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!isDown) return;
      isDown = false;
      rail.classList.remove('is-dragging');
    });
    rail.addEventListener(
      'click',
      function (e) {
        if (moved) {
          e.preventDefault();
          moved = false;
        }
      },
      true
    );
    rail.addEventListener('keydown', function (e) {
      var section = rail.closest('[data-j14-carousel]');
      if (!section) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        var next = section.querySelector('[data-j14-next]');
        if (next) next.click();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        var prev = section.querySelector('[data-j14-prev]');
        if (prev) prev.click();
      }
    });
  };

  Carousel.prototype.detectActive = function () {
    var railRect = this.rail.getBoundingClientRect();
    var center = railRect.left + railRect.width / 2;
    var best = 0;
    var bestDist = Infinity;
    this.slides.forEach(function (slide, i) {
      var rect = slide.getBoundingClientRect();
      var dist = Math.abs(rect.left + rect.width / 2 - center);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    this.setActive(best, false);
  };

  Carousel.prototype.scrollTo = function (index) {
    var slide = this.slides[index];
    if (!slide) return;
    var offset = slide.offsetLeft - (this.rail.clientWidth - slide.clientWidth) / 2;
    this.rail.scrollTo({ left: offset, behavior: 'smooth' });
    this.setActive(index, true);
  };

  Carousel.prototype.setActive = function (index, force) {
    if (index === this.active && !force) return;
    this.active = index;
    this.slides.forEach(function (slide, i) {
      slide.classList.toggle('is-active', i === index);
    });
    if (this.dots) {
      this.dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === index);
      });
    }
    if (this.syncScene) {
      var data = this.slides[index].dataset;
      var style = this.section.style;
      if (data.bg) style.setProperty('--ways-bg', data.bg);
      if (data.bgEnd) style.setProperty('--ways-bg-end', data.bgEnd);
      if (data.btn) style.setProperty('--ways-btn', data.btn);
      if (data.btnText) style.setProperty('--ways-btn-text', data.btnText);
      if (data.text) style.setProperty('--ways-text', data.text);
    }
  };

  var instances = [];

  function init(scope) {
    scope.querySelectorAll('[data-j14-carousel]').forEach(function (el) {
      instances.push(new Carousel(el));
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
    instances = instances.filter(function (c) {
      return !event.target.contains(c.section);
    });
    init(event.target);
  });
})();
