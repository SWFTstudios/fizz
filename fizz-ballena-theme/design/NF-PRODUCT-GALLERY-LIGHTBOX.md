# NF Product gallery — slider + grouped lightbox

**Date:** 2026-08-14  
**Theme:** Ballena Fizz (`fizz-ballena-theme/`) — **Ballena-only**; NeoFizz twin not updated in this pass.  
**Section:** `sections/nf-product.liquid`  
**Assets:** `assets/nf-product.js`, `assets/nf-base.css`

## Research (Shopify docs)

| Topic | Finding | Source |
| --- | --- | --- |
| Product media loop | Loop `product.media`; branch on `media.media_type`; use `image_url` / `image_tag` | [Support product media](https://shopify.dev/docs/storefronts/themes/product-merchandising/media/support-media) |
| Slideshow UX | Featured media + thumbnails; video/3D badges; do not obstruct player controls | [Product media UX](https://shopify.dev/docs/storefronts/themes/product-merchandising/media/media-ux) |
| High-res zoom | `image_url: width: 2048` for lightbox frames | Support product media (Dawn reference) |
| Variant media | `?variant={id}` preselects; `variant.featured_media` drives gallery jump | [Liquid product object](https://shopify.dev/docs/api/liquid/objects/product) |
| Native modal | `<dialog>` for focus trap + Escape (no third-party lightbox libs) | Shopify Liquid theme skill |

## Storefront vs theme editor

- **Editor:** `enable_lightbox`, `dark_surface`, existing gallery settings (`gallery_mode`, thumbs, arrows, `stage_mode`).
- **Storefront:** In-page slider (swipe/arrows/keyboard) + optional grouped lightbox on image click (tap without drag). Videos/3D stay in-slider only.

## Lightbox group

- Group id: `product-{{ product.id }}` — all **image** entries in `product.media` order.
- Non-image media (video, external_video, model) excluded from the dialog group per Shopify UX (do not wrap interactive players).

## Limitations

| Limit | Mitigation |
| --- | --- |
| No merchant-defined lightbox subsets | Group = all product images in Admin media order |
| Videos/3D not in lightbox | In-page slider retains `video_tag` / `model_viewer_tag` |
| Dark surface scoped to PDP section | Header + `nf-related` stay on `--nf-paper` |
| NeoFizz twin stale | Document divergence; sync in a follow-up if desired |
| Content-safe push | Code-only `--only` push; never overwrite `product.json` / `settings_data.json` |

## Sticky gallery (desktop side layout)

- Gallery pins with `top: calc(var(--nf-nav-top, 72px) + 16px)` and
  `height: calc(100dvh - nav - 32px)` so stage + thumbs fill the remaining
  viewport under the floating header.
- Buy box is **not** sticky; long accordion copy scrolls beside the gallery.
- Mobile / stack layout keep aspect-ratio stages (ATC stays above the fold).
- Thumbnails: one-line `overflow-x: auto` strip; `thumb_corner_radius` default 10px
  (independent of theme `image_corner_radius`).

## Description accordion

- First row: `product.description` in `<details open>` (`description_heading`).
  Product-admin HTML images render via `.nf-rte img`.
- Add-on rows: Accordion blocks (`title` / `body` ids unchanged) plus optional
  `image` (`image_picker`). Theme `richtext` cannot include images
  ([input settings](https://shopify.dev/docs/storefronts/themes/architecture/settings/input-settings)).
- Connect metafields in the Theme Editor (dynamic source on Body or Image).
  [Dynamic sources](https://shopify.dev/docs/storefronts/themes/architecture/settings/dynamic-sources).
