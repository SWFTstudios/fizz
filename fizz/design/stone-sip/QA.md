# Stone Sip redesign — QA checklist

## Automated checks completed
- All new/edited JSON templates parse: index, collection, cart, page.about, product.bottle, product.flavor-pack, product.co2-refill
- All template section types resolve to existing `sections/*.liquid` files
- All `fizz-ss-*` sections have balanced `{% schema %}` / `{% endschema %}` and spacing tier classes
- Lenis, GSAP, ScrollTrigger, `fizz-ss.css`, `fizz-ss-motion.js` present under `assets/`

## Preview / publish (manual — store auth required)
Shopify CLI returned **401** for `g9rykd-jt.myshopify.com` in this environment. When authenticated:

```bash
cd fizz
shopify theme push --store g9rykd-jt.myshopify.com --unpublished --theme "Fizz SS Redesign"
# or local preview:
shopify theme dev --path . --store g9rykd-jt.myshopify.com
```

Do **not** push to the live theme until visual + commerce QA passes.

## Visual / motion (375 / 1024 / 1440)
- [ ] Home: hero split-text on load, marquees loop, scroll reveals on intro/lineup/reviews/CTA/benefits/story
- [ ] Lenis smooth scroll; `prefers-reduced-motion` shows content without motion
- [ ] No double padding (wrapper tier owns `padding-block`)
- [ ] Footer lineup marquee + link columns

## Commerce
- [ ] Bottle PDP: color swatches swap via Section Rendering API (`fizz-pdp.js`)
- [ ] Flavor PDP: variant select + add to cart
- [ ] CO₂ PDP: selling-plan radios + ATC
- [ ] Cart page + cart drawer AJAX qty/remove still work
- [ ] Checkout handoff from drawer and cart page

## About page
- Assign template **page.about** to the About page in admin (Online Store → Pages → About → Theme template)
