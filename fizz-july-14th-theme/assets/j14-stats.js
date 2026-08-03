/**
 * J14 Stats — count-up numbers when the section enters the viewport.
 * Respects section data-j14-stats-animate, prefers-reduced-motion, and theme motion.
 */
(function () {
  'use strict';

  var SELECTOR = '[data-j14-stats]';
  var COUNT = '[data-j14-count]';
  var observers = new WeakMap();

  function prefersReducedMotion() {
    return (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.classList.contains('j14-no-motion')
    );
  }

  function parseTarget(raw) {
    var n = parseFloat(String(raw).replace(/,/g, ''), 10);
    return Number.isFinite(n) ? n : 0;
  }

  function formatValue(value, decimals) {
    if (decimals > 0) {
      return value.toFixed(decimals);
    }
    return String(Math.round(value));
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function setFinal(el) {
    var target = parseTarget(el.getAttribute('data-target'));
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10) || 0;
    el.textContent = formatValue(target, decimals);
    el.setAttribute('data-counted', 'true');
  }

  function animateEl(el) {
    if (el.getAttribute('data-counted') === 'true') return;

    var target = parseTarget(el.getAttribute('data-target'));
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10) || 0;
    var duration = parseInt(el.getAttribute('data-duration') || '1600', 10) || 1600;
    var start = null;

    el.textContent = formatValue(0, decimals);

    function frame(now) {
      if (start === null) start = now;
      var t = Math.min(1, (now - start) / duration);
      var current = target * easeOutCubic(t);
      el.textContent = formatValue(current, decimals);
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        el.textContent = formatValue(target, decimals);
        el.setAttribute('data-counted', 'true');
      }
    }

    requestAnimationFrame(frame);
  }

  function runSection(section) {
    var nodes = section.querySelectorAll(COUNT);
    if (!nodes.length) return;

    var animate =
      section.getAttribute('data-j14-stats-animate') === 'true' && !prefersReducedMotion();

    if (!animate) {
      nodes.forEach(setFinal);
      return;
    }

    if (!('IntersectionObserver' in window)) {
      nodes.forEach(animateEl);
      return;
    }

    var prev = observers.get(section);
    if (prev) prev.disconnect();

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.querySelectorAll(COUNT).forEach(animateEl);
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.25, rootMargin: '0px 0px -8% 0px' }
    );

    observers.set(section, io);
    io.observe(section);
  }

  function initAll(root) {
    var scope = root || document;
    scope.querySelectorAll(SELECTOR).forEach(runSection);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initAll();
    });
  } else {
    initAll();
  }

  document.addEventListener('shopify:section:load', function (event) {
    if (!event.target) return;
    if (event.target.matches && event.target.matches(SELECTOR)) {
      initAll(event.target.parentNode || document);
      return;
    }
    var section = event.target.querySelector && event.target.querySelector(SELECTOR);
    if (section) runSection(section);
  });
})();
