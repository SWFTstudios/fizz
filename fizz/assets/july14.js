/*
  July 14 homepage helpers — scroll-linked colorway stepping (desktop)
  and reduced-motion awareness. Carousel, intro, and mosaic live in
  july14-carousel.js / july14-intro.js / july14-scroll.js.
*/
(function () {
  'use strict';

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function ColorwayScrollPin(section) {
    this.section = section;
    this.rail = section.querySelector('[data-j14-rail]');
    this.slides = Array.prototype.slice.call(section.querySelectorAll('[data-j14-slide]'));
    this.scrollPer = parseFloat(section.dataset.scrollPer || '100') || 100;
    if (!this.rail || this.slides.length < 2 || prefersReducedMotion()) return;
    if (window.innerWidth < 750) return;
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    var self = this;
    gsap.registerPlugin(ScrollTrigger);
    this.st = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: function () {
        return '+=' + self.slides.length * self.scrollPer + '%';
      },
      pin: true,
      scrub: 0.35,
      onUpdate: function (selfTrig) {
        var idx = Math.min(
          self.slides.length - 1,
          Math.floor(selfTrig.progress * self.slides.length)
        );
        var slide = self.slides[idx];
        if (!slide) return;
        var offset = slide.offsetLeft - (self.rail.clientWidth - slide.clientWidth) / 2;
        self.rail.scrollLeft = offset;
        var event = new CustomEvent('july14:colorway-index', { detail: { index: idx } });
        section.dispatchEvent(event);
      }
    });
  }

  function init() {
    document.querySelectorAll('[data-july14-colorway-scroll]').forEach(function (el) {
      if (el._july14Pin) return;
      el._july14Pin = new ColorwayScrollPin(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  document.addEventListener('shopify:section:load', function () {
    setTimeout(init, 50);
  });
})();
