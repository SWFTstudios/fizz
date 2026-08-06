(function () {
  var instances = new WeakMap();

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
    if (typeof Swiper !== 'undefined') {
      callback();
      return;
    }
    if (attempts <= 0) return;
    window.setTimeout(function () {
      waitForSwiper(callback, attempts - 1);
    }, 50);
  }

  function coverflowConfig(rotate, depth, stretch) {
    return {
      rotate: rotate,
      stretch: stretch,
      depth: depth,
      modifier: 1,
      slideShadows: false,
    };
  }

  function initCarousel(root) {
    if (!root || instances.has(root)) return;

    var swiperEl = root.querySelector('[data-nf-lifestyle-swiper]');
    var prevBtn = root.querySelector('[data-nf-lifestyle-prev]');
    var nextBtn = root.querySelector('[data-nf-lifestyle-next]');
    var slides = swiperEl ? swiperEl.querySelectorAll('.swiper-slide') : [];
    var slideCount = slides.length;

    if (!swiperEl || slideCount < 1) return;

    var reducedMotion = prefersReducedMotion();
    if (reducedMotion || slideCount < 2) {
      root.classList.add('nf-lifestyle-carousel--reduced-motion');
      instances.set(root, { swiper: null });
      return;
    }

    if (typeof Swiper === 'undefined') return;

    var autoplayMs = parseInt(root.dataset.autoplayMs || '0', 10);
    if (reducedMotion) autoplayMs = 0;

    var rotate = parseInt(root.dataset.coverflowRotate || '28', 10);
    var depth = parseInt(root.dataset.coverflowDepth || '140', 10);
    var stretch = parseInt(root.dataset.coverflowStretch || '-28', 10);
    var canLoop = slideCount >= 3;

    var swiper = new Swiper(swiperEl, {
      effect: 'coverflow',
      grabCursor: true,
      centeredSlides: true,
      slidesPerView: 'auto',
      loop: canLoop,
      loopAdditionalSlides: canLoop ? 2 : 0,
      speed: 700,
      watchOverflow: true,
      coverflowEffect: coverflowConfig(rotate, depth, stretch),
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
          coverflowEffect: coverflowConfig(
            Math.min(rotate, 24),
            Math.min(depth, 110),
            Math.max(stretch, -40)
          ),
        },
        768: {
          coverflowEffect: coverflowConfig(rotate, depth, stretch),
        },
      },
    });

    instances.set(root, { swiper: swiper });
  }

  function initAll(scope) {
    var container = scope || document;
    container.querySelectorAll('[data-nf-lifestyle-carousel]').forEach(function (root) {
      waitForSwiper(function () {
        initCarousel(root);
      }, 40);
    });
  }

  function boot() {
    initAll();

    document.addEventListener('shopify:section:load', function (event) {
      var root = event.target.querySelector('[data-nf-lifestyle-carousel]');
      if (!root) return;
      destroyCarousel(root);
      waitForSwiper(function () {
        initCarousel(root);
      }, 40);
    });

    document.addEventListener('shopify:section:unload', function (event) {
      var root = event.target.querySelector('[data-nf-lifestyle-carousel]');
      if (root) destroyCarousel(root);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
