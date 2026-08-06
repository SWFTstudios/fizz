# NF Product Lifestyle Slider — Research

**Date:** 2026-08-04  
**Section:** `sections/nf-product-lifestyle-slider.liquid`  
**Reference:** Closca-style product lifestyle slider (screen recording)

## Verified capabilities

| Question | Answer | Source |
|----------|--------|--------|
| Does `?variant={id}` preselect on PDP? | **Yes** | [Liquid product object](https://shopify.dev/docs/api/liquid/objects/product) |
| Can slides auto-build from variants? | **Yes** — loop `product.variants` | Same docs; NeoFizz `nf-colorways` |
| Color slug → bottle PNG? | **Yes** — `nf-color-slug` + `fizz-bottle-product-{slug}.png` | Theme assets + snippet |
| Pill lifestyle + bottle layer? | Theme CSS only (`border-radius: 999px` + absolute bottle) | Storefront CSS |

## Storefront vs editor

- **Editor:** product picker, size/autoplay settings, optional override blocks by `color_slug`
- **Storefront:** Liquid emits one slide per variant; JS handles arrows, counter, peek, autoplay

## Limitations

- No native variant picker setting — product + auto loop; overrides via blocks
- Lifestyle images are merchant uploads / metafields / tinted scene fallback
- Brand typeface remains Helvetica Neue LT Std (no Closca serif)
- Content-safe push only — never overwrite `settings_data.json` / template JSON
