(function () {
  'use strict';

  function initHeader(root) {
    var toggle = root.querySelector('[data-bf-menu-toggle]');
    var menu = root.querySelector('[data-bf-menu]');
    if (!toggle || !menu) return;

    function setOpen(open) {
      root.classList.toggle('is-menu-open', open);
      menu.classList.toggle('is-open', open);
      menu.hidden = !open;
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.classList.toggle('bf-menu-open', open);
    }

    toggle.addEventListener('click', function () {
      setOpen(!root.classList.contains('is-menu-open'));
    });

    root.querySelectorAll('[data-bf-nav-link]').forEach(function (link) {
      link.addEventListener('click', function () {
        setOpen(false);
      });
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && root.classList.contains('is-menu-open')) {
        setOpen(false);
        toggle.focus();
      }
    });

    document.addEventListener('click', function (event) {
      if (!root.classList.contains('is-menu-open')) return;
      if (!root.contains(event.target)) setOpen(false);
    });
  }

  function boot() {
    document.querySelectorAll('[data-bf-header]').forEach(initHeader);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  document.addEventListener('shopify:section:load', function (event) {
    var header = event.target.querySelector('[data-bf-header]');
    if (header) initHeader(header);
  });
})();
