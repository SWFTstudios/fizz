(function () {
  var heroPast = false;

  function setSolidNav(nav, solid) {
    nav.classList.toggle("fizz-nav--solid", solid);
    if (solid) {
      nav.dataset.navTheme = "dark";
      nav.style.setProperty("--fizz-nav-fg", "var(--fizz-nav-fg-solid)");
    } else {
      nav.style.removeProperty("--fizz-nav-fg");
      document.dispatchEvent(new CustomEvent("fizz:nav-overlay-enter"));
    }
  }

  function syncNavSolid(nav, siteHeader) {
    if (!nav || !siteHeader) return;
    var overlayOpen =
      siteHeader.classList.contains("is-drawer-open") ||
      siteHeader.classList.contains("is-search-open") ||
      siteHeader.classList.contains("is-cart-open");
    setSolidNav(nav, overlayOpen || heroPast);
  }

  function setPastHero(siteHeader, pastHero) {
    if (!siteHeader) return;
    siteHeader.classList.toggle("is-past-hero", pastHero);
  }

  function initScrollSolid(nav, siteHeader, onHeroChange) {
    var transparent = nav.dataset.navTransparent === "true";
    var solidOnScroll = nav.dataset.navSolidOnScroll === "true";
    var heroTrack = document.querySelector("[data-fizz-hero-track]");
    var homeOverlay = siteHeader && siteHeader.dataset.homeOverlay === "true";

    if (!transparent || !solidOnScroll || !heroTrack) {
      heroPast = true;
      syncNavSolid(nav, siteHeader);
      if (homeOverlay) setPastHero(siteHeader, true);
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        heroPast = !entries[0].isIntersecting;
        setPastHero(siteHeader, heroPast);
        syncNavSolid(nav, siteHeader);
        if (onHeroChange) onHeroChange(heroPast);
      },
      { root: null, threshold: 0, rootMargin: "0px" }
    );

    observer.observe(heroTrack);
  }

  function initDrawer(siteHeader, nav) {
    var drawer = siteHeader.querySelector("[data-fizz-nav-drawer]");
    var backdrop = siteHeader.querySelector("[data-fizz-nav-backdrop]");
    var toggles = siteHeader.querySelectorAll("[data-fizz-nav-drawer-toggle], [data-fizz-nav-drawer-close]");
    if (!drawer) return;

    function setDrawerOpen(open) {
      if (open) {
        document.dispatchEvent(new CustomEvent("fizz:cart-close"));
      }

      siteHeader.classList.toggle("is-drawer-open", open);
      drawer.hidden = !open;
      drawer.setAttribute("aria-hidden", open ? "false" : "true");
      if (backdrop) backdrop.hidden = !open;
      document.body.classList.toggle("fizz-nav-locked", open);

      toggles.forEach(function (btn) {
        if (btn.matches("[data-fizz-nav-drawer-toggle]")) {
          btn.setAttribute("aria-expanded", open ? "true" : "false");
        }
      });

      syncNavSolid(nav, siteHeader);
    }

    toggles.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var isOpen = siteHeader.classList.contains("is-drawer-open");
        setDrawerOpen(!isOpen);
      });
    });

    if (backdrop) {
      backdrop.addEventListener("click", function () {
        setDrawerOpen(false);
        closeSearch(siteHeader, nav);
        document.dispatchEvent(new CustomEvent("fizz:cart-close"));
      });
    }

    drawer.querySelectorAll("[data-fizz-drawer-accordion]").forEach(function (trigger) {
      trigger.addEventListener("click", function () {
        var item = trigger.closest(".fizz-nav-drawer__item");
        var sublist = item && item.querySelector(".fizz-nav-drawer__sublist");
        if (!item || !sublist) return;
        var open = item.classList.toggle("is-open");
        trigger.setAttribute("aria-expanded", open ? "true" : "false");
        sublist.hidden = !open;
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && siteHeader.classList.contains("is-drawer-open")) {
        setDrawerOpen(false);
      }
    });
  }

  function closeSearch(siteHeader, nav) {
    var searchDrawer = siteHeader.querySelector("[data-fizz-search-drawer]");
    var backdrop = siteHeader.querySelector("[data-fizz-nav-backdrop]");
    siteHeader.classList.remove("is-search-open");
    if (searchDrawer) {
      searchDrawer.hidden = true;
      searchDrawer.setAttribute("aria-hidden", "true");
    }
    if (backdrop && !siteHeader.classList.contains("is-drawer-open") && !siteHeader.classList.contains("is-cart-open")) {
      backdrop.hidden = true;
      document.body.classList.remove("fizz-nav-locked");
    }
    siteHeader.querySelectorAll("[data-fizz-search-toggle]").forEach(function (btn) {
      btn.setAttribute("aria-expanded", "false");
    });
    syncNavSolid(nav, siteHeader);
  }

  function initSearch(siteHeader, nav) {
    var searchDrawer = siteHeader.querySelector("[data-fizz-search-drawer]");
    var backdrop = siteHeader.querySelector("[data-fizz-nav-backdrop]");
    var openers = siteHeader.querySelectorAll("[data-fizz-search-toggle]");
    var closers = siteHeader.querySelectorAll("[data-fizz-search-close]");
    if (!searchDrawer) return;

    function setSearchOpen(open) {
      if (open) {
        document.dispatchEvent(new CustomEvent("fizz:cart-close"));
      }

      siteHeader.classList.toggle("is-search-open", open);
      searchDrawer.hidden = !open;
      searchDrawer.setAttribute("aria-hidden", open ? "false" : "true");
      if (backdrop) backdrop.hidden = !open;
      document.body.classList.toggle("fizz-nav-locked", open);

      openers.forEach(function (btn) {
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });

      if (open) {
        var input = searchDrawer.querySelector(".fizz-search-drawer__input");
        if (input) {
          window.requestAnimationFrame(function () {
            input.focus();
          });
        }
      }

      syncNavSolid(nav, siteHeader);
    }

    openers.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var isOpen = siteHeader.classList.contains("is-search-open");
        if (siteHeader.classList.contains("is-drawer-open")) {
          siteHeader.classList.remove("is-drawer-open");
          var drawer = siteHeader.querySelector("[data-fizz-nav-drawer]");
          if (drawer) {
            drawer.hidden = true;
            drawer.setAttribute("aria-hidden", "true");
          }
        }
        setSearchOpen(!isOpen);
      });
    });

    closers.forEach(function (btn) {
      btn.addEventListener("click", function () {
        closeSearch(siteHeader, nav);
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && siteHeader.classList.contains("is-search-open")) {
        closeSearch(siteHeader, nav);
      }
    });
  }

  function initFizzNav() {
    var siteHeader = document.querySelector("[data-fizz-site-header]");
    var nav = document.querySelector("[data-fizz-nav]");
    if (!siteHeader || !nav) return;

    initScrollSolid(nav, siteHeader);
    initDrawer(siteHeader, nav);
    initSearch(siteHeader, nav);

    window.FizzNav = {
      syncNavSolid: function () {
        syncNavSolid(nav, siteHeader);
      },
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFizzNav);
  } else {
    initFizzNav();
  }
})();
