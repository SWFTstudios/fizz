# Chapter 04 — Homepage build

Template: [`templates/index.json`](../templates/index.json)

## Section pipeline

| Order | Section file | Purpose |
| --- | --- | --- |
| 1 | `sections/j14-intro.liquid` | Mask fly-through + slides |
| 2 | `sections/j14-mosaic.liquid` | Editable media grid |
| 3 | `sections/j14-colorways.liquid` | Bottle variants / warp |
| 4 | `sections/j14-how-sticky.liquid` | Sticky scrub how-to |
| 5 | `sections/j14-flavors.liquid` | Flavor packs |
| 6 | `sections/j14-about.liquid` | Brand story |
| 7 | `sections/j14-sustainability.liquid` | Stats / claims |
| 8 | `sections/j14-footer.liquid` | CTA + newsletter |

About and sustainability are **separate sections** so merchants can reorder or
remove either without schema coupling.

## Tutorial: add a mosaic tile

1. Theme editor → Homepage → **J14 Media Mosaic**.
2. Add block **Tile**.
3. Set image / video / external video / theme asset fallback
   (priority handled by `snippets/j14-media.liquid`).
4. Choose span (desktop 12-col), optional tall / wide-mobile.
5. Save → hard refresh storefront.

## Tutorial: wire colorways to a bottle product

1. Theme settings → **Products** → Default bottle product  
   **or** section setting on J14 Colorways.
2. Ensure variants have readable color titles (slug heuristic) or set
   `custom.color_slug` / scene metafields ([Chapter 07](07-colorways-metafields.md)).
3. Optionally upload `custom.warp_media` per variant for carousel panels.
4. Toggle **Sync scene** so background/CTA follow the active slide.

## Tutorial: split about vs sustainability

1. Edit **J14 About** for story + hero media only.
2. Edit **J14 Sustainability** for eyebrow, heading, body, claim blocks.
3. Keep distinct `anchor_id` values (`about`, `sustainability`) for header nav.

## Media priority (all media blocks)

Implemented in [`snippets/j14-media.liquid`](../snippets/j14-media.liquid):

1. Shopify-hosted `video`  
2. External `video_url` (YouTube / Vimeo)  
3. `image` picker  
4. Theme asset filename string  
5. Placeholder SVG  

Shopify’s `video` setting has **no default** — asset fallbacks are required.
([Input settings](https://shopify.dev/docs/storefronts/themes/architecture/settings/input-settings))

## Flavors lineup (current defaults)

| Title | Asset |
| --- | --- |
| Orange Tangerine | `flavor-lifestyle-orange-tangerine.jpg` |
| Cherry Limeade | `flavor-lifestyle-cherry-limeade.jpg` |
| Mixed Berry | `flavor-lifestyle-mixed-berry.jpg` |

Deep intro mechanics: [Chapter 05](05-intro-flythrough.md)

Next: [Chapter 05 — Intro fly-through](05-intro-flythrough.md)
