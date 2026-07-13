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

  var bubbleFields = [];
  var bubbleRafId = 0;
  var bubbleIo = null;
  var bubbleResizeObs = null;

  function getBubbleStyle() {
    var html = document.documentElement;
    if (html.classList.contains('bubble-style-bold')) return 'bold';
    if (html.classList.contains('bubble-style-ring')) return 'ring';
    return 'glass';
  }

  function resolveBubbleColors(field, colorVar) {
    field.style.setProperty('--bub-color', colorVar);
    var stroke = getComputedStyle(field).getPropertyValue('--bub-color').trim();
    if (!stroke) stroke = 'rgba(242,239,231,0.55)';
    return { stroke: stroke, fill: stroke };
  }

  function BubbleParticle(x, y, opts) {
    this.x = x;
    this.y = y;
    this.radius = opts.radius;
    this.dx = opts.dx;
    this.dy = opts.dy;
    this.strokeColor = opts.strokeColor;
    this.fillColor = opts.fillColor;
    this.highlightOpacity = opts.highlightOpacity;
    this.strokeWidth = opts.strokeWidth;
    this.fillGradient = opts.fillGradient;
    this.spawnY = y;
    this.canvasHeight = opts.canvasHeight;
    this.peakOpacity = opts.peakOpacity;
  }

  BubbleParticle.prototype.move = function () {
    this.x += this.dx;
    this.y -= this.dy;
  };

  BubbleParticle.prototype.getOpacity = function () {
    var travel = this.spawnY - this.y;
    var maxTravel = this.canvasHeight + this.radius * 2;
    var progress = maxTravel > 0 ? travel / maxTravel : 0;
    var peak = this.peakOpacity;
    if (progress < 0.12) return peak * (progress / 0.12);
    if (progress > 0.85) return peak * Math.max(0, (1 - progress) / 0.15);
    return peak;
  };

  BubbleParticle.prototype.draw = function (ctx) {
    var opacity = this.getOpacity();
    if (opacity <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.lineWidth = this.strokeWidth;
    ctx.strokeStyle = this.strokeColor;
    ctx.stroke();
    if (this.fillGradient) {
      var gradient = ctx.createRadialGradient(
        this.x,
        this.y,
        1,
        this.x + 0.5,
        this.y + 0.5,
        this.radius
      );
      gradient.addColorStop(0.3, 'rgba(255,255,255,' + this.highlightOpacity + ')');
      gradient.addColorStop(0.95, this.fillColor);
      ctx.fillStyle = gradient;
      ctx.fill();
    }
    ctx.restore();
  };

  function createBubbleParticle(rnd, w, h, style, colors, sizeScale, peakOpacity) {
    var radius = (5 + rnd() * 16) * sizeScale;
    if (style === 'bold') radius *= 1.15;
    var x = radius + rnd() * Math.max(radius, w - radius * 2);
    var y = h + rnd() * radius;
    var wobble = document.documentElement.classList.contains('bubble-wobble');
    return new BubbleParticle(x, y, {
      radius: radius,
      dx: wobble ? (rnd() - 0.5) * 1.2 : (rnd() - 0.5) * 0.6,
      dy: 0.4 + rnd() * 1.2,
      strokeColor: colors.stroke,
      fillColor: colors.fill,
      highlightOpacity: style === 'bold' ? 0.5 : style === 'glass' ? 0.35 : 0.15,
      strokeWidth: style === 'bold' ? 2.5 : style === 'glass' ? 1.75 : 1.25,
      fillGradient: style !== 'ring',
      canvasHeight: h,
      peakOpacity: peakOpacity,
    });
  }

  function respawnBubbleParticle(p, rnd, w, h, style, colors, sizeScale, peakOpacity) {
    var next = createBubbleParticle(rnd, w, h, style, colors, sizeScale, peakOpacity);
    p.x = next.x;
    p.y = next.y;
    p.radius = next.radius;
    p.dx = next.dx;
    p.dy = next.dy;
    p.strokeColor = next.strokeColor;
    p.fillColor = next.fillColor;
    p.highlightOpacity = next.highlightOpacity;
    p.strokeWidth = next.strokeWidth;
    p.fillGradient = next.fillGradient;
    p.spawnY = next.spawnY;
    p.canvasHeight = next.canvasHeight;
    p.peakOpacity = next.peakOpacity;
  }

  function resizeBubbleField(state) {
    var rect = state.field.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    state.width = rect.width;
    state.height = rect.height;
    if (state.width < 1 || state.height < 1) return;
    state.canvas.width = Math.max(1, Math.floor(state.width * dpr));
    state.canvas.height = Math.max(1, Math.floor(state.height * dpr));
    state.canvas.style.width = state.width + 'px';
    state.canvas.style.height = state.height + 'px';
    state.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    state.colors = resolveBubbleColors(state.field, state.colorVar);
    var style = getBubbleStyle();
    state.particles = [];
    for (var i = 0; i < state.count; i++) {
      state.particles.push(
        createBubbleParticle(state.rnd, state.width, state.height, style, state.colors, state.sizeScale, state.peakOpacity)
      );
    }
  }

  function bubbleTick() {
    bubbleRafId = 0;
    var style = getBubbleStyle();
    var anyActive = false;
    bubbleFields.forEach(function (state) {
      if (!state.visible || state.width < 1 || state.height < 1) return;
      anyActive = true;
      state.colors = resolveBubbleColors(state.field, state.colorVar);
      var ctx = state.ctx;
      ctx.clearRect(0, 0, state.width, state.height);
      state.particles.forEach(function (p) {
        p.move();
        if (p.y + p.radius < 0) {
          respawnBubbleParticle(p, state.rnd, state.width, state.height, style, state.colors, state.sizeScale, state.peakOpacity);
        }
        p.draw(ctx);
      });
    });
    if (anyActive) bubbleRafId = requestAnimationFrame(bubbleTick);
  }

  function startBubbleLoop() {
    if (!bubbleRafId) bubbleRafId = requestAnimationFrame(bubbleTick);
  }

  function initBubbles() {
    if (reduced) return;
    if (document.documentElement.dataset.bubbleEnabled === 'false') return;
    if (!document.querySelector('[data-bubbles]')) return;

    var root = getComputedStyle(document.documentElement);
    var sizeScale = parseFloat(root.getPropertyValue('--bubble-size-scale')) || 1;
    var countScale = parseFloat(root.getPropertyValue('--bubble-count-scale')) || 1;
    var defaultPeak = parseFloat(root.getPropertyValue('--bubble-peak-opacity')) || 0.88;

    document.querySelectorAll('[data-bubbles]').forEach(function (field) {
      if (field.__bubbleCanvas) return;

      var count = Math.round(parseInt(field.dataset.bubCount || '14', 10) * countScale);
      var colorVar = field.dataset.bubColor || 'rgba(242,239,231,.45)';
      var rnd = mulberry(parseInt(field.dataset.bubSeed || '7', 10));
      var peakOpacity = field.dataset.bubPeak ? parseFloat(field.dataset.bubPeak) : defaultPeak;

      if (field.dataset.bubPeak) field.style.setProperty('--bub-peak', field.dataset.bubPeak);

      var canvas = document.createElement('canvas');
      canvas.className = 'bubf-canvas';
      canvas.setAttribute('aria-hidden', 'true');
      field.appendChild(canvas);

      var ctx = canvas.getContext('2d');
      if (!ctx) return;

      var state = {
        field: field,
        canvas: canvas,
        ctx: ctx,
        particles: [],
        visible: true,
        width: 0,
        height: 0,
        count: count,
        colorVar: colorVar,
        rnd: rnd,
        sizeScale: sizeScale,
        peakOpacity: peakOpacity,
        colors: resolveBubbleColors(field, colorVar),
      };

      field.__bubbleCanvas = state;
      bubbleFields.push(state);
      resizeBubbleField(state);
    });

    if (!bubbleFields.length) return;

    if ('ResizeObserver' in window && !bubbleResizeObs) {
      bubbleResizeObs = new ResizeObserver(function (entries) {
        entries.forEach(function (entry) {
          var state = entry.target.__bubbleCanvas;
          if (state) resizeBubbleField(state);
        });
        startBubbleLoop();
      });
      bubbleFields.forEach(function (state) {
        bubbleResizeObs.observe(state.field);
      });
    } else if (!window.__fizzBubbleResizeBound) {
      window.__fizzBubbleResizeBound = true;
      window.addEventListener(
        'resize',
        function () {
          bubbleFields.forEach(function (state) {
            resizeBubbleField(state);
          });
          startBubbleLoop();
        },
        { passive: true }
      );
    }

    if ('IntersectionObserver' in window && !bubbleIo) {
      bubbleIo = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            var state = entry.target.__bubbleCanvas;
            if (state) state.visible = entry.isIntersecting;
          });
          startBubbleLoop();
        },
        { threshold: 0.05 }
      );
      bubbleFields.forEach(function (state) {
        bubbleIo.observe(state.field);
      });
    }

    startBubbleLoop();
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
        var hot = e.target.closest && e.target.closest('a,button,.sw,.fpanel,[data-hot],.addon,.bundle-card,.thumb');
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

  function getPdpRoot(el) {
    return el.closest('[data-pdp]') || el;
  }

  function clearPdpThumbSelection(pdp) {
    pdp.querySelectorAll('[data-pdp-thumb]').forEach(function (t) {
      t.classList.remove('is-active');
    });
  }

  function setPdpMainPhoto(pdp, src) {
    if (!pdp || !src) return;
    var stage = pdp.querySelector('[data-pdp-stage]');
    var main = pdp.querySelector('[data-way-photo]');
    if (stage) {
      stage.classList.remove('has-lifestyle');
      var lifestyle = stage.querySelector('[data-pdp-lifestyle]');
      if (lifestyle) lifestyle.remove();
    }
    if (main) {
      main.src = src;
      main.style.opacity = '1';
    }
  }

  function applySwatch(btn) {
    var targetSel = btn.dataset.target;
    var target = targetSel ? document.querySelector(targetSel) : btn.closest('[data-way]') || btn.closest('[data-pdp]');
    if (!target) return;
    var pdp = getPdpRoot(target);

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

    if (img) setPdpMainPhoto(pdp, img);
    clearPdpThumbSelection(pdp);

    var stage = pdp.querySelector('[data-pdp-stage]');
    if (stage && hex && !img) {
      stage.style.background = 'radial-gradient(ellipse 80% 90% at 50% 100%,' + hex + '33,#0b0e12)';
    }

    if (variantId) {
      var url = new URL(window.location.href);
      url.searchParams.set('variant', variantId);
      window.history.replaceState({}, '', url.pathname + url.search + url.hash);
    }

    var label = target.querySelector('[data-way-name]');
    if (label && name) label.textContent = name;

    var big = target.querySelector('[data-way-bigname]');
    if (big && name) big.textContent = name;

    var optlab = target.querySelector('[data-pdp-way-label]');
    if (optlab && name) optlab.textContent = name;

    var variantInput = target.querySelector('[data-pdp-variant-id]');
    if (variantInput && variantId) variantInput.value = variantId;

    var formWrap = target.querySelector('[data-pdp-form]');
    if (formWrap && price) {
      var parsed = parseMoney(price);
      if (parsed) formWrap.dataset.basePrice = String(parsed);
    }

    var cta = target.querySelector('[data-pdp-submit]');
    if (cta && price) cta.textContent = 'Add to cart — ' + price;

    if (formWrap) updatePdpTotal();

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

    var bottleLink = target.querySelector('[data-way-photo-link]');
    if (bottleLink && btn.dataset.shopUrl) bottleLink.href = btn.dataset.shopUrl;
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

  function initVariantFromUrl() {
    var params = new URLSearchParams(window.location.search);
    var variantId = params.get('variant');
    if (!variantId) return;
    var btn = document.querySelector('#colors [data-way-swatch][data-variant-id="' + variantId + '"]')
      || document.querySelector('[data-way-swatch][data-variant-id="' + variantId + '"]');
    if (btn) applySwatch(btn);
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
          return fetch((window.Shopify && window.Shopify.routes ? window.Shopify.routes.root : '/') + 'cart.js', {
            headers: { Accept: 'application/json' },
          });
        })
        .then(function (res) {
          if (!res.ok) throw new Error('Cart fetch failed');
          return res.json();
        })
        .then(function (cart) {
          var cartRoot = (window.Shopify && window.Shopify.routes ? window.Shopify.routes.root : '/');
          var hasDrawer = document.querySelector('[data-fizz-cart-drawer]');
          if (window.FizzCart && hasDrawer) {
            window.FizzCart.updateCartBadge(cart.item_count);
            window.FizzCart.dispatchCartUpdated(cart);
            window.FizzCart.openDrawer();
          } else {
            window.location.href = cartRoot + 'cart';
          }
          if (btn) {
            btn.disabled = false;
            updatePdpTotal();
          }
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
        var pdp = getPdpRoot(thumb);
        var src = thumb.dataset.fullSrc;
        setPdpMainPhoto(pdp, src);
        pdp.querySelectorAll('[data-pdp-thumb]').forEach(function (t) {
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
    initVariantFromUrl();
    updatePdpTotal();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  document.addEventListener('shopify:section:load', init);
})();
