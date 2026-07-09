/* FIZZ theme engine */
(function () {
  if (window.__fizzEngine) return;
  window.__fizzEngine = 1;
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function mulberry(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  function initBubbles() {
    if (reduced) return;
    document.querySelectorAll('[data-bubbles]').forEach(function (field) {
      if (field.__done) return;
      field.__done = true;
      var count = parseInt(field.dataset.bubCount || '14', 10);
      var color = field.dataset.bubColor || 'rgba(242,239,231,.2)';
      var rise = parseInt(field.dataset.bubRise || '700', 10);
      var rnd = mulberry(parseInt(field.dataset.bubSeed || '7', 10));
      var frag = document.createDocumentFragment();
      for (var i = 0; i < count; i++) {
        var b = document.createElement('span');
        b.className = 'bub';
        var sz = 5 + rnd() * 16;
        b.style.left = 3 + rnd() * 94 + '%';
        b.style.width = sz + 'px';
        b.style.height = sz + 'px';
        b.style.border = '1.5px solid ' + color;
        b.style.setProperty('--rh', '-' + rise + 'px');
        b.style.animation = 'fizzrise ' + (5 + rnd() * 7).toFixed(1) + 's linear ' + (rnd() * 7).toFixed(1) + 's infinite';
        frag.appendChild(b);
      }
      field.appendChild(frag);
    });
  }

  function initReveal() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.rv').forEach(function (el) {
        el.classList.add('vis');
      });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add('vis');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    document.querySelectorAll('.rv').forEach(function (el) {
      io.observe(el);
    });
  }

  function initScrollAndMouse() {
    var raf = 0;
    function onScroll() {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        document.documentElement.style.setProperty('--sy', Math.min(1.4, window.scrollY / window.innerHeight).toFixed(4));
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    if (reduced) return;
    window.addEventListener(
      'mousemove',
      function (e) {
        document.documentElement.style.setProperty('--mx', ((e.clientX / window.innerWidth) * 2 - 1).toFixed(3));
        document.documentElement.style.setProperty('--my', ((e.clientY / window.innerHeight) * 2 - 1).toFixed(3));
      },
      { passive: true }
    );
  }

  function initCursor() {
    if (reduced || matchMedia('(pointer:coarse)').matches) return;
    var cur = document.createElement('div');
    cur.id = 'fizzcur';
    Object.assign(cur.style, {
      position: 'fixed',
      left: 0,
      top: 0,
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      background: 'var(--acc)',
      zIndex: 9999,
      pointerEvents: 'none',
      transform: 'translate(-50%,-50%)',
      transition: 'width .25s,height .25s,background .25s,border .25s',
      border: '1.5px solid transparent',
    });
    document.body.appendChild(cur);
    var mx = -100,
      my = -100,
      cx = -100,
      cy = -100;
    document.addEventListener(
      'mousemove',
      function (e) {
        mx = e.clientX;
        my = e.clientY;
        var hot = e.target.closest && e.target.closest('a,button,.sw,.fpanel,[data-hot],.addon,.thumb');
        if (hot) {
          cur.style.width = '44px';
          cur.style.height = '44px';
          cur.style.background = 'transparent';
          cur.style.border = '1.5px solid var(--acc)';
        } else {
          cur.style.width = '10px';
          cur.style.height = '10px';
          cur.style.background = 'var(--acc)';
          cur.style.border = '1.5px solid transparent';
        }
      },
      { passive: true }
    );
    (function loop() {
      cx += (mx - cx) * 0.22;
      cy += (my - cy) * 0.22;
      cur.style.left = cx + 'px';
      cur.style.top = cy + 'px';
      requestAnimationFrame(loop);
    })();
  }

  function applySwatch(btn) {
    var targetSel = btn.dataset.target;
    var target = targetSel ? document.querySelector(targetSel) : btn.closest('[data-way]') || btn.closest('[data-pdp]');
    if (!target) return;

    target.querySelectorAll('[data-way-swatch]').forEach(function (b) {
      b.classList.remove('on');
    });
    btn.classList.add('on');

    var hex = btn.dataset.color;
    var name = btn.dataset.name;
    var img = btn.dataset.image;
    var variantId = btn.dataset.variantId;
    var price = btn.dataset.price;

    var section = target.hasAttribute('data-way') ? target : target.closest('[data-way]');
    if (section && section.dataset.syncScene !== 'false') {
      var sceneStyle = section.dataset.sceneStyle || 'gradient';
      var angle = section.dataset.gradientAngle || '160';
      var sceneBg = btn.dataset.sceneBg;
      var sceneBgEnd = btn.dataset.sceneBgEnd;
      var sceneText = btn.dataset.sceneText;
      var sceneBtn = btn.dataset.sceneBtn;
      var sceneBtnText = btn.dataset.sceneBtnText;

      if (sceneBg) {
        if (sceneStyle === 'gradient' && sceneBgEnd) {
          section.style.background = 'linear-gradient(' + angle + 'deg, ' + sceneBg + ', ' + sceneBgEnd + ')';
        } else {
          section.style.background = sceneBg;
        }
      }
      if (sceneText) section.style.color = sceneText;
      if (sceneBtn) {
        section.style.setProperty('--ways-btn-bg', sceneBtn);
        section.style.setProperty('--ways-accent', sceneBtn);
      }
      if (sceneBtnText) section.style.setProperty('--ways-btn-text', sceneBtnText);
    }

    var bg = target.querySelector('[data-way-bg]');
    if (bg && hex) bg.style.background = hex;

    var photo = target.querySelector('[data-way-photo]');
    if (photo && img) photo.src = img;

    var label = target.querySelector('[data-way-name]');
    if (label && name) label.textContent = name;

    var big = target.querySelector('[data-way-bigname]');
    if (big && name) big.textContent = name;

    var optlab = target.querySelector('[data-pdp-way-label]');
    if (optlab && name) optlab.textContent = name;

    var variantInput = target.querySelector('[data-pdp-variant-id]');
    if (variantInput && variantId) variantInput.value = variantId;

    var cta = target.querySelector('[data-pdp-submit]');
    if (cta && price) cta.textContent = 'Add to cart — ' + price;

    var shopCta = target.querySelector('[data-way-cta]');
    if (shopCta) {
      if (btn.dataset.shopUrl) shopCta.href = btn.dataset.shopUrl;
      if (section && section.dataset.syncScene !== 'false') {
        var btnBg = btn.dataset.sceneBtn || hex;
        var btnText = btn.dataset.sceneBtnText || '#080a0d';
        if (btnBg) shopCta.style.background = btnBg;
        if (btnText) shopCta.style.color = btnText;
      }
    }

    var stage = target.querySelector('[data-pdp-stage]');
    if (stage && hex) stage.style.background = 'radial-gradient(ellipse 80% 90% at 50% 100%,' + hex + '33,#0b0e12)';
  }

  function initColorways() {
    document.querySelectorAll('[data-way-swatch]').forEach(function (btn) {
      if (btn.__swatchBound) return;
      btn.__swatchBound = true;
      btn.addEventListener('click', function (e) {
        if (btn.dataset.target && !e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
          e.preventDefault();
        }
        applySwatch(btn);
      });
    });
  }

  function initPackFromUrl() {
    var params = new URLSearchParams(window.location.search);
    var pack = params.get('pack');
    if (!pack) return;
    pack.split(',').forEach(function (key) {
      key = key.trim();
      if (!key) return;
      var addon = document.querySelector('[data-addon][data-addon-key="' + key + '"]');
      if (addon) {
        addon.classList.add('on', 'is-highlighted');
      }
    });
    updatePdpTotal();
  }

  function initAddons() {
    document.querySelectorAll('[data-addon]').forEach(function (el) {
      if (el.__addonBound) return;
      el.__addonBound = true;
      el.addEventListener('click', function () {
        el.classList.toggle('on');
        updatePdpTotal();
      });
    });
  }

  function parseMoney(text) {
    var n = parseFloat(String(text).replace(/[^0-9.]/g, ''));
    return isNaN(n) ? 0 : n;
  }

  function formatMoney(amount) {
    return '$' + amount.toFixed(0);
  }

  function updatePdpTotal() {
    var wrapper = document.querySelector('[data-pdp-form]');
    if (!wrapper) return;
    var base = parseFloat(wrapper.dataset.basePrice || '0');
    var total = base;
    document.querySelectorAll('[data-addon].on').forEach(function (el) {
      total += parseFloat(el.dataset.addonPrice || '0');
    });
    var btn = wrapper.querySelector('[data-pdp-submit]');
    if (btn) btn.textContent = 'Add to cart — ' + formatMoney(total);
  }

  function initPdpForm() {
    var wrapper = document.querySelector('[data-pdp-form]');
    if (!wrapper || wrapper.__bound) return;
    var form = wrapper.querySelector('form');
    if (!form) return;
    wrapper.__bound = true;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var variantInput = form.querySelector('[data-pdp-variant-id]');
      var mainId = variantInput ? variantInput.value : null;
      if (!mainId) return;

      var items = [{ id: Number(mainId), quantity: 1 }];
      document.querySelectorAll('[data-addon].on[data-variant-id]').forEach(function (addon) {
        items.push({ id: Number(addon.dataset.variantId), quantity: 1 });
      });

      var btn = wrapper.querySelector('[data-pdp-submit]');
      var original = btn ? btn.textContent : '';
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Adding…';
      }

      fetch((window.Shopify && window.Shopify.routes ? window.Shopify.routes.root : '/') + 'cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ items: items }),
      })
        .then(function (res) {
          if (!res.ok) throw new Error('Add failed');
          window.location.href = (window.Shopify && window.Shopify.routes ? window.Shopify.routes.root : '/') + 'cart';
        })
        .catch(function () {
          if (btn) {
            btn.disabled = false;
            btn.textContent = original;
          }
        });
    });
  }

  function initThumbs() {
    document.querySelectorAll('[data-pdp-thumb]').forEach(function (thumb) {
      if (thumb.__thumbBound) return;
      thumb.__thumbBound = true;
      thumb.addEventListener('click', function () {
        var src = thumb.dataset.fullSrc;
        var stage = document.querySelector('[data-pdp-stage]');
        var main = document.querySelector('[data-way-photo]');
        var lifestyle = document.querySelector('[data-pdp-lifestyle]');

        if (stage && src) {
          if (!lifestyle) {
            lifestyle = document.createElement('img');
            lifestyle.className = 'pdp-lifestyle';
            lifestyle.dataset.pdpLifestyle = '';
            lifestyle.alt = '';
            stage.appendChild(lifestyle);
          }
          lifestyle.src = src;
          stage.classList.add('has-lifestyle');
          if (main) main.style.opacity = '0';
        } else if (main && src) {
          main.src = src;
          if (stage) stage.classList.remove('has-lifestyle');
        }

        document.querySelectorAll('[data-pdp-thumb]').forEach(function (t) {
          t.classList.remove('is-active');
        });
        thumb.classList.add('is-active');
      });
    });
  }

  function init() {
    initBubbles();
    initReveal();
    initScrollAndMouse();
    initCursor();
    initColorways();
    initAddons();
    initPdpForm();
    initThumbs();
    initPackFromUrl();
    updatePdpTotal();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  document.addEventListener('shopify:section:load', init);
})();
