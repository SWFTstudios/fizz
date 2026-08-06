/*
  Ballena Fizz — Lenis smooth scroll (floaty premium feel).
  Syncs ScrollTrigger when GSAP is present.
*/
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || document.documentElement.classList.contains('nf-no-motion')) return;
  if (typeof Lenis === 'undefined') return;

  var lenis = new Lenis({
    duration: 1.15,
    easing: function (t) {
      return Math.min(1, 1.001 - Math.pow(2, -10 * t));
    },
    smoothWheel: true,
    touchMultiplier: 1.1
  });

  window.bfLenis = lenis;

  var useGsapTicker = false;

  function bindScrollTrigger() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    if (useGsapTicker) return;
    useGsapTicker = true;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  }

  function raf(time) {
    if (!useGsapTicker) lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindScrollTrigger);
  } else {
    bindScrollTrigger();
  }
  window.addEventListener('load', bindScrollTrigger);
})();
