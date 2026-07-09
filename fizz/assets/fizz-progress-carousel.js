(function () {
  var instances = new WeakMap();

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function buildSegments(paginationEl, slideCount, onSelect) {
    paginationEl.innerHTML = "";
    for (var i = 0; i < slideCount; i++) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "fizz-progress-segment";
      button.setAttribute("role", "tab");
      button.setAttribute("aria-label", "Go to slide " + (i + 1));
      button.innerHTML =
        '<span class="fizz-progress-segment__track" aria-hidden="true">' +
        '<span class="fizz-progress-segment__fill"></span></span>';
      button.addEventListener("click", function (index) {
        return function () {
          onSelect(index);
        };
      }(i));
      paginationEl.appendChild(button);
    }
    return Array.from(paginationEl.querySelectorAll(".fizz-progress-segment"));
  }

  function updateSegments(segments, activeIndex, options) {
    var animate = options.animate;
    var durationMs = options.durationMs;

    segments.forEach(function (segment, index) {
      var fill = segment.querySelector(".fizz-progress-segment__fill");
      segment.classList.remove("is-complete", "is-active", "is-animating");
      segment.setAttribute("aria-selected", index === activeIndex ? "true" : "false");

      if (!fill) return;

      fill.style.transition = "none";

      if (index < activeIndex) {
        segment.classList.add("is-complete");
        fill.style.width = "100%";
      } else if (index === activeIndex) {
        segment.classList.add("is-active");
        fill.style.width = animate ? "0%" : "100%";

        if (animate && durationMs > 0) {
          requestAnimationFrame(function () {
            fill.style.transition = "width " + durationMs + "ms linear";
            segment.classList.add("is-animating");
            fill.style.width = "100%";
          });
        }
      } else {
        fill.style.width = "0%";
      }
    });
  }

  function destroyCarousel(root) {
    var record = instances.get(root);
    if (!record) return;
    if (record.swiper && record.swiper.destroy) {
      record.swiper.destroy(true, true);
    }
    instances.delete(root);
  }

  function initCarousel(root) {
    if (!root || instances.has(root)) return;
    if (typeof Swiper === "undefined") return;

    var swiperEl = root.querySelector("[data-fizz-progress-swiper]");
    var paginationEl = root.querySelector("[data-fizz-progress-pagination]");
    var prevBtn = root.querySelector("[data-fizz-progress-prev]");
    var nextBtn = root.querySelector("[data-fizz-progress-next]");
    var slides = swiperEl ? swiperEl.querySelectorAll(".swiper-slide") : [];
    var slideCount = slides.length;

    if (!swiperEl || slideCount < 2) return;

    var reducedMotion = prefersReducedMotion();
    if (reducedMotion) {
      root.classList.add("fizz-progress-carousel--reduced-motion");
    }

    var autoplayMs = parseInt(root.dataset.autoplayMs || "0", 10);
    if (reducedMotion) autoplayMs = 0;

    var mobileSpv = clamp(parseInt(root.dataset.slidesMobile, 10) || 1, 1, 4);
    var tabletSpv = clamp(parseInt(root.dataset.slidesTablet, 10) || 2, 1, 4);
    var desktopSpv = clamp(parseInt(root.dataset.slidesDesktop, 10) || 3, 1, 4);
    var maxSpv = Math.max(mobileSpv, tabletSpv, desktopSpv);
    var canLoop = slideCount > maxSpv;

    var swiper;
    var segments = [];

    function getRealIndex() {
      return swiper && typeof swiper.realIndex === "number" ? swiper.realIndex : 0;
    }

    function goToSlide(index) {
      if (!swiper) return;
      if (canLoop && swiper.slideToLoop) {
        swiper.slideToLoop(index);
      } else {
        swiper.slideTo(index);
      }
    }

    function restartProgress(activeIndex) {
      updateSegments(segments, activeIndex, {
        animate: autoplayMs > 0 && !reducedMotion,
        durationMs: autoplayMs,
      });
    }

    if (paginationEl) {
      segments = buildSegments(paginationEl, slideCount, goToSlide);
    }

    swiper = new Swiper(swiperEl, {
      loop: canLoop,
      slidesPerView: mobileSpv,
      spaceBetween: 16,
      grabCursor: true,
      speed: 500,
      watchOverflow: true,
      loopAdditionalSlides: canLoop ? maxSpv : 0,
      breakpoints: {
        768: { slidesPerView: tabletSpv, spaceBetween: 20 },
        1024: { slidesPerView: desktopSpv, spaceBetween: 24 },
      },
      autoplay:
        autoplayMs > 0
          ? {
              delay: autoplayMs,
              disableOnInteraction: false,
            }
          : false,
      navigation:
        prevBtn && nextBtn
          ? {
              prevEl: prevBtn,
              nextEl: nextBtn,
            }
          : undefined,
      on: {
        init: function () {
          restartProgress(getRealIndex());
        },
        slideChange: function () {
          restartProgress(getRealIndex());
        },
      },
    });

    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        if (swiper.autoplay && swiper.autoplay.running) {
          swiper.autoplay.start();
        }
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        if (swiper.autoplay && swiper.autoplay.running) {
          swiper.autoplay.start();
        }
      });
    }

    instances.set(root, { swiper: swiper });
  }

  function initAll(scope) {
    var container = scope || document;
    container.querySelectorAll("[data-fizz-progress-carousel]").forEach(initCarousel);
  }

  function boot() {
    initAll();

    document.addEventListener("shopify:section:load", function (event) {
      var root = event.target.querySelector("[data-fizz-progress-carousel]");
      if (!root) return;
      destroyCarousel(root);
      initCarousel(root);
    });

    document.addEventListener("shopify:section:unload", function (event) {
      var root = event.target.querySelector("[data-fizz-progress-carousel]");
      if (root) destroyCarousel(root);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
