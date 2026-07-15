/*
  July 14th — page transitions (melt default + classic swipe rollback).

  Melt leave: micro-bubbles nucleate across the viewport, merge via SVG goo,
  flood with brand accent, then navigate (destination prefetched during melt).
  Melt enter: solid field fractures into rising bubbles.
  Classic: original swipe + fizz burst.
*/
(function () {
  'use strict';

  if (window.__j14Transition) return;
  window.__j14Transition = true;

  var STORAGE_KEY = 'j14-tx';
  var TRANS_VERSION = 'melt-v2';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var motionOff = document.documentElement.classList.contains('j14-no-motion') || reduced;
  var enabled = document.documentElement.dataset.j14Transitions !== 'false';

  if (reduced) document.documentElement.classList.add('j14-no-motion');

  function getTransitionStyle() {
    var raw = (document.documentElement.dataset.j14TransitionStyle || 'melt').toLowerCase();
    return raw === 'classic' ? 'classic' : 'melt';
  }

  function readCssColor(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  function getMeltColors() {
    return {
      liquid: readCssColor('--j14-accent', '#c6f24e'),
      ink: readCssColor('--j14-dark', '#080a0d'),
      paper: readCssColor('--j14-paper', '#f2efe7'),
    };
  }

  function isCoarse() {
    return window.matchMedia && matchMedia('(pointer: coarse)').matches;
  }

  function intensityScale() {
    var raw = parseFloat(document.documentElement.dataset.j14TransitionIntensity || '100');
    if (isNaN(raw) || raw < 50) raw = 100;
    if (raw > 150) raw = 150;
    return raw / 100;
  }

  var style = document.createElement('style');
  style.textContent =
    '#j14-tx{position:fixed;inset:0;z-index:99999;pointer-events:none;visibility:hidden;overflow:hidden}' +
    '#j14-tx.is-active{visibility:visible}' +
    '#j14-tx.melt-mode .j14-tx__swipe,#j14-tx.melt-mode .j14-tx__bubbles{display:none!important;visibility:hidden!important;opacity:0!important}' +
    '#j14-tx.classic-mode .j14-tx__melt-wrap,#j14-tx.classic-mode .j14-tx__melt-under,#j14-tx.classic-mode .j14-tx__melt-spark{display:none!important}' +
    '.j14-tx__stage{position:absolute;inset:0}' +
    '.j14-tx__swipe{position:absolute;inset:0;transform:translateX(-105%);background:linear-gradient(115deg,var(--j14-dark,#080a0d) 0%,#142018 52%,#3d4a18 100%);transition:transform .58s cubic-bezier(.65,0,.25,1);will-change:transform;z-index:1}' +
    '.j14-tx__swipe.is-cover{transform:translateX(0)}' +
    '.j14-tx__swipe.is-exit{transform:translateX(105%);transition-duration:.62s}' +
    '.j14-tx__bubbles{position:absolute;inset:0;width:100%;height:100%;z-index:3;pointer-events:none;mix-blend-mode:screen}' +
    '.j14-tx__melt-under{position:absolute;inset:0;z-index:1;opacity:0;background:var(--j14-accent,#c6f24e);pointer-events:none}' +
    '.j14-tx__melt-wrap{position:absolute;inset:-10%;z-index:2;pointer-events:none;filter:url(#j14-goo);-webkit-filter:url(#j14-goo);visibility:hidden}' +
    '.j14-tx__melt-canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}' +
    '.j14-tx__melt-spark{position:absolute;inset:0;z-index:4;pointer-events:none;mix-blend-mode:soft-light;opacity:.65;visibility:hidden}' +
    '#j14-goo-svg{position:absolute;width:0;height:0;overflow:hidden}' +
    '.j14-no-motion #j14-tx{display:none!important}';
  document.head.appendChild(style);

  var busy = false;
  var covering = false;
  var prefetchCache = {};
  var ov,
    swipe,
    canvas,
    ctx,
    meltWrap,
    meltCanvas,
    meltCtx,
    meltUnder,
    meltSpark,
    sparkCtx,
    gooSvg,
    rafId = 0,
    particles = [],
    meltParticles = [],
    sparkParticles = [],
    meltRaf = 0,
    meltPhase = null,
    meltStart = 0,
    meltCb = null,
    meltDone = false;

  function ensureGooSvg() {
    if (gooSvg) return;
    gooSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    gooSvg.id = 'j14-goo-svg';
    gooSvg.setAttribute('aria-hidden', 'true');
    gooSvg.innerHTML =
      '<defs><filter id="j14-goo" x="-40%" y="-40%" width="180%" height="180%" color-interpolation-filters="sRGB">' +
      '<feGaussianBlur in="SourceGraphic" stdDeviation="14" result="blur"/>' +
      '<feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" result="goo"/>' +
      '</filter></defs>';
    document.body.appendChild(gooSvg);
  }

  function ensureOverlay() {
    if (ov) return;
    ensureGooSvg();
    ov = document.createElement('div');
    ov.id = 'j14-tx';
    ov.setAttribute('aria-hidden', 'true');
    ov.setAttribute('data-ft-ver', TRANS_VERSION);
    ov.innerHTML =
      '<div class="j14-tx__stage" data-j14-tx-stage>' +
      '<div class="j14-tx__melt-under" data-j14-tx-melt-under></div>' +
      '<div class="j14-tx__swipe" data-j14-tx-swipe></div>' +
      '<div class="j14-tx__melt-wrap" data-j14-tx-melt-wrap><canvas class="j14-tx__melt-canvas" data-j14-tx-melt-canvas></canvas></div>' +
      '<canvas class="j14-tx__melt-spark" data-j14-tx-melt-spark></canvas>' +
      '<canvas class="j14-tx__bubbles" data-j14-tx-canvas></canvas>' +
      '</div>';
    document.body.appendChild(ov);
    swipe = ov.querySelector('[data-j14-tx-swipe]');
    canvas = ov.querySelector('[data-j14-tx-canvas]');
    ctx = canvas.getContext('2d');
    meltUnder = ov.querySelector('[data-j14-tx-melt-under]');
    meltWrap = ov.querySelector('[data-j14-tx-melt-wrap]');
    meltCanvas = ov.querySelector('[data-j14-tx-melt-canvas]');
    meltCtx = meltCanvas.getContext('2d');
    meltSpark = ov.querySelector('[data-j14-tx-melt-spark]');
    sparkCtx = meltSpark.getContext('2d');
    resizeCanvas();
    resizeMeltCanvas();
    window.addEventListener(
      'resize',
      function () {
        resizeCanvas();
        resizeMeltCanvas();
      },
      { passive: true }
    );
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

  function resizeMeltCanvas() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = window.innerWidth;
    var h = window.innerHeight;
    var pad = 0.1;
    var cw = w * (1 + pad * 2);
    var ch = h * (1 + pad * 2);
    if (meltCanvas && meltCtx) {
      meltCanvas.width = Math.max(1, Math.floor(cw * dpr));
      meltCanvas.height = Math.max(1, Math.floor(ch * dpr));
      meltCanvas.style.width = cw + 'px';
      meltCanvas.style.height = ch + 'px';
      meltCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    if (meltSpark && sparkCtx) {
      meltSpark.width = Math.max(1, Math.floor(w * dpr));
      meltSpark.height = Math.max(1, Math.floor(h * dpr));
      meltSpark.style.width = w + 'px';
      meltSpark.style.height = h + 'px';
      sparkCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  /* ---------- Classic swipe bubbles ---------- */
  function Bubble(seed) {
    var w = window.innerWidth;
    var h = window.innerHeight;
    this.x = seed.x != null ? seed.x : Math.random() * w;
    this.y = seed.y != null ? seed.y : h * (0.55 + Math.random() * 0.45);
    this.rMax = seed.rMax != null ? seed.rMax : 10 + Math.random() * 38;
    this.r = 1 + Math.random() * 3;
    this.grow = 0.45 + Math.random() * 0.9;
    this.vx = (Math.random() - 0.5) * 1.4;
    this.vy = 3.2 + Math.random() * 5.5;
    this.life = 0;
    this.maxLife = 48 + Math.floor(Math.random() * 40);
    this.wobble = Math.random() * Math.PI * 2;
  }

  Bubble.prototype.step = function () {
    this.life += 1;
    this.wobble += 0.12;
    if (this.r < this.rMax) {
      this.r += (this.rMax - this.r) * this.grow * 0.35 + this.grow;
      if (this.r > this.rMax) this.r = this.rMax;
    }
    var ride = covering ? 7.5 : 0;
    this.x += this.vx + ride + Math.sin(this.wobble) * 0.6;
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
        seed.y = origin.y + (Math.random() - 0.5) * 80 + window.innerHeight * 0.1;
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
      if (p.life >= p.maxLife || p.y + p.r < -40 || p.x - p.r > w + 80) return false;
      p.draw(ctx);
      return true;
    });
    if (particles.length) rafId = requestAnimationFrame(tick);
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

  /* ---------- Melt ---------- */
  function MeltBlob(x, y, radius, dx, dy, grow, delay) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.baseRadius = radius;
    this.dx = dx;
    this.dy = dy;
    this.grow = grow || 0;
    this.delay = delay || 0;
    this.phase = Math.random() * Math.PI * 2;
  }

  function meltBudget() {
    var base = Math.round(110 * intensityScale());
    if (isCoarse()) base = Math.round(base * 0.55);
    if (window.innerWidth < 720) base = Math.round(base * 0.7);
    return Math.max(48, Math.min(140, base));
  }

  function spawnMeltLeaveBlobs(n) {
    var w = window.innerWidth;
    var h = window.innerHeight;
    meltParticles = [];
    sparkParticles = [];
    for (var i = 0; i < n; i++) {
      var r = 6 + Math.random() * 18 * intensityScale();
      var edge = Math.random();
      var x, y;
      if (edge < 0.2) {
        x = Math.random() * w;
        y = -r - Math.random() * 40;
      } else if (edge < 0.4) {
        x = Math.random() * w;
        y = h + r + Math.random() * 40;
      } else if (edge < 0.55) {
        x = -r - Math.random() * 40;
        y = Math.random() * h;
      } else if (edge < 0.7) {
        x = w + r + Math.random() * 40;
        y = Math.random() * h;
      } else {
        x = Math.random() * w;
        y = Math.random() * h;
      }
      meltParticles.push(
        new MeltBlob(x, y, r, (Math.random() - 0.5) * 0.9, (Math.random() - 0.5) * 0.9, 0.35 + Math.random() * 0.55, Math.random() * 0.28)
      );
    }
    for (var s = 0; s < Math.round(n * 0.7); s++) {
      sparkParticles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 1.5 + Math.random() * 4,
        dx: (Math.random() - 0.5) * 1.4,
        dy: -1.2 - Math.random() * 2.8,
      });
    }
  }

  function spawnMeltEnterBlobs(n) {
    var w = window.innerWidth;
    var h = window.innerHeight;
    meltParticles = [];
    sparkParticles = [];
    for (var i = 0; i < n; i++) {
      var r = 22 + Math.random() * 48 * intensityScale();
      meltParticles.push(
        new MeltBlob(
          Math.random() * w,
          Math.random() * h,
          r,
          (Math.random() - 0.5) * 1.8,
          -0.4 - Math.random() * 2.4,
          -0.55 - Math.random() * 0.35,
          Math.random() * 0.2
        )
      );
    }
    for (var s = 0; s < Math.round(n * 0.8); s++) {
      sparkParticles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 1.2 + Math.random() * 3.5,
        dx: (Math.random() - 0.5) * 2,
        dy: -2 - Math.random() * 4,
      });
    }
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function drawMeltFrame(progress, phase) {
    if (!meltCtx) return;
    var w = window.innerWidth;
    var h = window.innerHeight;
    var padX = w * 0.1;
    var padY = h * 0.1;
    var colors = getMeltColors();
    var t = phase === 'leave' ? easeOutCubic(progress) : easeInOut(progress);
    var cw = w + padX * 2;
    var ch = h + padY * 2;

    meltCtx.clearRect(0, 0, cw, ch);
    meltCtx.fillStyle = colors.liquid;

    for (var i = 0; i < meltParticles.length; i++) {
      var p = meltParticles[i];
      var local = Math.max(0, Math.min(1, (progress - p.delay) / Math.max(0.001, 1 - p.delay)));
      local = phase === 'leave' ? easeOutCubic(local) : easeInOut(local);
      p.x += p.dx;
      p.y += p.dy;
      p.phase += 0.045;
      var wobble = Math.sin(p.phase) * (4 + local * 8);
      var rx = p.x + padX + wobble;
      var ry = p.y + padY + Math.cos(p.phase * 0.85) * 3;
      var rad;
      if (phase === 'leave') {
        rad = p.baseRadius + local * (100 + p.baseRadius * 4.5) * intensityScale();
        rx += (w * 0.5 + padX - rx) * local * 0.1;
        ry += (h * 0.5 + padY - ry) * local * 0.1;
      } else {
        rad = Math.max(0.4, p.baseRadius * (1 - local * 0.94));
        ry -= local * 48;
      }
      meltCtx.beginPath();
      meltCtx.arc(rx, ry, Math.max(0.5, rad), 0, Math.PI * 2);
      meltCtx.fill();
    }

    if (meltUnder) {
      meltUnder.style.background = colors.liquid;
      if (phase === 'leave') {
        meltUnder.style.opacity = String(Math.min(1, Math.max(0, (t - 0.48) / 0.4)));
      } else {
        meltUnder.style.opacity = String(Math.max(0, 1 - t * 1.05));
      }
    }

    if (sparkCtx) {
      sparkCtx.clearRect(0, 0, w, h);
      sparkCtx.fillStyle = 'rgba(255,255,255,0.9)';
      for (var s = 0; s < sparkParticles.length; s++) {
        var sp = sparkParticles[s];
        sp.x += sp.dx;
        sp.y += sp.dy;
        var sa =
          phase === 'leave'
            ? Math.min(1, progress * 1.5) * (1 - Math.max(0, progress - 0.55) / 0.45)
            : 1 - progress;
        if (sa <= 0.02) continue;
        sparkCtx.globalAlpha = sa * 0.75;
        sparkCtx.beginPath();
        sparkCtx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
        sparkCtx.fill();
      }
      sparkCtx.globalAlpha = 1;
    }
  }

  function tickMelt() {
    meltRaf = 0;
    if (!meltPhase) return;
    var dur = meltPhase === 'leave' ? 680 : 700;
    var now = performance.now();
    var progress = Math.min(1, (now - meltStart) / dur);
    drawMeltFrame(progress, meltPhase);

    if (progress >= 1) {
      if (meltPhase === 'leave') {
        if (meltUnder) meltUnder.style.opacity = '1';
        meltPhase = null;
        if (meltCb && !meltDone) {
          meltDone = true;
          meltCb();
        }
      } else {
        cleanupMeltEnter();
        meltPhase = null;
      }
      return;
    }
    meltRaf = requestAnimationFrame(tickMelt);
  }

  function startMeltLoop() {
    if (!meltRaf) meltRaf = requestAnimationFrame(tickMelt);
  }

  function cleanupMeltEnter() {
    if (meltRaf) {
      cancelAnimationFrame(meltRaf);
      meltRaf = 0;
    }
    meltParticles = [];
    sparkParticles = [];
    if (meltCtx && meltCanvas) meltCtx.clearRect(0, 0, meltCanvas.width, meltCanvas.height);
    if (sparkCtx) sparkCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    if (meltUnder) meltUnder.style.opacity = '0';
    if (meltWrap) meltWrap.style.visibility = 'hidden';
    if (meltSpark) meltSpark.style.visibility = 'hidden';
    if (ov) {
      ov.classList.remove('is-active', 'is-covering', 'melt-mode');
      ov.style.pointerEvents = 'none';
    }
    busy = false;
    covering = false;
  }

  function meltLeave(cb) {
    ensureOverlay();
    ov.classList.add('is-active', 'melt-mode');
    ov.classList.remove('classic-mode');
    ov.style.pointerEvents = 'auto';
    resizeMeltCanvas();
    meltWrap.style.visibility = 'visible';
    meltSpark.style.visibility = 'visible';
    meltUnder.style.opacity = '0';
    spawnMeltLeaveBlobs(meltBudget());
    meltPhase = 'leave';
    meltStart = performance.now();
    meltCb = cb;
    meltDone = false;
    covering = true;
    startMeltLoop();
    setTimeout(function () {
      if (!meltDone) {
        meltDone = true;
        meltUnder.style.opacity = '1';
        cb();
      }
    }, 980);
  }

  function meltEnter() {
    ensureOverlay();
    ov.classList.add('is-active', 'melt-mode');
    ov.classList.remove('classic-mode');
    ov.style.pointerEvents = 'none';
    resizeMeltCanvas();
    meltWrap.style.visibility = 'visible';
    meltSpark.style.visibility = 'visible';
    meltUnder.style.opacity = '1';
    spawnMeltEnterBlobs(meltBudget());
    meltPhase = 'enter';
    meltStart = performance.now();
    meltCb = null;
    meltDone = false;
    covering = true;
    startMeltLoop();
  }

  /* ---------- Prefetch + classic swipe ---------- */
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
        headers: { Purpose: 'prefetch', 'Sec-Purpose': 'prefetch' },
      })
        .then(function () {
          done();
        })
        .catch(function () {
          done();
        });

      setTimeout(done, 3200);
    });
    return prefetchCache[url];
  }

  function animateSwipeCover() {
    return new Promise(function (resolve) {
      ensureOverlay();
      ov.classList.add('is-active', 'is-covering', 'classic-mode');
      ov.classList.remove('melt-mode');
      ov.style.pointerEvents = 'auto';
      swipe.classList.remove('is-exit');
      void swipe.offsetWidth;
      covering = true;
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
      ov.classList.add('is-active', 'is-covering', 'classic-mode');
      ov.classList.remove('melt-mode');
      swipe.classList.add('is-cover');
      covering = true;
      void swipe.offsetWidth;
      requestAnimationFrame(function () {
        covering = false;
        swipe.classList.add('is-exit');
        swipe.classList.remove('is-cover');
        ov.classList.remove('is-covering');
        var finished = false;
        var finish = function () {
          if (finished) return;
          finished = true;
          ov.classList.remove('is-active', 'is-covering', 'classic-mode');
          swipe.classList.remove('is-exit', 'is-cover');
          ov.style.pointerEvents = 'none';
          clearBubbles();
          busy = false;
          resolve();
        };
        swipe.addEventListener('transitionend', finish, { once: true });
        setTimeout(finish, 780);
      });
    });
  }

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
    if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) {
      return false;
    }
    return true;
  }

  function clickOrigin(e) {
    return { x: e.clientX || window.innerWidth * 0.5, y: e.clientY || window.innerHeight * 0.65 };
  }

  function navigateClassic(href, origin) {
    ensureOverlay();
    ov.classList.add('is-active', 'classic-mode');
    ov.classList.remove('melt-mode');
    ov.style.pointerEvents = 'auto';

    var ready = prefetch(href);

    burst(36, origin);
    setTimeout(function () {
      burst(22, origin);
    }, 90);
    setTimeout(function () {
      burst(16, origin);
    }, 180);

    var swipeDelay = new Promise(function (resolve) {
      setTimeout(resolve, 150);
    });

    swipeDelay
      .then(function () {
        return animateSwipeCover();
      })
      .then(function () {
        return Promise.race([
          ready,
          new Promise(function (r) {
            setTimeout(r, 180);
          }),
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
        covering = false;
        window.location.href = href;
      });
  }

  function navigateMelt(href) {
    ensureOverlay();
    var ready = prefetch(href);

    meltLeave(function () {
      Promise.race([
        ready,
        new Promise(function (r) {
          setTimeout(r, 120);
        }),
      ]).then(function () {
        try {
          sessionStorage.setItem(STORAGE_KEY, '1');
        } catch (err) {}
        window.location.href = href;
      });
    });
  }

  function navigateWithTransition(href, origin) {
    if (busy) return;
    busy = true;
    if (getTransitionStyle() === 'classic') navigateClassic(href, origin);
    else navigateMelt(href);
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
    if (getTransitionStyle() === 'classic') {
      ov.classList.add('is-active', 'is-covering', 'classic-mode');
      swipe.classList.add('is-cover');
      covering = true;
      busy = true;
      burst(28, { x: window.innerWidth * 0.35, y: window.innerHeight * 0.8 });
      requestAnimationFrame(function () {
        animateSwipeReveal();
      });
    } else {
      busy = true;
      meltEnter();
    }
  }

  if (document.body) onReady();
  else document.addEventListener('DOMContentLoaded', onReady);

  window.J14Transition = {
    version: TRANS_VERSION,
    go: function (href, origin) {
      if (!href) return;
      navigateWithTransition(href, origin || { x: window.innerWidth * 0.5, y: window.innerHeight * 0.6 });
    },
  };
})();
