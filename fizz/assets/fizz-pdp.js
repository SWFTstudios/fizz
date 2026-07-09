(() => {
  const HEADER_OFFSET = 80;

  function fetchSection(productUrl, sectionId, variantId) {
    const url = new URL(productUrl, window.location.origin);
    if (variantId) url.searchParams.set('variant', variantId);
    url.searchParams.set('section_id', sectionId);
    return fetch(url.toString()).then((r) => {
      if (!r.ok) throw new Error('Section fetch failed');
      return r.text();
    });
  }

  function parseSectionHtml(html, sectionId) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.querySelector(`#shopify-section-${sectionId}`);
  }

  function updateUrl(variantId) {
    const url = new URL(window.location.href);
    url.searchParams.set('variant', variantId);
    window.history.replaceState({}, '', url.toString());
  }

  function initVariantSwitcher(hero) {
    const productUrl = hero.dataset.productUrl;
    const sectionId = hero.dataset.sectionId;
    const storySection = document.querySelector('[data-fizz-pdp-variant-story]');
    const storySectionId = storySection?.dataset.sectionId;
    const elevateSection = document.querySelector('[data-fizz-pdp-elevate]');
    const elevateSectionId = elevateSection?.dataset.sectionId;

    hero.addEventListener('click', (event) => {
      const swatch = event.target.closest('[data-variant-id]');
      if (!swatch || swatch.tagName === 'A') return;
      event.preventDefault();

      const variantId = swatch.dataset.variantId;
      const colorSlug = swatch.dataset.colorSlug;
      if (!variantId || swatch.classList.contains('is-active')) return;

      hero.classList.add('is-loading');

      const fetches = [fetchSection(productUrl, sectionId, variantId)];
      if (storySectionId) fetches.push(fetchSection(productUrl, storySectionId, variantId));
      if (elevateSectionId) fetches.push(fetchSection(productUrl, elevateSectionId, variantId));

      Promise.all(fetches)
        .then((results) => {
          const heroHtml = results[0];
          let idx = 1;
          const newHero = parseSectionHtml(heroHtml, sectionId);
          if (newHero) hero.replaceWith(newHero);
          if (storySectionId && results[idx]) {
            const newStory = parseSectionHtml(results[idx], storySectionId);
            if (newStory && storySection) storySection.replaceWith(newStory);
            idx += 1;
          }
          if (elevateSectionId && results[idx]) {
            const newElevate = parseSectionHtml(results[idx], elevateSectionId);
            if (newElevate && elevateSection) elevateSection.replaceWith(newElevate);
          }
          updateUrl(variantId);
          initAll();
        })
        .catch(() => {
          window.location.href = `${productUrl}?variant=${variantId}`;
        });
    });
  }

  function initGallery(hero) {
    const mainImg = hero.querySelector('[data-fizz-pdp-main-image]');
    const thumbs = hero.querySelectorAll('[data-fizz-pdp-thumb]');
    if (!mainImg || !thumbs.length) return;

    thumbs.forEach((thumb) => {
      thumb.addEventListener('click', () => {
        const src = thumb.dataset.fullSrc;
        const alt = thumb.dataset.alt;
        if (!src) return;
        mainImg.src = src;
        if (alt) mainImg.alt = alt;
        thumbs.forEach((t) => t.classList.remove('is-active'));
        thumb.classList.add('is-active');
      });
    });
  }

  function initStickyAtc() {
    const bar = document.querySelector('[data-fizz-sticky-atc]');
    const hero = document.querySelector('[data-fizz-pdp-hero]');
    if (!bar || !hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        bar.hidden = entry.isIntersecting || entry.intersectionRatio > 0;
      },
      { threshold: 0, rootMargin: `-${HEADER_OFFSET}px 0px 0px 0px` }
    );
    observer.observe(hero);
  }

  function initRecommendations() {
    const section = document.querySelector('[data-fizz-pdp-recommendations]');
    if (!section) return;

    const grid = section.querySelector('[data-fizz-recommendations-grid]');
    const loading = section.querySelector('[data-fizz-recommendations-loading]');
    const productId = section.dataset.productId;
    const intent = section.dataset.intent || 'complementary';
    const limit = section.dataset.limit || '4';

    const url = `${window.Shopify?.routes?.product_recommendations_url || '/recommendations/products'}.json?product_id=${productId}&limit=${limit}&intent=${intent}`;

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (loading) loading.remove();
        const products = data.products || [];
        if (!products.length) {
          section.hidden = true;
          return;
        }
        grid.innerHTML = products
          .map(
            (p) => `
          <a href="${p.url}" class="fizz-pdp-card">
            <div class="fizz-pdp-card__media">
              <img src="${p.featured_image}" alt="${p.title}" loading="lazy" width="480" height="480">
            </div>
            <p class="fizz-pdp-card__title">${p.title}</p>
            <p class="fizz-pdp-card__price">${formatMoney(p.price)}</p>
          </a>`
          )
          .join('');
      })
      .catch(() => {
        section.hidden = true;
      });
  }

  function formatMoney(cents) {
    if (window.Shopify?.formatMoney) return window.Shopify.formatMoney(cents);
    return `$${(cents / 100).toFixed(2)}`;
  }

  function initExperienceCarousel(root) {
    const slides = root.querySelectorAll('[data-fizz-exp-slide]');
    const viewport = root.querySelector('[data-fizz-exp-track]')?.parentElement;
    const track = root.querySelector('[data-fizz-exp-track]');
    if (!slides.length || !viewport || !track) return;

    let activeIndex = 0;
    const prevBtn = root.querySelector('[data-fizz-exp-prev]');
    const nextBtn = root.querySelector('[data-fizz-exp-next]');

    function setActive(index) {
      activeIndex = (index + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        const isActive = i === activeIndex;
        slide.classList.toggle('is-active', isActive);
        slide.setAttribute('aria-hidden', isActive ? 'false' : 'true');
      });
      if (window.FizzSwipe) {
        window.FizzSwipe.setTrackTransform(track, activeIndex, 0, false);
      }
    }

    prevBtn?.addEventListener('click', () => setActive(activeIndex - 1));
    nextBtn?.addEventListener('click', () => setActive(activeIndex + 1));

    root.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setActive(activeIndex - 1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        setActive(activeIndex + 1);
      }
    });

    setActive(0);

    if (window.FizzSwipe && slides.length > 1) {
      window.FizzSwipe.attachDiscrete({
        viewport,
        track,
        getIndex: () => activeIndex,
        setIndex: (index) => setActive(index),
        slideCount: slides.length,
      });
    }
  }

  function initExperienceAddToCart(root) {
    root.querySelectorAll('[data-fizz-exp-qty]').forEach((wrap) => {
      const input = wrap.querySelector('input');
      const minus = wrap.querySelector('[data-fizz-exp-minus]');
      const plus = wrap.querySelector('[data-fizz-exp-plus]');
      if (!input) return;

      minus?.addEventListener('click', () => {
        const next = Math.max(1, parseInt(input.value, 10) - 1);
        input.value = String(next);
      });

      plus?.addEventListener('click', () => {
        const next = parseInt(input.value, 10) + 1;
        input.value = String(next);
      });
    });

    root.querySelectorAll('[data-fizz-exp-add]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const variantId = btn.dataset.variantId;
        const slide = btn.closest('[data-fizz-exp-slide]');
        const input = slide?.querySelector('[data-fizz-exp-qty] input');
        const quantity = Math.max(1, parseInt(input?.value || '1', 10));
        if (!variantId || btn.disabled) return;

        const original = btn.textContent.trim();
        btn.disabled = true;
        btn.textContent = 'ADDING…';

        try {
          const res = await fetch(`${window.Shopify?.routes?.root || '/'}cart/add.js`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ items: [{ id: Number(variantId), quantity }] }),
          });
          if (!res.ok) throw new Error('Add failed');
          const cartRes = await fetch(`${window.Shopify?.routes?.root || '/'}cart.js`);
          if (cartRes.ok) {
            const cart = await cartRes.json();
            document.dispatchEvent(new CustomEvent('fizz:cart-updated', { detail: { cart } }));
            if (window.FizzCart?.updateCartBadge) {
              window.FizzCart.updateCartBadge(cart.item_count);
            }
          }
          btn.textContent = 'ADDED';
          setTimeout(() => {
            btn.textContent = original;
            btn.disabled = false;
          }, 1500);
        } catch {
          btn.textContent = 'ERROR';
          btn.disabled = false;
          setTimeout(() => {
            btn.textContent = original;
          }, 1500);
        }
      });
    });
  }

  function initAll() {
    document.querySelectorAll('[data-fizz-pdp-hero]').forEach((hero) => {
      initVariantSwitcher(hero);
      initGallery(hero);
    });
    document.querySelectorAll('[data-fizz-pdp-experience]').forEach((section) => {
      initExperienceCarousel(section);
      initExperienceAddToCart(section);
    });
    initStickyAtc();
    initRecommendations();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
