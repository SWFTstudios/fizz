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
      liquid: readCssColor('--hero-accent', readCssColor('--color-accent', 'oklch(0.9 0.22 128)')),
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

  /* ---------- Classic wave overlays (rollback path) ---------- */
  var style = document.createElement('style');
  style.textContent =
    '#ftov{position:fixed;inset:0;z-index:999;pointer-events:none;visibility:hidden;overflow:hidden}' +
    '#ftov.on{visibility:visible}' +
    '#ftov.melt-mode{background:transparent}' +
    '.ftliq{position:absolute;left:-12%;width:124%;height:135vh;top:100vh;will-change:transform;z-index:1}' +
    '.ftl1{background:var(--ft-liquid, oklch(0.9 0.22 128));border-radius:46% 54% 0 0/70px 120px 0 0}' +
    '.ftl2{background:var(--ft-ink, #0b0e12);border-radius:54% 46% 0 0/120px 70px 0 0}' +
    '.ftbub-canvas{position:absolute;inset:0;z-index:3;width:100%;height:100%;pointer-events:none;mix-blend-mode:screen}' +
    '.ftmelt-wrap{position:absolute;inset:0;z-index:2;pointer-events:none;filter:url(#ft-goo)}' +
    '.ftmelt-canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}' +
    '.ftmelt-under{position:absolute;inset:0;z-index:1;opacity:0;background:var(--ft-liquid, oklch(0.9 0.22 128));pointer-events:none}' +
    '.ftmelt-under.on{opacity:1}' +
    '#ft-goo-svg{position:absolute;width:0;height:0;overflow:hidden}';
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
    gooSvg,
    meltParticles = [],
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

  function MeltBlob(x, y, radius, dx, dy, grow) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.baseRadius = radius;
    this.dx = dx;
    this.dy = dy;
    this.grow = grow || 0;
  }

  function ensureGooSvg() {
    if (gooSvg) return;
    gooSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    gooSvg.id = 'ft-goo-svg';
    gooSvg.setAttribute('aria-hidden', 'true');
    gooSvg.innerHTML =
      '<defs><filter id="ft-goo" x="-30%" y="-30%" width="160%" height="160%">' +
      '<feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur"/>' +
      '<feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -10" result="goo"/>' +
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
    if (!meltCanvas || !meltCtx) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = window.innerWidth;
    var h = window.innerHeight;
    meltCanvas.width = Math.max(1, Math.floor(w * dpr));
    meltCanvas.height = Math.max(1, Math.floor(h * dpr));
    meltCanvas.style.width = w + 'px';
    meltCanvas.style.height = h + 'px';
    meltCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
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
    var base = Math.round(90 * intensityScale());
    if (isCoarse()) base = Math.round(base * 0.55);
    if (window.innerWidth < 720) base = Math.round(base * 0.75);
    return Math.max(40, Math.min(120, base));
  }

  function spawnMeltLeaveBlobs(n) {
    var w = window.innerWidth;
    var h = window.innerHeight;
    meltParticles = [];
    for (var i = 0; i < n; i++) {
      var r = 10 + Math.random() * 28 * intensityScale();
      meltParticles.push(
        new MeltBlob(
          Math.random() * w,
          h + r + Math.random() * h * 0.35,
          r,
          (Math.random() - 0.5) * 1.6,
          2.2 + Math.random() * 3.8,
          0.08 + Math.random() * 0.22
        )
      );
    }
  }

  function spawnMeltEnterBlobs(n) {
    var w = window.innerWidth;
    var h = window.innerHeight;
    meltParticles = [];
    var cols = Math.ceil(Math.sqrt(n * (w / h)));
    var rows = Math.ceil(n / cols);
    var i = 0;
    for (var row = 0; row < rows; row++) {
      for (var col = 0; col < cols; col++) {
        if (i >= n) break;
        var r = 18 + Math.random() * 36 * intensityScale();
        meltParticles.push(
          new MeltBlob(
            ((col + 0.5) / cols) * w + (Math.random() - 0.5) * 24,
            ((row + 0.3) / rows) * h + (Math.random() - 0.5) * 20,
            r,
            (Math.random() - 0.5) * 2.4,
            1.8 + Math.random() * 4.2,
            -0.12 - Math.random() * 0.2
          )
        );
        i++;
      }
    }
  }

  function drawMeltFrame(progress, phase) {
    if (!meltCtx) return;
    var w = window.innerWidth;
    var h = window.innerHeight;
    var colors = getMeltColors();
    meltCtx.clearRect(0, 0, w, h);
    meltCtx.fillStyle = colors.liquid;

    for (var i = 0; i < meltParticles.length; i++) {
      var p = meltParticles[i];
      p.x += p.dx;
      p.y -= p.dy;
      if (phase === 'leave') {
        p.radius = p.baseRadius * (1 + progress * 2.8) + progress * 28;
        p.dy += 0.015;
      } else {
        p.radius = Math.max(0.5, p.baseRadius * (1 - progress * 0.85) + p.grow * progress * 10);
        p.dy += 0.04;
      }
      meltCtx.beginPath();
      meltCtx.arc(p.x, p.y, Math.max(0.5, p.radius), 0, Math.PI * 2);
      meltCtx.fill();
    }

    if (phase === 'leave') {
      var flood = Math.max(0, (progress - 0.35) / 0.65);
      if (flood > 0) {
        meltUnder.style.opacity = String(Math.min(1, flood * 1.25));
        var coverH = flood * h * 1.15;
        meltCtx.fillRect(0, h - coverH, w, coverH + 40);
      }
    } else {
      meltUnder.style.opacity = String(Math.max(0, 1 - progress * 1.15));
    }
  }

  function tickMelt() {
    meltRaf = 0;
    if (!meltPhase) return;
    var scale = durationScale();
    var dur = (meltPhase === 'leave' ? 620 : 640) * scale;
    var now = performance.now();
    var progress = Math.min(1, (now - meltStart) / dur);
    drawMeltFrame(progress, meltPhase);

    if (progress >= 1) {
      if (meltPhase === 'leave') {
        meltUnder.classList.add('on');
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
    meltPhase = null;
    if (meltCtx) meltCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    if (meltUnder) {
      meltUnder.classList.remove('on');
      meltUnder.style.opacity = '0';
    }
    if (ov) {
      ov.classList.remove('on', 'melt-mode');
      ov.style.pointerEvents = 'none';
    }
    if (meltWrap) meltWrap.style.visibility = 'hidden';
    if (l1) l1.style.display = '';
    if (l2) l2.style.display = '';
    if (bubCanvas) bubCanvas.style.display = '';
  }

  function setClassicVisible(show) {
    if (l1) l1.style.display = show ? '' : 'none';
    if (l2) l2.style.display = show ? '' : 'none';
    if (bubCanvas) bubCanvas.style.display = show ? '' : 'none';
    if (meltWrap) meltWrap.style.visibility = show ? 'hidden' : 'visible';
    if (meltUnder) meltUnder.style.display = show ? 'none' : '';
  }

  function build() {
    if (ov) return;
    ensureGooSvg();
    ov = document.createElement('div');
    ov.id = 'ftov';
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
    ov.appendChild(meltUnder);
    ov.appendChild(l1);
    ov.appendChild(l2);
    ov.appendChild(meltWrap);
    ov.appendChild(bubCanvas);
    bubCtx = bubCanvas.getContext('2d');
    meltCtx = meltCanvas.getContext('2d');
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
    meltUnder.classList.remove('on');
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
        meltUnder.classList.add('on');
        meltUnder.style.opacity = '1';
        cb();
      }
    }, 900 * durationScale());
  }

  function meltEnter() {
    setClassicVisible(false);
    ov.classList.add('on', 'melt-mode');
    ov.style.pointerEvents = 'none';
    applyThemeColors();
    resizeMeltCanvas();
    meltWrap.style.visibility = 'visible';
    meltUnder.classList.add('on');
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

  window.FizzTransition = { leave: leave, enter: enter };
})();
