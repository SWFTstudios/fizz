# NF Bottles (product carousel) — Research

**Date:** 2026-08-04  
**Section:** `sections/nf-bottles.liquid`  
**Reference:** Homepage NF Flavors 3-up lifestyle cards, adapted for bottle colorways

## Verified capabilities

| Question | Answer | Source |
|----------|--------|--------|
| Section `range` settings for border-radius? | **Yes** — expose as CSS variables on the section root | [Section schema](https://shopify.dev/docs/storefronts/themes/architecture/sections/section-schema), [Settings](https://shopify.dev/docs/storefronts/themes/architecture/settings) |
| Deep-link colorway via `?variant=`? | **Yes** | [Liquid product object](https://shopify.dev/docs/api/liquid/objects/product) |
| Read variant gallery / featured media? | **Yes** — `variant.featured_media`, `variant.image`, `product.media` | Liquid media / variant objects |
| Lifestyle file metafield? | **Yes** — `custom.warp_media` (existing NeoFizz) | `docs/07-colorways-metafields.md` |

## Storefront vs editor

- **Editor:** bottle product picker, colorway blocks (`color_slug`), media/button corner radius, optional image override
- **Storefront:** Liquid matches variants via `nf-color-slug`, resolves lifestyle media by priority, renders flavors-style 3-up / mobile snap grid

## Lifestyle media priority

1. Block image override  
2. `variant.metafields.custom.warp_media`  
3. First `product.media` image whose alt contains the color slug  
4. `variant.featured_media` / `variant.image`  
5. Theme asset `fizz-bottle-product-{slug}.png`

## Limitations

- Liquid cannot parse gallery JSON or media tags beyond alt-string matching
- Desktop grid is 3 columns (same as flavors); up to 6 blocks snap-scroll on mobile
- Content-safe push only — do not overwrite `settings_data.json` / template JSON
