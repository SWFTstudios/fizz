/*
  July 14th — sparkling page transitions.

  Sequence (must stay in this order):
    1. Click a same-origin link / button-with-href
    2. Prefetch destination immediately
    3. Bubbles appear + grow fast (fizz) — FULL animation finishes
    4. Swipe cover completes
    5. Navigate (only after 3 + 4 + prefetch settle / timeout)
    6. Enter: reverse swipe reveal on the new page
*/
(function () {
  'use strict';

  if (window.__j14Transition) return;
  window.__j14Transition = true;

  var STORAGE_KEY = 'j14-tx';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var motionOff = document.documentElement.classList.contains('j14-no-motion') || reduced;
  var enabled = document.documentElement.dataset.j14Transitions !== 'false';

  if (reduced) document.documentElement.classList.add('j14-no-motion');

  var busy = false;
  var prefetchCache = {};
  var ov, swipe, canvas, ctx, rafId = 0, particles = [];

  /* ---------- Overlay DOM ---------- */

  function ensureOverlay() {
    if (ov) return;
    ov = document.createElement('div');
    ov.id = 'j14-tx';
    ov.setAttribute('aria-hidden', 'true');
    ov.innerHTML =
      '<div class="j14-tx__swipe" data-j14-tx-swipe></div>' +
      '<canvas class="j14-tx__bubbles" data-j14-tx-canvas></canvas>';
    document.body.appendChild(ov);
    swipe = ov.querySelector('[data-j14-tx-swipe]');
    canvas = ov.querySelector('[data-j14-tx-canvas]');
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });
  }

  function resizeCanvas() {
    if (!canvas || !ctx) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = window.innerWidth;
    var h = window.innerHeight;
    canvas.width = Math.max(1, Math.floor(w * dpr));
    canvas.height = Math.max(1, Math.floor(h * dpr));
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* ---------- Bubbles ---------- */

  function Bubble(seed) {
    var w = window.innerWidth;
    var h = window.innerHeight;
    this.x = seed.x != null ? seed.x : Math.random() * w;
    this.y = seed.y != null ? seed.y : h * (0.55 + Math.random() * 0.45);
    this.rMax = seed.rMax != null ? seed.rMax : 10 + Math.random() * 38;
    this.r = 1 + Math.random() * 3;
    this.grow = 0.45 + Math.random() * 0.9; /* grows fast — fizz pop */
    this.vx = (Math.random() - 0.5) * 1.8;
    this.vy = 3.2 + Math.random() * 5.5;
    this.life = 0;
    this.maxLife = 42 + Math.floor(Math.random() * 36);
    this.wobble = Math.random() * Math.PI * 2;
  }

  Bubble.prototype.step = function () {
    this.life += 1;
    this.wobble += 0.12;
    /* Fast growth early, then hold */
    if (this.r < this.rMax) {
      this.r += (this.rMax - this.r) * this.grow * 0.35 + this.grow;
      if (this.r > this.rMax) this.r = this.rMax;
    }
    this.x += this.vx + Math.sin(this.wobble) * 0.6;
    this.y -= this.vy;
  };

  Bubble.prototype.alpha = function () {
    var t = this.life / this.maxLife;
    if (t < 0.08) return t / 0.08;
    if (t > 0.75) return Math.max(0, (1 - t) / 0.25);
    return 1;
  };

  Bubble.prototype.draw = function (c) {
    var a = this.alpha();
    if (a <= 0.02 || this.r < 0.5) return;
    c.save();
    c.globalAlpha = a * 0.92;
    c.beginPath();
    c.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    var g = c.createRadialGradient(
      this.x - this.r * 0.35,
      this.y - this.r * 0.35,
      this.r * 0.05,
      this.x,
      this.y,
      this.r
    );
    g.addColorStop(0, 'rgba(255,255,255,0.85)');
    g.addColorStop(0.45, 'rgba(198,242,78,0.35)');
    g.addColorStop(1, 'rgba(210,248,255,0.12)');
    c.fillStyle = g;
    c.fill();
    c.lineWidth = Math.max(1.2, this.r * 0.07);
    c.strokeStyle = 'rgba(255,255,255,0.9)';
    c.stroke();
    c.restore();
  };

  function burst(count, origin) {
    resizeCanvas();
    for (var i = 0; i < count; i++) {
      var seed = {};
      if (origin) {
        seed.x = origin.x + (Math.random() - 0.5) * 120;
        seed.y = origin.y + (Math.random() - 0.5) * 80 + window.innerHeight * 0.15;
      }
      particles.push(new Bubble(seed));
    }
    startLoop();
  }

  function tick() {
    rafId = 0;
    if (!ctx) return;
    var w = window.innerWidth;
    var h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);
    particles = particles.filter(function (p) {
      p.step();
      if (p.life >= p.maxLife || p.y + p.r < -40) return false;
      p.draw(ctx);
      return true;
    });
    if (particles.length) {
      rafId = requestAnimationFrame(tick);
    }
  }

  function startLoop() {
    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  function clearBubbles() {
    particles = [];
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
    if (ctx) ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }

  function waitForBubbles(minMs) {
    return new Promise(function (resolve) {
      var start = performance.now();
      function check() {
        var elapsed = performance.now() - start;
        if (elapsed >= minMs && particles.length === 0) {
          resolve();
          return;
        }
        /* Soft cap so a stray particle cannot trap navigation */
        if (elapsed >= minMs + 900) {
          clearBubbles();
          resolve();
          return;
        }
        requestAnimationFrame(check);
      }
      requestAnimationFrame(check);
    });
  }

  /* ---------- Prefetch ---------- */

  function prefetch(url) {
    if (prefetchCache[url]) return prefetchCache[url];
    prefetchCache[url] = new Promise(function (resolve) {
      try {
        var link = document.createElement('link');
        link.rel = 'prefetch';
        link.as = 'document';
        link.href = url;
        document.head.appendChild(link);
      } catch (err) {}

      var settled = false;
      var done = function () {
        if (settled) return;
        settled = true;
        resolve(true);
      };

      fetch(url, {
        credentials: 'same-origin',
        mode: 'same-origin',
        headers: { Purpose: 'prefetch', 'Sec-Purpose': 'prefetch' }
      })
        .then(function () {
          done();
        })
        .catch(function () {
          done();
        });

      /* Never block navigation forever */
      setTimeout(done, 3200);
    });
    return prefetchCache[url];
  }

  /* ---------- Swipe ---------- */

  function animateSwipeCover() {
    return new Promise(function (resolve) {
      ensureOverlay();
      ov.classList.add('is-active');
      ov.style.pointerEvents = 'auto';
      swipe.classList.remove('is-exit');
      /* Force reflow so enter transition runs from left */
      void swipe.offsetWidth;
      swipe.classList.add('is-cover');
      var finished = false;
      var finish = function () {
        if (finished) return;
        finished = true;
        resolve();
      };
      swipe.addEventListener('transitionend', finish, { once: true });
      setTimeout(finish, 720);
    });
  }

  function animateSwipeReveal() {
    return new Promise(function (resolve) {
      ensureOverlay();
      ov.classList.add('is-active');
      swipe.classList.add('is-cover');
      void swipe.offsetWidth;
      requestAnimationFrame(function () {
        swipe.classList.add('is-exit');
        swipe.classList.remove('is-cover');
        var finished = false;
        var finish = function () {
          if (finished) return;
          finished = true;
          ov.classList.remove('is-active');
          swipe.classList.remove('is-exit', 'is-cover');
          ov.style.pointerEvents = 'none';
          clearBubbles();
          resolve();
        };
        swipe.addEventListener('transitionend', finish, { once: true });
        setTimeout(finish, 780);
      });
    });
  }

  /* ---------- Navigation gate ---------- */

  function shouldAnimate(el, href) {
    if (!enabled || motionOff) return false;
    if (!href || href.charAt(0) === '#') return false;
    if (/^(mailto:|tel:|javascript:)/i.test(href)) return false;
    if (el.hasAttribute('download') || el.target === '_blank') return false;
    if (el.dataset.noTransition !== undefined) return false;

    var url;
    try {
      url = new URL(href, window.location.href);
    } catch (err) {
      return false;
    }
    if (url.origin !== window.location.origin) return false;
    if (/\/cart\/add|\/cart\/change|\/cart\/update|\/checkout|\/account\/logout|\/admin\b/i.test(url.pathname)) {
      return false;
    }
    /* Same path + query with only a hash — allow native jump */
    if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) {
      return false;
    }
    return true;
  }

  function clickOrigin(e) {
    return { x: e.clientX || window.innerWidth * 0.5, y: e.clientY || window.innerHeight * 0.65 };
  }

  function navigateWithTransition(href, origin) {
    if (busy) return;
    busy = true;

    ensureOverlay();
    ov.classList.add('is-active');
    ov.style.pointerEvents = 'auto';

    var ready = prefetch(href);

    /* Phase 1 — fizz bubbles grow + rise to completion */
    burst(36, origin);
    setTimeout(function () {
      burst(22, origin);
    }, 90);
    setTimeout(function () {
      burst(14, origin);
    }, 200);

    waitForBubbles(720)
      .then(function () {
        /* Phase 2 — swipe cover (only after bubbles finish) */
        return animateSwipeCover();
      })
      .then(function () {
        return Promise.race([
          ready,
          new Promise(function (r) {
            setTimeout(r, 200);
          })
        ]);
      })
      .then(function () {
        try {
          sessionStorage.setItem(STORAGE_KEY, '1');
        } catch (err) {}
        window.location.href = href;
      })
      .catch(function () {
        busy = false;
        window.location.href = href;
      });
  }

  document.addEventListener(
    'click',
    function (e) {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var el = e.target.closest && e.target.closest('a[href], button[data-href]');
      if (!el) return;
      var href = el.getAttribute('href') || el.getAttribute('data-href');
      if (!shouldAnimate(el, href)) return;
      e.preventDefault();
      navigateWithTransition(href, clickOrigin(e));
    },
    true
  );

  /* Hover prefetch for snappier feel once intentional */
  document.addEventListener(
    'pointerenter',
    function (e) {
      if (!enabled || motionOff || busy) return;
      var el = e.target.closest && e.target.closest('a[href]');
      if (!el) return;
      var href = el.getAttribute('href');
      if (!shouldAnimate(el, href)) return;
      prefetch(href);
    },
    true
  );

  function onReady() {
    var flag = false;
    try {
      flag = sessionStorage.getItem(STORAGE_KEY) === '1';
      if (flag) sessionStorage.removeItem(STORAGE_KEY);
    } catch (err) {}

    if (!flag || motionOff || !enabled) return;

    ensureOverlay();
    ov.classList.add('is-active');
    swipe.classList.add('is-cover');
    burst(28, { x: window.innerWidth * 0.5, y: window.innerHeight * 0.85 });
    requestAnimationFrame(function () {
      animateSwipeReveal();
    });
  }

  if (document.body) onReady();
  else document.addEventListener('DOMContentLoaded', onReady);

  window.J14Transition = {
    go: function (href, origin) {
      if (!href) return;
      navigateWithTransition(href, origin || { x: window.innerWidth * 0.5, y: window.innerHeight * 0.6 });
    }
  };
})();
