/* FIZZ liquid bubble page transitions — Shopify-aware */
(function () {
  if (window.__fizzTrans) return;
  window.__fizzTrans = 1;
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var STORAGE_KEY = 'fizz-trans';
  var BUB_BORDER = 'rgba(242,239,231,.72)';
  var BUB_PEAK = 0.92;
  var LEAVE_BURST = 26;
  var ENTER_BURST = 20;

  var style = document.createElement('style');
  style.textContent =
    '#ftov{position:fixed;inset:0;z-index:999;pointer-events:none;visibility:hidden;overflow:hidden}' +
    '#ftov.on{visibility:visible}' +
    '.ftliq{position:absolute;left:-12%;width:124%;height:135vh;top:100vh;will-change:transform}' +
    '.ftl1{background:oklch(0.9 0.22 128);border-radius:46% 54% 0 0/70px 120px 0 0}' +
    '.ftl2{background:#0b0e12;border-radius:54% 46% 0 0/120px 70px 0 0}' +
    '.ftbub{position:absolute;bottom:-50px;border:2px solid ' + BUB_BORDER + ';border-radius:50%;opacity:0}';
  document.head.appendChild(style);

  var ov, l1, l2;
  function build() {
    if (ov) return;
    ov = document.createElement('div');
    ov.id = 'ftov';
    l1 = document.createElement('div');
    l1.className = 'ftliq ftl1';
    l2 = document.createElement('div');
    l2.className = 'ftliq ftl2';
    ov.appendChild(l1);
    ov.appendChild(l2);
    (document.body || document.documentElement).appendChild(ov);
  }

  var COVER = 'translateY(-85%)',
    GONE = 'translateY(-180%)',
    EASE = 'cubic-bezier(.65,0,.25,1)';

  function burst(n) {
    for (var i = 0; i < n; i++) {
      var b = document.createElement('span');
      b.className = 'ftbub';
      var s = 8 + Math.random() * 30;
      b.style.width = s + 'px';
      b.style.height = s + 'px';
      b.style.left = Math.random() * 96 + 2 + '%';
      ov.appendChild(b);
      b.animate(
        [
          { transform: 'translateY(0) scale(.5)', opacity: 0 },
          { opacity: BUB_PEAK, offset: 0.15 },
          { transform: 'translateY(-' + (105 + Math.random() * 30) + 'vh) scale(1)', opacity: 0 },
        ],
        { duration: 650 + Math.random() * 500, delay: Math.random() * 220, easing: 'cubic-bezier(.2,.6,.3,1)' }
      ).onfinish = function () {
        this.effect.target.remove();
      };
    }
  }

  function leave(cb) {
    build();
    ov.classList.add('on');
    ov.style.pointerEvents = 'auto';
    burst(LEAVE_BURST);
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
    burst(ENTER_BURST);
    l2.animate([{ transform: COVER }, { transform: GONE }], { duration: 560, delay: 60, easing: EASE, fill: 'forwards' });
    var a = l1.animate([{ transform: COVER }, { transform: GONE }], { duration: 640, delay: 170, easing: EASE, fill: 'forwards' });
    a.onfinish = function () {
      ov.classList.remove('on');
      ov.style.pointerEvents = 'none';
      l1.style.transform = '';
      l2.style.transform = '';
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
