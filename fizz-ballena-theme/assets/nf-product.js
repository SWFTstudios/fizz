(function () {
  var section = document.querySelector('[data-nf-product]');
  if (!section) return;

  var jsonEl = document.querySelector('[data-nf-product-json]');
  var configEl = document.querySelector('[data-nf-product-config]');
  var config = configEl ? JSON.parse(configEl.textContent) : {};
  var variants = jsonEl ? JSON.parse(jsonEl.textContent) : [];

  var idInput = section.querySelector('[data-nf-variant-id]');
  var priceCurrent = section.querySelector('[data-nf-price-current]');
  var priceCompare = section.querySelector('[data-nf-price-compare]');
  var atc = section.querySelector('[data-nf-atc]');
  var atcLabel = section.querySelector('[data-nf-atc-label]');
  var wayLabel = section.querySelector('[data-nf-way-label]');
  var stage = section.querySelector('[data-nf-pdp-stage]');
  var rail = section.querySelector('[data-nf-media-rail]');
  var fallback = section.querySelector('[data-nf-fallback-bottle]');
  var slides = Array.prototype.slice.call(section.querySelectorAll('.nf-product__media'));
  var galleryMode = section.dataset.galleryMode || config.galleryMode || 'slider';
  var enableLightbox = section.dataset.enableLightbox === 'true' || config.enableLightbox === true;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var moneyFormat = config.moneyFormat || '${{amount}}';
  var soldOutText = config.soldOutText || 'Sold out';
  var addText = config.addText || 'Add to cart';
  var unavailableText = config.unavailableText || 'Unavailable';
  var slideOfTemplate = config.slideOfTemplate || '{{ current }} / {{ total }}';
  var index = 0;

  var lightbox = section.querySelector('[data-nf-lightbox]');
  var lightboxSlides = lightbox
    ? Array.prototype.slice.call(lightbox.querySelectorAll('[data-nf-lightbox-slide]'))
    : [];
  var lightboxCounter = lightbox ? lightbox.querySelector('[data-nf-lightbox-counter]') : null;
  var lightboxIndex = 0;
  var pointerStartX = 0;
  var pointerStartY = 0;
  var pointerMoved = false;
  var SWIPE_THRESHOLD = 48;
  var CLICK_THRESHOLD = 8;

  function formatMoney(cents) {
    var value = (cents / 100).toFixed(2);
    return moneyFormat.replace(/\{\{\s*amount[^}]*\}\}/, value);
  }

  function formatSlideOf(current, total) {
    return slideOfTemplate
      .replace(/\{\{\s*current\s*\}\}/, String(current))
      .replace(/\{\{\s*total\s*\}\}/, String(total));
  }

  function selectedOptions() {
    return Array.prototype.map.call(section.querySelectorAll('[data-nf-option]'), function (fieldset) {
      var checked = fieldset.querySelector('input:checked');
      return checked ? checked.value : null;
    });
  }

  function lightboxIndexForMediaIndex(mediaIndex) {
    var slide = slides[mediaIndex];
    if (!slide || slide.dataset.mediaType !== 'image') return -1;
    var lb = slide.dataset.lightboxIndex;
    return lb !== undefined && lb !== '' ? parseInt(lb, 10) : -1;
  }

  function mediaIndexForLightboxIndex(lbIndex) {
    for (var i = 0; i < slides.length; i++) {
      if (slides[i].dataset.lightboxIndex === String(lbIndex)) return i;
    }
    return -1;
  }

  function setIndex(next) {
    if (!slides.length) return;
    index = ((next % slides.length) + slides.length) % slides.length;
    showMedia(slides[index].dataset.mediaId, true);
  }

  function syncSliderTransform() {
    if (!rail || galleryMode !== 'slider') return;
    rail.style.transition = reduceMotion ? 'none' : 'transform 0.35s ease';
    rail.style.transform = 'translateX(-' + index * 100 + '%)';
  }

  function syncLightboxSlide() {
    if (!lightbox || !lightboxSlides.length) return;
    lightboxSlides.forEach(function (frame, i) {
      var active = i === lightboxIndex;
      frame.classList.toggle('is-active', active);
      frame.hidden = !active;
    });
    if (lightboxCounter) {
      lightboxCounter.textContent = formatSlideOf(lightboxIndex + 1, lightboxSlides.length);
    }
  }

  function openLightbox(lbIndex) {
    if (!enableLightbox || !lightbox || lbIndex < 0 || lbIndex >= lightboxSlides.length) return;
    lightboxIndex = lbIndex;
    syncLightboxSlide();
    if (typeof lightbox.showModal === 'function') {
      lightbox.showModal();
    } else {
      lightbox.setAttribute('open', '');
    }
  }

  function closeLightbox() {
    if (!lightbox) return;
    if (typeof lightbox.close === 'function') {
      lightbox.close();
    } else {
      lightbox.removeAttribute('open');
    }
  }

  function setLightboxIndex(next) {
    if (!lightboxSlides.length) return;
    lightboxIndex = ((next % lightboxSlides.length) + lightboxSlides.length) % lightboxSlides.length;
    syncLightboxSlide();
    var mediaIdx = mediaIndexForLightboxIndex(lightboxIndex);
    if (mediaIdx > -1) {
      showMedia(slides[mediaIdx].dataset.mediaId, true);
    }
  }

  function showMedia(mediaId, fromIndex) {
    if (!mediaId && mediaId !== 0) return;
    var found = -1;
    slides.forEach(function (media, i) {
      var active = media.dataset.mediaId === String(mediaId);
      media.classList.toggle('is-active', active);
      if (active) found = i;
    });
    if (found > -1) index = found;

    section.querySelectorAll('[data-nf-thumb]').forEach(function (thumb) {
      var on = thumb.dataset.mediaId === String(mediaId);
      thumb.classList.toggle('is-active', on);
      thumb.setAttribute('aria-current', on ? 'true' : 'false');
      if (on) {
        var strip = section.querySelector('[data-nf-thumbs]');
        if (strip) {
          var left = thumb.offsetLeft - (strip.clientWidth - thumb.offsetWidth) / 2;
          strip.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
        }
      }
    });
    section.querySelectorAll('[data-nf-dot]').forEach(function (dot) {
      var on = dot.dataset.mediaId === String(mediaId);
      dot.classList.toggle('is-active', on);
      dot.setAttribute('aria-current', on ? 'true' : 'false');
    });

    syncSliderTransform();

    if (lightbox && lightbox.open) {
      var lbIdx = lightboxIndexForMediaIndex(index);
      if (lbIdx > -1) {
        lightboxIndex = lbIdx;
        syncLightboxSlide();
      }
    }
  }

  function stageFromSwatch(id) {
    var swatch = section.querySelector('[data-nf-swatch][data-variant-id="' + id + '"]');
    if (!swatch || !stage) return;
    if (swatch.dataset.bg) stage.style.setProperty('--pdp-stage-bg', swatch.dataset.bg);
    if (swatch.dataset.bgEnd) stage.style.setProperty('--pdp-stage-bg-end', swatch.dataset.bgEnd);
    if (swatch.dataset.text) stage.style.setProperty('--pdp-stage-text', swatch.dataset.text);
    if (fallback && swatch.dataset.fallbackSrc) fallback.src = swatch.dataset.fallbackSrc;
    if (wayLabel && swatch.dataset.name) wayLabel.textContent = swatch.dataset.name;
    section.querySelectorAll('[data-nf-swatch]').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.dataset.variantId === String(id));
    });
  }

  function applyVariant(match, meta) {
    if (!match && !meta) return;
    var id = match ? match.id : meta.variantId;
    var price = match ? match.price : meta.price;
    var compare = match ? match.compare_at_price : meta.compare;
    var available = match ? match.available : meta.available === true || meta.available === 'true';
    var mediaId = match && match.featured_media ? match.featured_media.id : meta && meta.mediaId;

    if (idInput) idInput.value = id;
    if (priceCurrent) priceCurrent.textContent = formatMoney(price);
    if (priceCompare) {
      if (compare && compare > price) {
        priceCompare.textContent = formatMoney(compare);
        priceCompare.hidden = false;
      } else {
        priceCompare.hidden = true;
      }
    }
    if (atc) atc.disabled = !available;
    if (atcLabel) atcLabel.textContent = available ? addText : soldOutText;
    if (mediaId) showMedia(mediaId);
    if (meta) {
      if (wayLabel && meta.name) wayLabel.textContent = meta.name;
      if (stage) {
        if (meta.bg) stage.style.setProperty('--pdp-stage-bg', meta.bg);
        if (meta.bgEnd) stage.style.setProperty('--pdp-stage-bg-end', meta.bgEnd);
        if (meta.text) stage.style.setProperty('--pdp-stage-text', meta.text);
      }
      if (fallback && meta.fallbackSrc) fallback.src = meta.fallbackSrc;
      section.querySelectorAll('[data-nf-swatch]').forEach(function (btn) {
        btn.classList.toggle('is-active', btn.dataset.variantId === String(id));
      });
    } else {
      stageFromSwatch(id);
    }
    var url = new URL(window.location.href);
    url.searchParams.set('variant', id);
    window.history.replaceState({}, '', url);
  }

  function onOptionChange() {
    var opts = selectedOptions();
    if (!opts.length) return;
    var match = variants.find(function (variant) {
      return variant.options.every(function (value, i) {
        return value === opts[i];
      });
    });
    if (!match) {
      if (atc) atc.disabled = true;
      if (atcLabel) atcLabel.textContent = unavailableText;
      return;
    }
    applyVariant(match, null);
  }

  section.querySelectorAll('[data-nf-option-input]').forEach(function (input) {
    input.addEventListener('change', onOptionChange);
  });
  section.querySelectorAll('[data-nf-thumb]').forEach(function (thumb) {
    thumb.addEventListener('click', function () {
      showMedia(thumb.dataset.mediaId);
    });
  });
  section.querySelectorAll('[data-nf-dot]').forEach(function (dot) {
    dot.addEventListener('click', function () {
      showMedia(dot.dataset.mediaId);
    });
  });

  var prevBtn = section.querySelector('[data-nf-gallery-prev]');
  var nextBtn = section.querySelector('[data-nf-gallery-next]');
  if (prevBtn) prevBtn.addEventListener('click', function () { setIndex(index - 1); });
  if (nextBtn) nextBtn.addEventListener('click', function () { setIndex(index + 1); });

  section.querySelectorAll('[data-nf-swatch]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var options;
      try {
        options = JSON.parse(btn.dataset.options || '[]');
      } catch (err) {
        options = [];
      }
      section.querySelectorAll('[data-nf-option]').forEach(function (fieldset, i) {
        var input = fieldset.querySelector('input[value="' + CSS.escape(options[i] || '') + '"]');
        if (input) input.checked = true;
      });
      applyVariant(null, {
        variantId: btn.dataset.variantId,
        price: parseInt(btn.dataset.price, 10),
        compare: parseInt(btn.dataset.compare, 10),
        available: btn.dataset.available,
        mediaId: btn.dataset.mediaId,
        name: btn.dataset.name,
        bg: btn.dataset.bg,
        bgEnd: btn.dataset.bgEnd,
        text: btn.dataset.text,
        fallbackSrc: btn.dataset.fallbackSrc
      });
    });
  });

  section.querySelectorAll('[data-nf-lightbox-open]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (pointerMoved) return;
      var lbIdx = parseInt(btn.dataset.lightboxIndex, 10);
      openLightbox(lbIdx);
    });
  });

  if (lightbox) {
    var closeBtn = lightbox.querySelector('[data-nf-lightbox-close]');
    var lbPrev = lightbox.querySelector('[data-nf-lightbox-prev]');
    var lbNext = lightbox.querySelector('[data-nf-lightbox-next]');
    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    if (lbPrev) lbPrev.addEventListener('click', function () { setLightboxIndex(lightboxIndex - 1); });
    if (lbNext) lbNext.addEventListener('click', function () { setLightboxIndex(lightboxIndex + 1); });
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });
    lightbox.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setLightboxIndex(lightboxIndex - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setLightboxIndex(lightboxIndex + 1);
      }
    });
  }

  if (galleryMode === 'slider' && stage && slides.length > 1) {
    var startX = 0;
    var deltaX = 0;
    var dragging = false;

    stage.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.nf-product__arrow, [data-nf-lightbox-open], button, a, video, model-viewer, iframe')) return;
      dragging = true;
      pointerMoved = false;
      pointerStartX = e.clientX;
      pointerStartY = e.clientY;
      startX = e.clientX;
      deltaX = 0;
      stage.setPointerCapture(e.pointerId);
      if (rail) rail.style.transition = 'none';
    });
    stage.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      deltaX = e.clientX - startX;
      if (
        Math.abs(e.clientX - pointerStartX) > CLICK_THRESHOLD ||
        Math.abs(e.clientY - pointerStartY) > CLICK_THRESHOLD
      ) {
        pointerMoved = true;
      }
      if (!rail) return;
      var pct = (deltaX / stage.offsetWidth) * 100;
      rail.style.transform = 'translateX(calc(-' + index * 100 + '% + ' + pct + '%))';
    });
    function endDrag() {
      if (!dragging) return;
      dragging = false;
      if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
        setIndex(index + (deltaX < 0 ? 1 : -1));
      } else {
        syncSliderTransform();
      }
      deltaX = 0;
      window.setTimeout(function () {
        pointerMoved = false;
      }, 0);
    }
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);
  }

  if (stage) {
    stage.setAttribute('tabindex', '0');
    stage.addEventListener('keydown', function (e) {
      if (lightbox && lightbox.open) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setIndex(index - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setIndex(index + 1);
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (e.target.closest('[data-nf-lightbox-open]')) return;
        var lbIdx = lightboxIndexForMediaIndex(index);
        if (lbIdx > -1 && enableLightbox) {
          e.preventDefault();
          openLightbox(lbIdx);
        }
      }
    });
  }

  syncSliderTransform();
  if (lightboxSlides.length) syncLightboxSlide();

  section.querySelectorAll('[data-nf-stepper]').forEach(function (stepper) {
    var input = stepper.querySelector('[data-nf-qty], .nf-stepper__input');
    var dec = stepper.querySelector('[data-nf-stepper-dec]');
    var inc = stepper.querySelector('[data-nf-stepper-inc]');
    if (!input) return;
    function clampQty(value) {
      var min = parseInt(input.getAttribute('min') || '1', 10);
      var next = parseInt(value, 10);
      if (isNaN(next) || next < min) next = min;
      input.value = String(next);
    }
    if (dec) {
      dec.addEventListener('click', function () {
        clampQty((parseInt(input.value, 10) || 1) - 1);
      });
    }
    if (inc) {
      inc.addEventListener('click', function () {
        clampQty((parseInt(input.value, 10) || 1) + 1);
      });
    }
    input.addEventListener('change', function () {
      clampQty(input.value);
    });
  });
})();
