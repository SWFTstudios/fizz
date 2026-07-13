(function () {
  var SECTION_ID = 'fizz-claude-cart-drawer';

  function cartRoot() {
    return (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
  }

  function updateCartBadge(count) {
    document.querySelectorAll('[data-fizz-cart-count]').forEach(function (el) {
      if (count > 0) {
        el.textContent = String(count);
        el.hidden = false;
      } else {
        el.textContent = '0';
        el.hidden = true;
      }
    });
  }

  function dispatchCartUpdated(cart) {
    document.dispatchEvent(new CustomEvent('fizz:cart-updated', { detail: { cart: cart } }));
  }

  function changeLine(key, quantity) {
    return fetch(cartRoot() + 'cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ id: key, quantity: quantity }),
    }).then(function (res) {
      if (!res.ok) throw new Error('Cart update failed');
      return res.json();
    });
  }

  function addVariant(variantId, quantity) {
    return fetch(cartRoot() + 'cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ id: variantId, quantity: quantity || 1 }),
    }).then(function (res) {
      if (!res.ok) throw new Error('Cart add failed');
      return res.json();
    });
  }

  function bindCartControls(root, options) {
    if (!root) return;

    function handleChange(key, quantity) {
      root.classList.add('fizz-cart__updating');
      return changeLine(key, quantity)
        .then(function (cart) {
          updateCartBadge(cart.item_count);
          dispatchCartUpdated(cart);
          if (options && options.onUpdated) return options.onUpdated(cart);
        })
        .catch(function () {
          root.classList.remove('fizz-cart__updating');
        });
    }

    root.querySelectorAll('[data-fizz-cart-qty]').forEach(function (wrap) {
      var key = wrap.dataset.lineKey;
      var input = wrap.querySelector('input');
      var minus = wrap.querySelector('[data-fizz-cart-minus]');
      var plus = wrap.querySelector('[data-fizz-cart-plus]');
      if (!key || !input) return;

      if (minus) {
        minus.addEventListener('click', function () {
          handleChange(key, Math.max(0, parseInt(input.value, 10) - 1));
        });
      }
      if (plus) {
        plus.addEventListener('click', function () {
          handleChange(key, parseInt(input.value, 10) + 1);
        });
      }
    });

    root.querySelectorAll('[data-fizz-cart-remove]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.dataset.lineKey;
        if (key) handleChange(key, 0);
      });
    });

    root.querySelectorAll('[data-fizz-cart-recs-add]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var variantId = btn.dataset.variantId;
        if (!variantId || btn.disabled) return;
        btn.disabled = true;
        root.classList.add('fizz-cart__updating');
        addVariant(variantId, 1)
          .then(function () {
            return fetch(cartRoot() + 'cart.js', { headers: { Accept: 'application/json' } });
          })
          .then(function (res) {
            if (!res.ok) throw new Error('Cart fetch failed');
            return res.json();
          })
          .then(function (cart) {
            updateCartBadge(cart.item_count);
            dispatchCartUpdated(cart);
            if (options && options.onUpdated) return options.onUpdated(cart);
          })
          .catch(function () {
            root.classList.remove('fizz-cart__updating');
            btn.disabled = false;
          });
      });
    });
  }

  window.FizzCart = {
    changeLine: changeLine,
    updateCartBadge: updateCartBadge,
    bindCartControls: bindCartControls,
    dispatchCartUpdated: dispatchCartUpdated,
    openDrawer: function () {
      document.dispatchEvent(new CustomEvent('fizz:cart-open'));
    },
  };

  function initCartPage() {
    var root = document.querySelector('[data-fizz-cart]');
    if (!root || root.closest('[data-fizz-cart-drawer]')) return;
    bindCartControls(root, {
      onUpdated: function () {
        window.location.reload();
      },
    });
  }

  function initCartDrawer() {
    var siteHeader = document.querySelector('[data-fizz-site-header]');
    var drawer = siteHeader && siteHeader.querySelector('[data-fizz-cart-drawer]');
    var content = drawer && drawer.querySelector('[data-fizz-cart-drawer-content]');
    var backdrop = siteHeader && siteHeader.querySelector('[data-fizz-nav-backdrop]');
    var toggles = document.querySelectorAll('[data-fizz-cart-toggle]');
    var closers = drawer ? drawer.querySelectorAll('[data-fizz-cart-close]') : [];
    var lastOpener = null;
    if (!siteHeader || !drawer || !content) return;

    function refreshDrawer() {
      var url = cartRoot() + '?section_id=' + SECTION_ID;
      return fetch(url, { headers: { Accept: 'text/html' } })
        .then(function (res) {
          if (!res.ok) throw new Error('Cart drawer fetch failed');
          return res.text();
        })
        .then(function (html) {
          var doc = new DOMParser().parseFromString(html, 'text/html');
          var inner = doc.querySelector('[data-fizz-cart]');
          content.innerHTML = inner ? inner.outerHTML : doc.body.innerHTML;
          bindDrawerControls();
        });
    }

    function bindDrawerControls() {
      var inner = content.querySelector('[data-fizz-cart]');
      bindCartControls(inner, {
        onUpdated: function (cart) {
          if (inner) inner.classList.remove('fizz-cart__updating');
          updateCartBadge(cart.item_count);
        },
      });
    }

    function closeOtherDrawers() {
      siteHeader.classList.remove('is-search-open');
      var searchDrawer = siteHeader.querySelector('[data-fizz-search-drawer]');
      if (searchDrawer) {
        searchDrawer.hidden = true;
        searchDrawer.setAttribute('aria-hidden', 'true');
      }
      siteHeader.querySelectorAll('[data-fizz-search-toggle]').forEach(function (el) {
        el.setAttribute('aria-expanded', 'false');
      });
      document.dispatchEvent(new CustomEvent('fizz:search-close'));
    }

    function setCartOpen(open) {
      var focusWasInside = drawer.contains(document.activeElement);
      siteHeader.classList.toggle('is-cart-open', open);
      drawer.hidden = !open;
      drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
      if (backdrop) backdrop.hidden = !open;
      document.body.classList.toggle('fizz-nav-locked', open);

      toggles.forEach(function (btn) {
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });

      if (open) refreshDrawer().catch(function () {});
      if (window.FizzNav && window.FizzNav.syncBodyLock) window.FizzNav.syncBodyLock();
      if (!open && focusWasInside && lastOpener) lastOpener.focus();
    }

    function closeCart() {
      if (siteHeader.classList.contains('is-cart-open')) setCartOpen(false);
    }

    toggles.forEach(function (btn) {
      btn.addEventListener('click', function () {
        lastOpener = btn;
        var isOpen = siteHeader.classList.contains('is-cart-open');
        if (!isOpen) {
          document.dispatchEvent(new CustomEvent('fizz:nav-close'));
          closeOtherDrawers();
        }
        setCartOpen(!isOpen);
      });
    });

    closers.forEach(function (btn) {
      btn.addEventListener('click', closeCart);
    });

    if (backdrop) {
      backdrop.addEventListener('click', function () {
        closeCart();
        document.dispatchEvent(new CustomEvent('fizz:search-close'));
      });
    }

    document.addEventListener('fizz:cart-close', closeCart);
    document.addEventListener('fizz:cart-open', function () {
      if (siteHeader.classList.contains('is-cart-open')) {
        refreshDrawer().catch(function () {});
        return;
      }
      lastOpener = document.querySelector('[data-fizz-cart-toggle]');
      document.dispatchEvent(new CustomEvent('fizz:nav-close'));
      closeOtherDrawers();
      setCartOpen(true);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && siteHeader.classList.contains('is-cart-open')) closeCart();
    });

    drawer.addEventListener('keydown', function (e) {
      if (window.FizzNav && window.FizzNav.trapFocus) window.FizzNav.trapFocus(e, drawer);
    });

    document.addEventListener('fizz:cart-updated', function (e) {
      var cart = e.detail && e.detail.cart;
      if (cart) updateCartBadge(cart.item_count);
      if (siteHeader.classList.contains('is-cart-open')) refreshDrawer().catch(function () {});
    });

    bindDrawerControls();
  }

  function initAll() {
    initCartPage();
    initCartDrawer();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAll);
  else initAll();
})();
