(function () {
  var instances = new WeakMap();

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function destroyCarousel(root) {
    var record = instances.get(root);
    if (!record) return;
    if (record.swiper && record.swiper.destroy) {
      record.swiper.destroy(true, true);
    }
    instances.delete(root);
  }

  function waitForSwiper(callback, attempts) {
    if (typeof Swiper !== "undefined") {
      callback();
      return;
    }
    if (attempts <= 0) return;
    window.setTimeout(function () {
      waitForSwiper(callback, attempts - 1);
    }, 50);
  }

  function initCarousel(root) {
    if (!root || instances.has(root)) return;

    var swiperEl = root.querySelector("[data-fizz-lifestyle-swiper]");
    var prevBtn = root.querySelector("[data-fizz-lifestyle-prev]");
    var nextBtn = root.querySelector("[data-fizz-lifestyle-next]");
    var slides = swiperEl ? swiperEl.querySelectorAll(".swiper-slide") : [];
    var slideCount = slides.length;

    if (!swiperEl || slideCount < 1) return;

    var reducedMotion = prefersReducedMotion();
    if (reducedMotion || slideCount < 2) {
      root.classList.add("fizz-lifestyle-carousel--reduced-motion");
      instances.set(root, { swiper: null });
      return;
    }

    if (typeof Swiper === "undefined") return;

    var autoplayMs = parseInt(root.dataset.autoplayMs || "0", 10);
    if (reducedMotion) autoplayMs = 0;

    var rotate = parseInt(root.dataset.coverflowRotate || "42", 10);
    var depth = parseInt(root.dataset.coverflowDepth || "180", 10);
    var canLoop = slideCount >= 3;

    var swiper = new Swiper(swiperEl, {
      effect: "coverflow",
      grabCursor: true,
      centeredSlides: true,
      slidesPerView: "auto",
      loop: canLoop,
      loopAdditionalSlides: canLoop ? 2 : 0,
      speed: 650,
      watchOverflow: true,
      coverflowEffect: {
        rotate: rotate,
        stretch: 0,
        depth: depth,
        modifier: 1,
        slideShadows: false,
      },
      autoplay:
        autoplayMs > 0
          ? {
              delay: autoplayMs,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }
          : false,
      navigation:
        prevBtn && nextBtn
          ? {
              prevEl: prevBtn,
              nextEl: nextBtn,
            }
          : undefined,
      breakpoints: {
        0: {
          coverflowEffect: {
            rotate: Math.min(rotate, 36),
            stretch: -12,
            depth: Math.min(depth, 140),
            modifier: 1,
            slideShadows: false,
          },
        },
        768: {
          coverflowEffect: {
            rotate: rotate,
            stretch: 0,
            depth: depth,
            modifier: 1,
            slideShadows: false,
          },
        },
      },
    });

    instances.set(root, { swiper: swiper });
  }

  function initAll(scope) {
    var container = scope || document;
    container.querySelectorAll("[data-fizz-lifestyle-carousel]").forEach(function (root) {
      waitForSwiper(function () {
        initCarousel(root);
      }, 40);
    });
  }

  function boot() {
    initAll();

    document.addEventListener("shopify:section:load", function (event) {
      var root = event.target.querySelector("[data-fizz-lifestyle-carousel]");
      if (!root) return;
      destroyCarousel(root);
      waitForSwiper(function () {
        initCarousel(root);
      }, 40);
    });

    document.addEventListener("shopify:section:unload", function (event) {
      var root = event.target.querySelector("[data-fizz-lifestyle-carousel]");
      if (root) destroyCarousel(root);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
