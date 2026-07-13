(function () {
  'use strict';

  function focusableElements(root) {
    return Array.prototype.slice.call(
      root.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter(function (el) {
      return !el.hidden && el.offsetParent !== null;
    });
  }

  function trapFocus(event, root) {
    if (event.key !== 'Tab') return;
    var focusable = focusableElements(root);
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function initNav() {
    var siteHeader = document.querySelector('[data-fizz-site-header]');
    var nav = siteHeader && siteHeader.querySelector('[data-fizz-nav]');
    if (!siteHeader || !nav) return;

    var drawer = siteHeader.querySelector('[data-fizz-nav-drawer]');
    var drawerToggle = siteHeader.querySelector('[data-fizz-nav-drawer-toggle]');
    var drawerClose = siteHeader.querySelector('[data-fizz-nav-drawer-close]');
    var backdrop = siteHeader.querySelector('[data-fizz-nav-backdrop]');
    var closeTimer;

    function overlayIsOpen() {
      return (
        siteHeader.classList.contains('is-drawer-open') ||
        siteHeader.classList.contains('is-search-open') ||
        siteHeader.classList.contains('is-cart-open')
      );
    }

    function syncBodyLock() {
      document.body.classList.toggle('fizz-nav-locked', overlayIsOpen());
      if (backdrop) backdrop.hidden = !overlayIsOpen();
    }

    function closeMegaMenus() {
      siteHeader.querySelectorAll('.fizz-nav-link-wrap.is-open').forEach(function (wrap) {
        wrap.classList.remove('is-open');
        var trigger = wrap.querySelector('[data-fizz-mega-trigger]');
        var panel = wrap.querySelector('[data-fizz-mega]');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
        if (panel) panel.setAttribute('aria-hidden', 'true');
      });
      siteHeader.classList.remove('is-mega-open');
    }

    function closeDrawer(options) {
      options = options || {};
      if (!drawer || !siteHeader.classList.contains('is-drawer-open')) return;
      siteHeader.classList.remove('is-drawer-open');
      drawer.setAttribute('aria-hidden', 'true');
      if (drawerToggle) drawerToggle.setAttribute('aria-expanded', 'false');
      window.clearTimeout(closeTimer);
      closeTimer = window.setTimeout(function () {
        if (!siteHeader.classList.contains('is-drawer-open')) drawer.hidden = true;
      }, 280);
      syncBodyLock();
      if (options.restoreFocus !== false && drawerToggle) drawerToggle.focus();
    }

    function openDrawer() {
      if (!drawer) return;
      closeMegaMenus();
      document.dispatchEvent(new CustomEvent('fizz:search-close'));
      document.dispatchEvent(new CustomEvent('fizz:cart-close'));
      window.clearTimeout(closeTimer);
      drawer.hidden = false;
      drawer.setAttribute('aria-hidden', 'false');
      window.requestAnimationFrame(function () {
        siteHeader.classList.add('is-drawer-open');
      });
      if (drawerToggle) drawerToggle.setAttribute('aria-expanded', 'true');
      syncBodyLock();
      window.setTimeout(function () {
        var focusable = focusableElements(drawer);
        if (focusable.length) focusable[0].focus();
      }, 40);
    }

    if (drawerToggle) {
      drawerToggle.addEventListener('click', function () {
        if (siteHeader.classList.contains('is-drawer-open')) closeDrawer();
        else openDrawer();
      });
    }

    if (drawerClose) {
      drawerClose.addEventListener('click', function () {
        closeDrawer();
      });
    }

    if (drawer) {
      drawer.addEventListener('keydown', function (event) {
        trapFocus(event, drawer);
      });
      drawer.querySelectorAll('a[href]').forEach(function (link) {
        link.addEventListener('click', function () {
          closeDrawer({ restoreFocus: false });
        });
      });
    }

    if (backdrop) {
      backdrop.addEventListener('click', function () {
        closeDrawer({ restoreFocus: false });
        closeMegaMenus();
      });
    }

    document.addEventListener('fizz:nav-close', function () {
      closeDrawer({ restoreFocus: false });
    });

    /* Desktop mega-menu behavior */
    siteHeader.querySelectorAll('.fizz-nav-link-wrap--mega').forEach(function (wrap) {
      var trigger = wrap.querySelector('[data-fizz-mega-trigger]');
      var panel = wrap.querySelector('[data-fizz-mega]');
      var leaveTimer;
      if (!trigger || !panel) return;

      function openMega() {
        if (window.matchMedia('(max-width: 1023px)').matches) return;
        closeMegaMenus();
        window.clearTimeout(leaveTimer);
        wrap.classList.add('is-open');
        siteHeader.classList.add('is-mega-open');
        trigger.setAttribute('aria-expanded', 'true');
        panel.setAttribute('aria-hidden', 'false');
      }

      function scheduleClose() {
        window.clearTimeout(leaveTimer);
        leaveTimer = window.setTimeout(function () {
          if (!wrap.contains(document.activeElement)) closeMegaMenus();
        }, 150);
      }

      wrap.addEventListener('mouseenter', openMega);
      wrap.addEventListener('mouseleave', scheduleClose);
      trigger.addEventListener('focus', openMega);
      wrap.addEventListener('focusout', function (event) {
        if (!wrap.contains(event.relatedTarget)) scheduleClose();
      });
      trigger.addEventListener('click', function (event) {
        if (window.matchMedia('(min-width: 1024px)').matches && !wrap.classList.contains('is-open')) {
          event.preventDefault();
          openMega();
        }
      });
    });

    document.addEventListener('click', function (event) {
      if (!event.target.closest('.fizz-nav-link-wrap--mega')) closeMegaMenus();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      if (siteHeader.classList.contains('is-drawer-open')) {
        closeDrawer();
      } else if (siteHeader.classList.contains('is-mega-open')) {
        var activeTrigger = siteHeader.querySelector('[data-fizz-mega-trigger][aria-expanded="true"]');
        closeMegaMenus();
        if (activeTrigger) activeTrigger.focus();
      }
    });

    function syncNavSolid() {
      var solidOnScroll = siteHeader.dataset.navSolidOnScroll === 'true';
      var solid = solidOnScroll && window.scrollY > 20;
      siteHeader.classList.toggle('is-nav-solid', solid);
    }

    syncNavSolid();
    window.addEventListener('scroll', syncNavSolid, { passive: true });
    window.addEventListener('resize', function () {
      if (window.matchMedia('(min-width: 1024px)').matches) {
        closeDrawer({ restoreFocus: false });
      } else {
        closeMegaMenus();
      }
    });

    window.FizzNav = {
      closeDrawer: closeDrawer,
      closeMegaMenus: closeMegaMenus,
      syncNavSolid: syncNavSolid,
      trapFocus: trapFocus,
      syncBodyLock: syncBodyLock,
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNav);
  } else {
    initNav();
  }
})();
