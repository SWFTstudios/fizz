/*
  NeoFizz scroll motion — reveals, marquee, feature accordion.
*/
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var motionOff =
    document.documentElement.classList.contains('nf-no-motion') || reduced;
  if (reduced) document.documentElement.classList.add('nf-no-motion');

  function initReveals() {
    var nodes = document.querySelectorAll('[data-nf-reveal]');
    if (!nodes.length) return;
    if (motionOff || typeof IntersectionObserver === 'undefined') {
      nodes.forEach(function (el) {
        el.classList.add('is-in');
      });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: '0px 0px -8% 0px' }
    );
    nodes.forEach(function (el) {
      io.observe(el);
    });
  }

  function initMarquee() {
    document.querySelectorAll('[data-nf-marquee]').forEach(function (section) {
      if (motionOff) {
        section.classList.add('is-static');
        return;
      }
      section.classList.add('is-running');
    });
  }

  function initFeatures() {
    document.querySelectorAll('[data-nf-features]').forEach(function (section) {
      var cards = Array.prototype.slice.call(
        section.querySelectorAll('[data-nf-features-card]')
      );
      var layers = Array.prototype.slice.call(
        section.querySelectorAll('[data-nf-features-layer]')
      );
      if (!cards.length) return;

      function activate(idx) {
        cards.forEach(function (card, i) {
          card.classList.toggle('is-active', i === idx);
        });
        layers.forEach(function (layer, i) {
          layer.classList.toggle('is-active', i === idx);
        });
      }

      cards.forEach(function (card, idx) {
        card.addEventListener('mouseenter', function () {
          activate(idx);
        });
        card.addEventListener('focusin', function () {
          activate(idx);
        });
        card.addEventListener('click', function () {
          activate(idx);
        });
      });

      if (motionOff || typeof IntersectionObserver === 'undefined') return;

      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            var idx = cards.indexOf(entry.target);
            if (idx >= 0) activate(idx);
          });
        },
        { threshold: 0.55, rootMargin: '-10% 0px -25% 0px' }
      );
      cards.forEach(function (card) {
        io.observe(card);
      });
    });
  }

  function initBentoStagger() {
    if (motionOff || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    document.querySelectorAll('[data-nf-bento]').forEach(function (section) {
      var cards = section.querySelectorAll('[data-nf-bento-card]');
      if (!cards.length) return;
      gsap.from(cards, {
        opacity: 0,
        y: 40,
        duration: 0.7,
        stagger: 0.12,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 75%',
          once: true
        }
      });
    });
  }

  function boot() {
    initReveals();
    initMarquee();
    initFeatures();
    initBentoStagger();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  document.addEventListener('shopify:section:load', boot);
})();
