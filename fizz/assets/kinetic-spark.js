/**
 * Fizz Kinetic Spark theme interactions
 */
(function () {
  function initHeroSlideshow(root) {
    root.querySelectorAll("[data-ks-hero-slideshow]").forEach(function (section) {
      var viewport = section.querySelector("[data-ks-hero-viewport]");
      var track = section.querySelector("[data-ks-hero-track]");
      var slides = section.querySelectorAll(".hero-slide");
      if (!viewport || !track || slides.length < 2) return;

      var current = 0;
      var timer = null;

      function setActive(index) {
        current = (index + slides.length) % slides.length;
        slides.forEach(function (slide, i) {
          slide.classList.toggle("active", i === current);
        });
        if (window.FizzSwipe) {
          window.FizzSwipe.setTrackTransform(track, current, 0, false);
        }
      }

      function restartAutoplay() {
        if (timer) clearInterval(timer);
        timer = setInterval(function () {
          setActive(current + 1);
        }, 5000);
      }

      function pauseAutoplay() {
        if (timer) clearInterval(timer);
        timer = null;
      }

      setActive(0);
      restartAutoplay();

      if (window.FizzSwipe) {
        window.FizzSwipe.attachDiscrete({
          viewport: viewport,
          track: track,
          getIndex: function () {
            return current;
          },
          setIndex: function (index) {
            setActive(index);
            restartAutoplay();
          },
          slideCount: slides.length,
          onStart: pauseAutoplay,
          onEnd: restartAutoplay,
        });
      }
    });
  }

  function initHotspots(root) {
    root.querySelectorAll(".ks-hotspot-trigger").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const hotspot = btn.closest(".ks-hotspot");
        const open = hotspot.classList.contains("is-open");
        root.querySelectorAll(".ks-hotspot.is-open").forEach((el) => {
          el.classList.remove("is-open");
        });
        if (!open) hotspot.classList.add("is-open");
      });
    });
    document.addEventListener("click", () => {
      root.querySelectorAll(".ks-hotspot.is-open").forEach((el) => {
        el.classList.remove("is-open");
      });
    });
  }

  async function quickAdd(variantId, button) {
    if (!variantId) return;
    const original = button.textContent;
    button.disabled = true;
    button.textContent = "ADDING…";
    try {
      const res = await fetch(window.Shopify.routes.root + "cart/add.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [{ id: variantId, quantity: 1 }] }),
      });
      if (!res.ok) throw new Error("Add failed");
      const cartRes = await fetch(window.Shopify.routes.root + "cart.js");
      if (cartRes.ok) {
        const cart = await cartRes.json();
        document.dispatchEvent(new CustomEvent("fizz:cart-updated", { detail: { cart } }));
        if (window.FizzCart?.updateCartBadge) {
          window.FizzCart.updateCartBadge(cart.item_count);
        }
      }
      button.textContent = "ADDED";
      setTimeout(() => {
        button.textContent = original;
        button.disabled = false;
      }, 1500);
    } catch {
      button.textContent = "ERROR";
      button.disabled = false;
    }
  }

  function initQuickAdd(root) {
    root.querySelectorAll("[data-ks-quick-add]").forEach((btn) => {
      btn.addEventListener("click", () => {
        quickAdd(btn.dataset.ksQuickAdd, btn);
      });
    });
  }

  function initSectionReveal(root) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("opacity-100", "translate-y-0");
            entry.target.classList.remove("opacity-0", "translate-y-10");
          }
        });
      },
      { threshold: 0.1 },
    );
    root.querySelectorAll(".ks-reveal").forEach((el) => observer.observe(el));
  }

  function init(root) {
    if (!root) return;
    initHeroSlideshow(root);
    initHotspots(root);
    initQuickAdd(root);
    initSectionReveal(root);
  }

  document.addEventListener("DOMContentLoaded", () => init(document.body));
  document.addEventListener("shopify:section:load", (e) => init(e.target));
})();
