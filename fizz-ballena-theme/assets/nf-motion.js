/*
  NeoFizz scroll motion — reveals, marquee, feature accordion.
*/
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var motionOff =
    document.documentElement.classList.contains('nf-no-motion') || reduced;
  if (reduced) document.documentElement.classList.add('nf-no-motion');

  function initReveals() {
    var nodes = document.querySelectorAll('[data-nf-reveal]');
    if (!nodes.length) return;
    if (motionOff || typeof IntersectionObserver === 'undefined') {
      nodes.forEach(function (el) {
        el.classList.add('is-in');
      });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: '0px 0px -8% 0px' }
    );
    nodes.forEach(function (el) {
      io.observe(el);
    });
  }

  function rebuildNfMarqueeTrack(root, track) {
    var sourceHtml = root._nfMarqueeSourceHtml;
    if (!sourceHtml) {
      sourceHtml = track.innerHTML;
      root._nfMarqueeSourceHtml = sourceHtml;
    }

    track.innerHTML = sourceHtml;
    track.style.animation = 'none';
    track.style.transform = '';

    Array.prototype.forEach.call(track.children, function (child) {
      child.setAttribute('data-nf-marquee-original', 'true');
    });

    var safety = 0;
    while (track.scrollWidth < root.clientWidth && safety < 40) {
      var base = track.querySelectorAll('[data-nf-marquee-original]');
      if (!base.length) break;
      var frag = document.createDocumentFragment();
      Array.prototype.forEach.call(base, function (child) {
        var clone = child.cloneNode(true);
        clone.removeAttribute('data-nf-marquee-original');
        clone.setAttribute('aria-hidden', 'true');
        frag.appendChild(clone);
      });
      track.appendChild(frag);
      safety += 1;
    }

    var filledCount = track.children.length;
    track.insertAdjacentHTML('beforeend', track.innerHTML);
    Array.prototype.forEach.call(track.children, function (child, i) {
      if (i >= filledCount) {
        child.setAttribute('aria-hidden', 'true');
      }
    });

    track.style.animation = '';
  }

  function initMarqueeRoot(root, resetSource) {
    var track = root.querySelector('[data-nf-marquee-track]');
    if (!track) return;

    if (resetSource) {
      delete root._nfMarqueeSourceHtml;
    }

    root.classList.remove('is-running', 'is-static');

    if (motionOff) {
      root.classList.add('is-static');
      return;
    }

    rebuildNfMarqueeTrack(root, track);
    root.classList.add('is-running');
  }

  function initMarquee(resetSource) {
    document.querySelectorAll('[data-nf-marquee]').forEach(function (section) {
      initMarqueeRoot(section, !!resetSource);
    });
  }

  var nfMarqueeResizeTimer;
  function onNfMarqueeResize() {
    clearTimeout(nfMarqueeResizeTimer);
    nfMarqueeResizeTimer = setTimeout(function () {
      initMarquee(false);
    }, 200);
  }

  function initFeatures() {
    document.querySelectorAll('[data-nf-features]').forEach(function (section) {
      var cards = Array.prototype.slice.call(
        section.querySelectorAll('[data-nf-features-card]')
      );
      var layers = Array.prototype.slice.call(
        section.querySelectorAll('[data-nf-features-layer]')
      );
      if (!cards.length) return;

      function activate(idx) {
        cards.forEach(function (card, i) {
          card.classList.toggle('is-active', i === idx);
        });
        layers.forEach(function (layer, i) {
          layer.classList.toggle('is-active', i === idx);
        });
      }

      cards.forEach(function (card, idx) {
        card.addEventListener('mouseenter', function () {
          activate(idx);
        });
        card.addEventListener('focusin', function () {
          activate(idx);
        });
        card.addEventListener('click', function () {
          activate(idx);
        });
      });

      if (motionOff || typeof IntersectionObserver === 'undefined') return;

      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            var idx = cards.indexOf(entry.target);
            if (idx >= 0) activate(idx);
          });
        },
        { threshold: 0.55, rootMargin: '-10% 0px -25% 0px' }
      );
      cards.forEach(function (card) {
        io.observe(card);
      });
    });
  }

  function initBentoStagger() {
    if (motionOff || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    document.querySelectorAll('[data-nf-bento]').forEach(function (section) {
      var cards = section.querySelectorAll('[data-nf-bento-card]');
      if (!cards.length) return;
      gsap.from(cards, {
        opacity: 0,
        y: 40,
        duration: 0.7,
        stagger: 0.12,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 75%',
          once: true
        }
      });
    });
  }

  function boot(resetMarqueeSource) {
    initReveals();
    initMarquee(!!resetMarqueeSource);
    initFeatures();
    initBentoStagger();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      boot(false);
    });
  } else {
    boot(false);
  }

  window.addEventListener('resize', onNfMarqueeResize);

  document.addEventListener('shopify:section:load', function (event) {
    var root = event.target && event.target.querySelector('[data-nf-marquee]');
    if (root) {
      initMarqueeRoot(root, true);
      initReveals();
      return;
    }
    boot(false);
  });
})();
