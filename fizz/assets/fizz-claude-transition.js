/* FIZZ liquid bubble page transitions — Shopify-aware (melt + classic) */
(function () {
  if (window.__fizzTrans) return;
  window.__fizzTrans = 1;
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var STORAGE_KEY = 'fizz-trans';
  var BUB_PEAK = 0.98;
  var LEAVE_BURST = 48;
  var ENTER_BURST = 40;
  var BUB_STROKE = 'rgba(255,255,255,0.95)';
  var BUB_FILL = 'rgba(210,248,255,0.9)';
  var TRANS_VERSION = 'melt-v2';

  function getTransitionStyle() {
    var raw = (document.documentElement.dataset.transitionStyle || 'melt').toLowerCase();
    return raw === 'classic' ? 'classic' : 'melt';
  }

  function readCssColor(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  function getMeltColors() {
    return {
      liquid: readCssColor('--hero-accent', readCssColor('--color-accent', '#c6f24e')),
      ink: readCssColor('--hero-bg', readCssColor('--color-ink', '#0b0e12')),
      paper: readCssColor('--hero-text', readCssColor('--color-paper', '#f2efe7')),
    };
  }

  function isCoarse() {
    return window.matchMedia && matchMedia('(pointer: coarse)').matches;
  }

  function durationScale() {
    var raw = parseFloat(document.documentElement.dataset.transitionDurationScale || '100');
    if (isNaN(raw) || raw < 50) raw = 100;
    if (raw > 150) raw = 150;
    return raw / 100;
  }

  function intensityScale() {
    var raw = parseFloat(document.documentElement.dataset.transitionIntensity || '100');
    if (isNaN(raw) || raw < 50) raw = 100;
    if (raw > 150) raw = 150;
    return raw / 100;
  }

  var style = document.createElement('style');
  style.textContent =
    '#ftov{position:fixed;inset:0;z-index:99999;pointer-events:none;visibility:hidden;overflow:hidden}' +
    '#ftov.on{visibility:visible}' +
    '#ftov.melt-mode .ftliq,#ftov.melt-mode .ftbub-canvas{display:none!important;visibility:hidden!important;opacity:0!important}' +
    '.ftliq{position:absolute;left:-12%;width:124%;height:135vh;top:100vh;will-change:transform;z-index:1}' +
    '.ftl1{background:var(--ft-liquid, #c6f24e);border-radius:46% 54% 0 0/70px 120px 0 0}' +
    '.ftl2{background:var(--ft-ink, #0b0e12);border-radius:54% 46% 0 0/120px 70px 0 0}' +
    '.ftbub-canvas{position:absolute;inset:0;z-index:3;width:100%;height:100%;pointer-events:none;mix-blend-mode:screen}' +
    '.ftmelt-wrap{position:absolute;inset:-10%;z-index:2;pointer-events:none;filter:url(#ft-goo);-webkit-filter:url(#ft-goo)}' +
    '.ftmelt-canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}' +
    '.ftmelt-under{position:absolute;inset:0;z-index:1;opacity:0;background:var(--ft-liquid, #c6f24e);pointer-events:none}' +
    '.ftmelt-spark{position:absolute;inset:0;z-index:4;pointer-events:none;mix-blend-mode:soft-light;opacity:.65}' +
    '#ft-goo-svg{position:absolute;width:0;height:0;overflow:hidden}' +
    '#ftov[data-ft-ver]:after{content:attr(data-ft-ver);position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}';
  document.head.appendChild(style);

  var ov,
    l1,
    l2,
    bubCanvas,
    bubCtx,
    bubParticles = [],
    bubRaf = 0,
    bubActive = false,
    meltWrap,
    meltCanvas,
    meltCtx,
    meltUnder,
    meltSpark,
    sparkCtx,
    gooSvg,
    meltParticles = [],
    sparkParticles = [],
    meltRaf = 0,
    meltPhase = null,
    meltStart = 0,
    meltCb = null,
    meltDone = false;

  function TransitionBubble(x, y, radius, dx, dy) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.dx = dx;
    this.dy = dy;
    this.spawnY = y;
    this.life = 0;
  }

  TransitionBubble.prototype.move = function () {
    this.x += this.dx;
    this.y -= this.dy;
    this.life += 1;
  };

  TransitionBubble.prototype.opacity = function (h) {
    var travel = this.spawnY - this.y;
    var maxTravel = h + this.radius * 2;
    var progress = maxTravel > 0 ? travel / maxTravel : 0;
    if (progress < 0.04) return BUB_PEAK * (progress / 0.04);
    if (progress > 0.88) return BUB_PEAK * Math.max(0, (1 - progress) / 0.12);
    return BUB_PEAK;
  };

  TransitionBubble.prototype.draw = function (ctx, h) {
    var alpha = this.opacity(h);
    if (alpha <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.lineWidth = Math.max(1.5, this.radius * 0.08);
    ctx.strokeStyle = BUB_STROKE;
    ctx.stroke();
    var gradient = ctx.createRadialGradient(this.x, this.y, 1, this.x + 0.5, this.y + 0.5, this.radius);
    gradient.addColorStop(0.3, 'rgba(255,255,255,0.55)');
    gradient.addColorStop(0.95, BUB_FILL);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.restore();
  };

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

  function ensureGooSvg() {
    if (gooSvg) return;
    gooSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    gooSvg.id = 'ft-goo-svg';
    gooSvg.setAttribute('aria-hidden', 'true');
    gooSvg.innerHTML =
      '<defs><filter id="ft-goo" x="-40%" y="-40%" width="180%" height="180%" color-interpolation-filters="sRGB">' +
      '<feGaussianBlur in="SourceGraphic" stdDeviation="14" result="blur"/>' +
      '<feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" result="goo"/>' +
      '</filter></defs>';
    document.body.appendChild(gooSvg);
  }

  function applyThemeColors() {
    if (!ov) return;
    var c = getMeltColors();
    ov.style.setProperty('--ft-liquid', c.liquid);
    ov.style.setProperty('--ft-ink', c.ink);
    ov.style.setProperty('--ft-paper', c.paper);
  }

  function resizeBubCanvas() {
    if (!bubCanvas || !bubCtx) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = window.innerWidth;
    var h = window.innerHeight;
    bubCanvas.width = Math.max(1, Math.floor(w * dpr));
    bubCanvas.height = Math.max(1, Math.floor(h * dpr));
    bubCanvas.style.width = w + 'px';
    bubCanvas.style.height = h + 'px';
    bubCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
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

  function spawnBubble(h) {
    var radius = 16 + Math.random() * 42;
    var x = radius + Math.random() * Math.max(radius, window.innerWidth - radius * 2);
    var y = h * (0.55 + Math.random() * 0.5) + Math.random() * radius;
    return new TransitionBubble(x, y, radius, (Math.random() - 0.5) * 2.2, 2.8 + Math.random() * 4.2);
  }

  function burst(n) {
    if (!bubCanvas) return;
    resizeBubCanvas();
    var h = window.innerHeight;
    for (var i = 0; i < n; i++) {
      bubParticles.push(spawnBubble(h));
    }
    startBubLoop();
  }

  function tickBubbles() {
    bubRaf = 0;
    if (!bubCanvas || !bubCtx) return;
    var w = window.innerWidth;
    var h = window.innerHeight;
    bubCtx.clearRect(0, 0, w, h);
    bubParticles = bubParticles.filter(function (p) {
      p.move();
      if (p.y + p.radius < 0) return false;
      p.draw(bubCtx, h);
      return true;
    });
    if (bubActive || bubParticles.length) {
      bubRaf = requestAnimationFrame(tickBubbles);
    }
  }

  function startBubLoop() {
    if (!bubRaf) bubRaf = requestAnimationFrame(tickBubbles);
  }

  function stopBubLoop() {
    bubActive = false;
    if (!bubParticles.length && bubRaf) {
      cancelAnimationFrame(bubRaf);
      bubRaf = 0;
    }
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
        life: Math.random(),
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
        life: Math.random(),
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
      p.radius = rad;
      meltCtx.beginPath();
      meltCtx.arc(rx, ry, Math.max(0.5, rad), 0, Math.PI * 2);
      meltCtx.fill();
    }

    if (phase === 'leave') {
      meltUnder.style.background = colors.liquid;
      meltUnder.style.opacity = String(Math.min(1, Math.max(0, (t - 0.48) / 0.4)));
    } else {
      meltUnder.style.background = colors.liquid;
      meltUnder.style.opacity = String(Math.max(0, 1 - t * 1.05));
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
    var scale = durationScale();
    var dur = (meltPhase === 'leave' ? 680 : 700) * scale;
    var now = performance.now();
    var progress = Math.min(1, (now - meltStart) / dur);
    drawMeltFrame(progress, meltPhase);

    if (progress >= 1) {
      if (meltPhase === 'leave') {
        meltUnder.style.opacity = '1';
        meltPhase = null;
        if (meltCb && !meltDone) {
          meltDone = true;
          meltCb();
        }
      } else {
        cleanupMelt();
        meltPhase = null;
      }
      return;
    }
    meltRaf = requestAnimationFrame(tickMelt);
  }

  function startMeltLoop() {
    if (!meltRaf) meltRaf = requestAnimationFrame(tickMelt);
  }

  function cleanupMelt() {
    if (meltRaf) {
      cancelAnimationFrame(meltRaf);
      meltRaf = 0;
    }
    meltParticles = [];
    sparkParticles = [];
    meltPhase = null;
    if (meltCtx && meltCanvas) meltCtx.clearRect(0, 0, meltCanvas.width, meltCanvas.height);
    if (sparkCtx) sparkCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    if (meltUnder) meltUnder.style.opacity = '0';
    if (ov) {
      ov.classList.remove('on', 'melt-mode');
      ov.style.pointerEvents = 'none';
    }
    if (meltWrap) meltWrap.style.visibility = 'hidden';
    if (meltSpark) meltSpark.style.visibility = 'hidden';
  }

  function setClassicVisible(show) {
    if (l1) {
      l1.style.display = show ? '' : 'none';
      l1.style.visibility = show ? '' : 'hidden';
    }
    if (l2) {
      l2.style.display = show ? '' : 'none';
      l2.style.visibility = show ? '' : 'hidden';
    }
    if (bubCanvas) {
      bubCanvas.style.display = show ? '' : 'none';
      bubCanvas.style.visibility = show ? '' : 'hidden';
    }
    if (meltWrap) meltWrap.style.visibility = show ? 'hidden' : 'visible';
    if (meltUnder) meltUnder.style.display = show ? 'none' : '';
    if (meltSpark) meltSpark.style.visibility = show ? 'hidden' : 'visible';
  }

  function build() {
    if (ov) return;
    ensureGooSvg();
    ov = document.createElement('div');
    ov.id = 'ftov';
    ov.setAttribute('data-ft-ver', TRANS_VERSION);
    l1 = document.createElement('div');
    l1.className = 'ftliq ftl1';
    l2 = document.createElement('div');
    l2.className = 'ftliq ftl2';
    bubCanvas = document.createElement('canvas');
    bubCanvas.className = 'ftbub-canvas';
    bubCanvas.setAttribute('aria-hidden', 'true');
    meltUnder = document.createElement('div');
    meltUnder.className = 'ftmelt-under';
    meltWrap = document.createElement('div');
    meltWrap.className = 'ftmelt-wrap';
    meltWrap.style.visibility = 'hidden';
    meltCanvas = document.createElement('canvas');
    meltCanvas.className = 'ftmelt-canvas';
    meltCanvas.setAttribute('aria-hidden', 'true');
    meltWrap.appendChild(meltCanvas);
    meltSpark = document.createElement('canvas');
    meltSpark.className = 'ftmelt-spark';
    meltSpark.setAttribute('aria-hidden', 'true');
    meltSpark.style.visibility = 'hidden';
    ov.appendChild(meltUnder);
    ov.appendChild(l1);
    ov.appendChild(l2);
    ov.appendChild(meltWrap);
    ov.appendChild(meltSpark);
    ov.appendChild(bubCanvas);
    bubCtx = bubCanvas.getContext('2d');
    meltCtx = meltCanvas.getContext('2d');
    sparkCtx = meltSpark.getContext('2d');
    resizeBubCanvas();
    resizeMeltCanvas();
    applyThemeColors();
    (document.body || document.documentElement).appendChild(ov);
  }

  var COVER = 'translateY(-85%)',
    GONE = 'translateY(-180%)',
    EASE = 'cubic-bezier(.65,0,.25,1)';

  function classicLeave(cb) {
    setClassicVisible(true);
    ov.classList.add('on');
    ov.classList.remove('melt-mode');
    ov.style.pointerEvents = 'auto';
    applyThemeColors();
    bubActive = true;
    burst(LEAVE_BURST);
    setTimeout(function () {
      burst(Math.round(LEAVE_BURST * 0.45));
    }, 280);
    var done = false,
      go = function () {
        if (!done) {
          done = true;
          cb();
        }
      };
    var scale = durationScale();
    l1.style.transform = '';
    l2.style.transform = '';
    l1.animate([{ transform: 'translateY(0)' }, { transform: COVER }], {
      duration: 520 * scale,
      easing: EASE,
      fill: 'forwards',
    });
    l2.animate([{ transform: 'translateY(0)' }, { transform: COVER }], {
      duration: 560 * scale,
      delay: 90,
      easing: EASE,
      fill: 'forwards',
    }).onfinish = go;
    setTimeout(go, 900 * scale);
  }

  function classicEnter() {
    setClassicVisible(true);
    ov.classList.add('on');
    ov.classList.remove('melt-mode');
    applyThemeColors();
    l1.style.transform = COVER;
    l2.style.transform = COVER;
    bubActive = true;
    burst(ENTER_BURST);
    setTimeout(function () {
      burst(Math.round(ENTER_BURST * 0.5));
    }, 320);
    var scale = durationScale();
    l2.animate([{ transform: COVER }, { transform: GONE }], {
      duration: 560 * scale,
      delay: 60,
      easing: EASE,
      fill: 'forwards',
    });
    var a = l1.animate([{ transform: COVER }, { transform: GONE }], {
      duration: 640 * scale,
      delay: 170,
      easing: EASE,
      fill: 'forwards',
    });
    a.onfinish = function () {
      ov.classList.remove('on');
      ov.style.pointerEvents = 'none';
      l1.style.transform = '';
      l2.style.transform = '';
      stopBubLoop();
      bubParticles = [];
      if (bubCtx) bubCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    };
  }

  function meltLeave(cb) {
    setClassicVisible(false);
    ov.classList.add('on', 'melt-mode');
    ov.style.pointerEvents = 'auto';
    applyThemeColors();
    resizeMeltCanvas();
    meltWrap.style.visibility = 'visible';
    meltSpark.style.visibility = 'visible';
    meltUnder.style.opacity = '0';
    spawnMeltLeaveBlobs(meltBudget());
    meltPhase = 'leave';
    meltStart = performance.now();
    meltCb = cb;
    meltDone = false;
    startMeltLoop();
    setTimeout(function () {
      if (!meltDone) {
        meltDone = true;
        meltUnder.style.opacity = '1';
        cb();
      }
    }, 980 * durationScale());
  }

  function meltEnter() {
    setClassicVisible(false);
    ov.classList.add('on', 'melt-mode');
    ov.style.pointerEvents = 'none';
    applyThemeColors();
    resizeMeltCanvas();
    meltWrap.style.visibility = 'visible';
    meltSpark.style.visibility = 'visible';
    meltUnder.style.opacity = '1';
    spawnMeltEnterBlobs(meltBudget());
    meltPhase = 'enter';
    meltStart = performance.now();
    meltCb = null;
    meltDone = false;
    startMeltLoop();
  }

  function leave(cb) {
    build();
    if (getTransitionStyle() === 'classic') classicLeave(cb);
    else meltLeave(cb);
  }

  function enter() {
    build();
    if (getTransitionStyle() === 'classic') classicEnter();
    else meltEnter();
  }

  function shouldAnimate(a, href) {
    if (!href || href.charAt(0) === '#' || /^(mailto:|tel:|javascript:)/i.test(href)) return false;
    if (a.hasAttribute('download') || a.target === '_blank' || a.dataset.noTransition !== undefined) return false;
    if (a.getAttribute('role') === 'button' && !href) return false;

    var url;
    try {
      url = new URL(href, window.location.href);
    } catch (err) {
      return false;
    }

    if (url.origin !== window.location.origin) return false;
    if (/\/cart\/add|\/checkout|\/account\/logout|\/admin\b/i.test(url.pathname)) return false;
    if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return false;
    return true;
  }

  document.addEventListener(
    'click',
    function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      var href = a.getAttribute('href');
      if (!shouldAnimate(a, href)) return;
      e.preventDefault();
      if (reduced) {
        window.location.href = href;
        return;
      }
      try {
        sessionStorage.setItem(STORAGE_KEY, '1');
      } catch (err) {}
      leave(function () {
        window.location.href = href;
      });
    },
    true
  );

  function onReady() {
    var flag = false;
    try {
      flag = sessionStorage.getItem(STORAGE_KEY) === '1';
      if (flag) sessionStorage.removeItem(STORAGE_KEY);
    } catch (err) {}
    if (flag && !reduced) enter();
  }

  if (document.body) onReady();
  else document.addEventListener('DOMContentLoaded', onReady);

  window.FizzTransition = { leave: leave, enter: enter, version: TRANS_VERSION };
})();
