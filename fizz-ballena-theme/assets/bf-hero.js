(function () {
  'use strict';

  function prefersReducedMotion() {
    return (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.classList.contains('nf-no-motion')
    );
  }

  function init(root) {
    var slides = Array.prototype.slice.call(root.querySelectorAll('[data-bf-hero-slide]'));
    var dots = Array.prototype.slice.call(root.querySelectorAll('[data-bf-hero-dot]'));
    var preloader = root.querySelector('[data-nf-preloader]');
    var water = root.querySelector('[data-nf-preloader-water]');
    var logo = root.querySelector('[data-nf-preloader-logo]');
    var pctEl = root.querySelector('[data-nf-preloader-pct]');
    var loaderEnabled =
      root.getAttribute('data-loader-enabled') !== 'false' && preloader && !prefersReducedMotion();
    var loaderDuration =
      (parseFloat(root.getAttribute('data-loader-duration')) || 5.6) * 1000;
    var index = 0;
    var interval = parseFloat(root.getAttribute('data-autoplay') || '5') * 1000;
    var timer;

    function go(i) {
      if (!slides.length) return;
      index = (i + slides.length) % slides.length;
      slides.forEach(function (slide, n) {
        slide.classList.toggle('is-active', n === index);
      });
      dots.forEach(function (dot, n) {
        dot.classList.toggle('is-active', n === index);
      });
    }

    function play() {
      if (interval <= 0 || slides.length < 2) return;
      clearInterval(timer);
      timer = setInterval(function () {
        go(index + 1);
      }, interval);
    }

    function setPct(n) {
      if (pctEl) pctEl.textContent = Math.round(n) + '%';
    }

    function finishLoader() {
      root.classList.remove('is-loading');
      root.classList.add('is-ready');
      document.documentElement.classList.remove('bf-loader-active');
      if (preloader) {
        preloader.classList.add('is-done');
        preloader.style.pointerEvents = 'none';
        setTimeout(function () {
          if (preloader) preloader.style.display = 'none';
        }, 400);
      }
      go(0);
      play();
    }

    function runLoader() {
      root.classList.add('is-loading');
      document.documentElement.classList.add('bf-loader-active');
      var start = performance.now();
      var fillMs = loaderDuration * 0.82;
      var holdMs = loaderDuration * 0.06;
      var zoomMs = loaderDuration * 0.12;

      function frame(now) {
        var elapsed = now - start;
        if (elapsed < fillMs) {
          var t = elapsed / fillMs;
          var ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          var pct = ease * 100;
          if (water) water.style.transform = 'translateY(' + (100 - pct) + '%)';
          setPct(pct);
          requestAnimationFrame(frame);
          return;
        }

        setPct(100);
        if (water) water.style.transform = 'translateY(0%)';

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
          if (logo) logo.style.transform = 'scale(' + scale + ')';
          if (preloader) preloader.style.opacity = String(Math.max(0, opacity));
          requestAnimationFrame(frame);
          return;
        }

        finishLoader();
      }

      requestAnimationFrame(frame);
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        go(parseInt(dot.getAttribute('data-index'), 10) || 0);
        play();
      });
    });

    if (loaderEnabled) {
      runLoader();
    } else {
      if (preloader) {
        preloader.classList.add('is-done');
        preloader.style.display = 'none';
      }
      root.classList.remove('is-loading');
      root.classList.add('is-ready');
      go(0);
      play();
    }
  }

  function boot() {
    document.querySelectorAll('[data-bf-hero]').forEach(init);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  document.addEventListener('shopify:section:load', function (event) {
    var hero = event.target.querySelector('[data-bf-hero]');
    if (hero) init(hero);
  });
})();
