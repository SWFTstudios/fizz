/* FIZZ liquid bubble page transitions — Shopify-aware */
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

  var style = document.createElement('style');
  style.textContent =
    '#ftov{position:fixed;inset:0;z-index:999;pointer-events:none;visibility:hidden;overflow:hidden}' +
    '#ftov.on{visibility:visible}' +
    '.ftliq{position:absolute;left:-12%;width:124%;height:135vh;top:100vh;will-change:transform;z-index:1}' +
    '.ftl1{background:oklch(0.9 0.22 128);border-radius:46% 54% 0 0/70px 120px 0 0}' +
    '.ftl2{background:#0b0e12;border-radius:54% 46% 0 0/120px 70px 0 0}' +
    '.ftbub-canvas{position:absolute;inset:0;z-index:3;width:100%;height:100%;pointer-events:none;mix-blend-mode:screen}';
  document.head.appendChild(style);

  var ov, l1, l2, bubCanvas, bubCtx, bubParticles = [], bubRaf = 0, bubActive = false;

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
    var gradient = ctx.createRadialGradient(
      this.x,
      this.y,
      1,
      this.x + 0.5,
      this.y + 0.5,
      this.radius
    );
    gradient.addColorStop(0.3, 'rgba(255,255,255,0.55)');
    gradient.addColorStop(0.95, BUB_FILL);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.restore();
  };

  function resizeBubCanvas() {
    if (!bubCanvas || !bubCtx) return;
    var dpr = window.devicePixelRatio || 1;
    var w = window.innerWidth;
    var h = window.innerHeight;
    bubCanvas.width = Math.max(1, Math.floor(w * dpr));
    bubCanvas.height = Math.max(1, Math.floor(h * dpr));
    bubCanvas.style.width = w + 'px';
    bubCanvas.style.height = h + 'px';
    bubCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawnBubble(h) {
    var radius = 16 + Math.random() * 42;
    var x = radius + Math.random() * Math.max(radius, window.innerWidth - radius * 2);
    var y = h * (0.55 + Math.random() * 0.5) + Math.random() * radius;
    return new TransitionBubble(
      x,
      y,
      radius,
      (Math.random() - 0.5) * 2.2,
      2.8 + Math.random() * 4.2
    );
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

  function build() {
    if (ov) return;
    ov = document.createElement('div');
    ov.id = 'ftov';
    l1 = document.createElement('div');
    l1.className = 'ftliq ftl1';
    l2 = document.createElement('div');
    l2.className = 'ftliq ftl2';
    bubCanvas = document.createElement('canvas');
    bubCanvas.className = 'ftbub-canvas';
    bubCanvas.setAttribute('aria-hidden', 'true');
    ov.appendChild(l1);
    ov.appendChild(l2);
    ov.appendChild(bubCanvas);
    bubCtx = bubCanvas.getContext('2d');
    resizeBubCanvas();
    (document.body || document.documentElement).appendChild(ov);
  }

  var COVER = 'translateY(-85%)',
    GONE = 'translateY(-180%)',
    EASE = 'cubic-bezier(.65,0,.25,1)';

  function leave(cb) {
    build();
    ov.classList.add('on');
    ov.style.pointerEvents = 'auto';
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
    l1.animate([{ transform: 'translateY(0)' }, { transform: COVER }], { duration: 520, easing: EASE, fill: 'forwards' });
    l2.animate([{ transform: 'translateY(0)' }, { transform: COVER }], { duration: 560, delay: 90, easing: EASE, fill: 'forwards' }).onfinish = go;
    setTimeout(go, 900);
  }

  function enter() {
    build();
    ov.classList.add('on');
    l1.style.transform = COVER;
    l2.style.transform = COVER;
    bubActive = true;
    burst(ENTER_BURST);
    setTimeout(function () {
      burst(Math.round(ENTER_BURST * 0.5));
    }, 320);
    l2.animate([{ transform: COVER }, { transform: GONE }], { duration: 560, delay: 60, easing: EASE, fill: 'forwards' });
    var a = l1.animate([{ transform: COVER }, { transform: GONE }], { duration: 640, delay: 170, easing: EASE, fill: 'forwards' });
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
