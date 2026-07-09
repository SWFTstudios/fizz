(function () {
  var SECTION_ID = "fizz-cart-drawer";

  function cartRoot() {
    return window.Shopify?.routes?.root || "/";
  }

  function formatMoney(cents) {
    if (window.Shopify?.formatMoney) {
      return window.Shopify.formatMoney(cents);
    }
    return (cents / 100).toFixed(2);
  }

  function updateCartBadge(count) {
    document.querySelectorAll("[data-fizz-cart-count]").forEach(function (el) {
      if (count > 0) {
        el.textContent = String(count);
        el.hidden = false;
      } else {
        el.textContent = "0";
        el.hidden = true;
      }
    });
  }

  function dispatchCartUpdated(cart) {
    document.dispatchEvent(
      new CustomEvent("fizz:cart-updated", {
        detail: { cart: cart },
      })
    );
  }

  async function changeLine(key, quantity) {
    var res = await fetch(cartRoot() + "cart/change.js", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ id: key, quantity: quantity }),
    });
    if (!res.ok) throw new Error("Cart update failed");
    return res.json();
  }

  async function addVariant(variantId, quantity) {
    var res = await fetch(cartRoot() + "cart/add.js", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ id: variantId, quantity: quantity || 1 }),
    });
    if (!res.ok) throw new Error("Cart add failed");
    return res.json();
  }

  function bindCartControls(root, options) {
    if (!root) return;

    async function handleChange(key, quantity) {
      root.classList.add("fizz-cart__updating");
      try {
        var cart = await changeLine(key, quantity);
        updateCartBadge(cart.item_count);
        dispatchCartUpdated(cart);
        if (options && options.onUpdated) {
          await options.onUpdated(cart);
        }
      } catch (err) {
        root.classList.remove("fizz-cart__updating");
        throw err;
      }
    }

    root.querySelectorAll("[data-fizz-cart-qty]").forEach(function (wrap) {
      var key = wrap.dataset.lineKey;
      var input = wrap.querySelector("input");
      var minus = wrap.querySelector("[data-fizz-cart-minus]");
      var plus = wrap.querySelector("[data-fizz-cart-plus]");
      if (!key || !input) return;

      minus?.addEventListener("click", function () {
        var next = Math.max(0, parseInt(input.value, 10) - 1);
        handleChange(key, next);
      });

      plus?.addEventListener("click", function () {
        var next = parseInt(input.value, 10) + 1;
        handleChange(key, next);
      });
    });

    root.querySelectorAll("[data-fizz-cart-remove]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var key = btn.dataset.lineKey;
        if (key) handleChange(key, 0);
      });
    });

    root.querySelectorAll("[data-fizz-cart-recs-add]").forEach(function (btn) {
      btn.addEventListener("click", async function () {
        var variantId = btn.dataset.variantId;
        if (!variantId || btn.disabled) return;

        btn.disabled = true;
        root.classList.add("fizz-cart__updating");
        try {
          await addVariant(variantId, 1);
          var cartRes = await fetch(cartRoot() + "cart.js", {
            headers: { Accept: "application/json" },
          });
          if (!cartRes.ok) throw new Error("Cart fetch failed");
          var cart = await cartRes.json();
          updateCartBadge(cart.item_count);
          dispatchCartUpdated(cart);
          if (options && options.onUpdated) {
            await options.onUpdated(cart);
          }
        } catch (err) {
          root.classList.remove("fizz-cart__updating");
          btn.disabled = false;
        }
      });
    });
  }

  window.FizzCart = {
    changeLine: changeLine,
    updateCartBadge: updateCartBadge,
    bindCartControls: bindCartControls,
    dispatchCartUpdated: dispatchCartUpdated,
    formatMoney: formatMoney,
  };

  function initCartPage() {
    var root = document.querySelector("[data-fizz-cart]");
    if (!root || root.closest("[data-fizz-cart-drawer]")) return;

    bindCartControls(root, {
      onUpdated: function () {
        window.location.reload();
      },
    });
  }

  function initCartDrawer() {
    var siteHeader = document.querySelector("[data-fizz-site-header]");
    var drawer = siteHeader && siteHeader.querySelector("[data-fizz-cart-drawer]");
    var content = drawer && drawer.querySelector("[data-fizz-cart-drawer-content]");
    var backdrop = siteHeader && siteHeader.querySelector("[data-fizz-nav-backdrop]");
    var toggles = document.querySelectorAll("[data-fizz-cart-toggle]");
    var closers = drawer ? drawer.querySelectorAll("[data-fizz-cart-close]") : [];
    if (!siteHeader || !drawer || !content) return;

    async function refreshDrawer() {
      var url = cartRoot() + "?section_id=" + SECTION_ID;
      var res = await fetch(url, { headers: { Accept: "text/html" } });
      if (!res.ok) throw new Error("Cart drawer fetch failed");
      var html = await res.text();
      var doc = new DOMParser().parseFromString(html, "text/html");
      var inner = doc.querySelector("[data-fizz-cart]");
      content.innerHTML = inner ? inner.outerHTML : doc.body.innerHTML;
      bindDrawerControls();
    }

    function bindDrawerControls() {
      var inner = content.querySelector("[data-fizz-cart]");
      bindCartControls(inner, {
        onUpdated: async function (cart) {
          await refreshDrawer();
          if (inner) inner.classList.remove("fizz-cart__updating");
          updateCartBadge(cart.item_count);
        },
      });
    }

    function setCartOpen(open) {
      siteHeader.classList.toggle("is-cart-open", open);
      drawer.hidden = !open;
      drawer.setAttribute("aria-hidden", open ? "false" : "true");
      if (backdrop) backdrop.hidden = !open;
      document.body.classList.toggle("fizz-nav-locked", open);

      toggles.forEach(function (btn) {
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });

      if (open) {
        refreshDrawer().catch(function () {});
      }

      if (window.FizzNav && window.FizzNav.syncNavSolid) {
        window.FizzNav.syncNavSolid();
      }
    }

    function closeCart() {
      if (siteHeader.classList.contains("is-cart-open")) {
        setCartOpen(false);
      }
    }

    toggles.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var isOpen = siteHeader.classList.contains("is-cart-open");
        if (!isOpen) {
          siteHeader.classList.remove("is-drawer-open", "is-search-open");
          var navDrawer = siteHeader.querySelector("[data-fizz-nav-drawer]");
          var searchDrawer = siteHeader.querySelector("[data-fizz-search-drawer]");
          if (navDrawer) {
            navDrawer.hidden = true;
            navDrawer.setAttribute("aria-hidden", "true");
          }
          if (searchDrawer) {
            searchDrawer.hidden = true;
            searchDrawer.setAttribute("aria-hidden", "true");
          }
          siteHeader.querySelectorAll("[data-fizz-search-toggle], [data-fizz-nav-drawer-toggle]").forEach(function (el) {
            el.setAttribute("aria-expanded", "false");
          });
        }
        setCartOpen(!isOpen);
      });
    });

    closers.forEach(function (btn) {
      btn.addEventListener("click", closeCart);
    });

    if (backdrop) {
      backdrop.addEventListener("click", closeCart);
    }

    document.addEventListener("fizz:cart-close", closeCart);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && siteHeader.classList.contains("is-cart-open")) {
        closeCart();
      }
    });

    document.addEventListener("fizz:cart-updated", function (e) {
      var cart = e.detail && e.detail.cart;
      if (cart) updateCartBadge(cart.item_count);
      if (siteHeader.classList.contains("is-cart-open")) {
        refreshDrawer().catch(function () {});
      }
    });

    bindDrawerControls();
  }

  function initAll() {
    initCartPage();
    initCartDrawer();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
