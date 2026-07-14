/*
  Mobile mega-menu overlay.
  - Never touches GSAP / ScrollTrigger (that was crashing the page).
  - Mounts the menu node on document.body while open so it always stacks
    above section content, then restores it on close.
*/
(function () {
  'use strict';

  function boot() {
    var header = document.querySelector('[data-j14-header]');
    if (!header) return;

    var toggle = header.querySelector('[data-j14-menu-toggle]');
    var menu = header.querySelector('[data-j14-menu]') || document.querySelector('[data-j14-menu]');
    if (!toggle || !menu) return;

    var home = menu.parentNode;
    var open = false;
    var scrollY = 0;

    function setOpen(next) {
      open = !!next;
      header.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.documentElement.classList.toggle('j14-menu-open', open);

      if (open) {
        scrollY = window.scrollY || window.pageYOffset || 0;
        if (menu.parentNode !== document.body) {
          document.body.appendChild(menu);
        }
        menu.hidden = false;
        menu.classList.add('is-open');
        menu.setAttribute('aria-hidden', 'false');
        try {
          window.dispatchEvent(new CustomEvent('j14:menu-open'));
        } catch (err) {}
        /* Soft lock — no position:fixed on body (iOS / GSAP conflict) */
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
      } else {
        menu.classList.remove('is-open');
        menu.setAttribute('aria-hidden', 'true');
        menu.hidden = true;
        if (home && menu.parentNode !== home) {
          home.appendChild(menu);
        }
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
        try {
          window.dispatchEvent(new CustomEvent('j14:menu-close'));
        } catch (err) {}
        window.scrollTo(0, scrollY);
      }
    }

    toggle.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      setOpen(!open);
    });

    menu.addEventListener('click', function (e) {
      var link = e.target.closest && e.target.closest('a[href]');
      if (!link) return;
      setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && open) setOpen(false);
    });

    var onScroll = function () {
      if (open) return;
      header.classList.toggle('is-scrolled', (window.scrollY || 0) > 24);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  document.addEventListener('shopify:section:load', function () {
    boot();
  });
})();
