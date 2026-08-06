(function () {
  'use strict';

  function init(root) {
    var tabs = Array.prototype.slice.call(root.querySelectorAll('[data-bf-tab]'));
    var descs = Array.prototype.slice.call(root.querySelectorAll('[data-bf-tab-desc]'));
    var medias = Array.prototype.slice.call(root.querySelectorAll('[data-bf-tab-media]'));
    if (!tabs.length) return;

    var index = 0;
    var autoplayOn = root.getAttribute('data-autoplay-enabled') !== 'false';
    var intervalMs = (parseFloat(root.getAttribute('data-autoplay')) || 5) * 1000;
    var timer = null;
    var reduced =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.classList.contains('nf-no-motion');

    var outline = root.style.getPropertyValue('--bf-tabs-outline');
    if (!outline) {
      /* outline set via inline from Liquid if present */
    }

    function show(i) {
      index = (i + tabs.length) % tabs.length;
      tabs.forEach(function (tab, n) {
        var active = n === index;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', active ? 'true' : 'false');
        tab.tabIndex = active ? 0 : -1;
      });
      descs.forEach(function (desc, n) {
        desc.classList.toggle('is-active', n === index);
      });
      medias.forEach(function (media, n) {
        media.classList.toggle('is-active', n === index);
      });
    }

    function next() {
      show(index + 1);
    }

    function play() {
      stop();
      if (!autoplayOn || reduced || tabs.length < 2) return;
      timer = setInterval(next, intervalMs);
    }

    function stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        show(parseInt(tab.getAttribute('data-index'), 10) || 0);
        play();
      });
    });

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', play);
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', function (event) {
      if (!root.contains(event.relatedTarget)) play();
    });

    show(0);
    play();
  }

  function boot() {
    document.querySelectorAll('[data-bf-tabs]').forEach(init);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  document.addEventListener('shopify:section:load', function (event) {
    var el = event.target.querySelector('[data-bf-tabs]');
    if (el) init(el);
  });
})();
