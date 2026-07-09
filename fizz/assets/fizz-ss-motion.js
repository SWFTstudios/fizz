/**
 * Fizz SS motion runtime — GSAP + ScrollTrigger + Lenis
 * Replicates Stone Sip–style split/fade/marquee without Club plugins.
 */
(function () {
  'use strict';

  var reduced =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  function waitForGsap(cb, attempts) {
    attempts = attempts || 0;
    if (window.gsap && window.ScrollTrigger) {
      cb();
      return;
    }
    if (attempts > 80) return;
    setTimeout(function () {
      waitForGsap(cb, attempts + 1);
    }, 50);
  }

  function splitWords(el) {
    if (el.dataset.ssSplitDone === 'true') return el.querySelectorAll('.ss-split-word > span');
    var text = el.textContent || '';
    var words = text.trim().split(/\s+/);
    el.setAttribute('aria-label', text.trim());
    el.textContent = '';
    words.forEach(function (word) {
      var wrap = document.createElement('span');
      wrap.className = 'ss-split-word';
      wrap.setAttribute('aria-hidden', 'true');
      var inner = document.createElement('span');
      inner.textContent = word;
      wrap.appendChild(inner);
      el.appendChild(wrap);
    });
    el.dataset.ssSplitDone = 'true';
    return el.querySelectorAll('.ss-split-word > span');
  }

  /**
   * Smooth scroll is OFF by default — native scroll feels immediate on commerce pages.
   * To re-enable a snappy Lenis pass, set:
   *   <html data-ss-smooth-scroll="true">
   * or window.FIZZ_SMOOTH_SCROLL = true before this script runs.
   * Tuned for low lag: lerp ~0.14, no long duration curve.
   */
  function initLenis() {
    var enabled =
      window.FIZZ_SMOOTH_SCROLL === true ||
      (document.documentElement &&
        document.documentElement.getAttribute('data-ss-smooth-scroll') === 'true');

    if (!enabled || reduced || typeof Lenis === 'undefined') return null;

    // Skip on touch / coarse pointers — virtualized wheel feels worse there.
    var finePointer =
      window.matchMedia && window.matchMedia('(pointer: fine)').matches;
    if (!finePointer) return null;

    var lenis = new Lenis({
      lerp: 0.14,
      wheelMultiplier: 1,
      touchMultiplier: 1.2,
      smoothWheel: true,
      syncTouch: false,
      autoResize: true
    });

    if (window.ScrollTrigger) {
      lenis.on('scroll', ScrollTrigger.update);
    }

    gsap.ticker.add(function (time) {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
    window.fizzLenis = lenis;
    return lenis;
  }

  function initMarquees() {
    document.querySelectorAll('[data-ss-marquee]').forEach(function (root) {
      var track = root.querySelector('[data-ss-marquee-track]');
      if (!track || track.dataset.ssMarqueeInit === 'true') return;
      track.dataset.ssMarqueeInit = 'true';
      var speed = parseFloat(root.getAttribute('data-ss-speed') || '35');
      var html = track.innerHTML;
      track.innerHTML = html + html;

      if (reduced || !window.gsap) {
        return;
      }

      var tween = gsap.to(track, {
        xPercent: -50,
        ease: 'none',
        duration: speed,
        repeat: -1
      });

      root.addEventListener('mouseenter', function () {
        tween.pause();
      });
      root.addEventListener('mouseleave', function () {
        tween.resume();
      });
    });
  }

  function animateSplit(el) {
    var duration = parseFloat(el.getAttribute('data-ss-duration') || '0.45');
    var delay = parseFloat(el.getAttribute('data-ss-delay') || '0');
    var words = splitWords(el);
    if (reduced) {
      gsap.set(words, { yPercent: 0, opacity: 1 });
      return;
    }
    gsap.fromTo(
      words,
      { yPercent: 110, opacity: 0 },
      {
        yPercent: 0,
        opacity: 1,
        duration: duration,
        delay: delay,
        stagger: 0.04,
        ease: 'power3.out'
      }
    );
  }

  function animateFade(el) {
    var duration = parseFloat(el.getAttribute('data-ss-duration') || '0.55');
    var delay = parseFloat(el.getAttribute('data-ss-delay') || '0');
    if (reduced) {
      gsap.set(el, { y: 0, opacity: 1 });
      return;
    }
    gsap.fromTo(
      el,
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: duration,
        delay: delay,
        ease: 'power3.out'
      }
    );
  }

  function initLoadAnimations() {
    document.querySelectorAll('[data-ss-trigger="load"]').forEach(function (el) {
      if (el.hasAttribute('data-ss-split')) animateSplit(el);
      else if (el.hasAttribute('data-ss-fade')) animateFade(el);
    });
  }

  function initScrollAnimations() {
    document.querySelectorAll('[data-ss-trigger="scroll"]').forEach(function (el) {
      if (reduced) {
        if (el.hasAttribute('data-ss-split')) splitWords(el);
        gsap.set(el, { clearProps: 'all' });
        return;
      }

      if (el.hasAttribute('data-ss-split')) {
        var words = splitWords(el);
        gsap.set(words, { yPercent: 110, opacity: 0 });
        ScrollTrigger.create({
          trigger: el,
          start: 'top 85%',
          once: true,
          onEnter: function () {
            gsap.to(words, {
              yPercent: 0,
              opacity: 1,
              duration: parseFloat(el.getAttribute('data-ss-duration') || '0.45'),
              stagger: 0.04,
              ease: 'power3.out'
            });
          }
        });
      } else if (el.hasAttribute('data-ss-fade')) {
        gsap.set(el, { y: 40, opacity: 0 });
        ScrollTrigger.create({
          trigger: el,
          start: 'top 88%',
          once: true,
          onEnter: function () {
            animateFade(el);
          }
        });
      }
    });

    document.querySelectorAll('[data-ss-stagger]').forEach(function (root) {
      var children = root.children;
      if (!children.length) return;
      if (reduced) return;
      gsap.set(children, { y: 36, opacity: 0 });
      ScrollTrigger.create({
        trigger: root,
        start: 'top 88%',
        once: true,
        onEnter: function () {
          gsap.to(children, {
            y: 0,
            opacity: 1,
            duration: 0.55,
            stagger: 0.08,
            ease: 'power3.out'
          });
        }
      });
    });
  }

  function initQtySteppers() {
    document.querySelectorAll('[data-ss-qty]').forEach(function (wrap) {
      var input = wrap.querySelector('input[type="number"]');
      var minus = wrap.querySelector('[data-ss-qty-minus]');
      var plus = wrap.querySelector('[data-ss-qty-plus]');
      if (!input) return;
      if (minus) {
        minus.addEventListener('click', function () {
          var v = Math.max(1, (parseInt(input.value, 10) || 1) - 1);
          input.value = v;
        });
      }
      if (plus) {
        plus.addEventListener('click', function () {
          var v = (parseInt(input.value, 10) || 1) + 1;
          input.value = v;
        });
      }
    });
  }

  ready(function () {
    document.documentElement.classList.add('fizz-ss-ready');
    waitForGsap(function () {
      gsap.registerPlugin(ScrollTrigger);
      initLenis();
      initMarquees();
      initLoadAnimations();
      initScrollAnimations();
      initQtySteppers();
      ScrollTrigger.refresh();
    });
  });
})();
