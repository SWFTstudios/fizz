# Chapter 04 — Homepage build

Template: [`templates/index.json`](../templates/index.json)

## Section pipeline

| Order | Section file | Purpose |
| --- | --- | --- |
| 1 | `sections/nf-hero.liquid` | Glyph preloader + clip-path hero window + lifestyle slider |
| 2 | `sections/nf-marquee.liquid` | Keyword strip |
| 3 | `sections/nf-story-split.liquid` | Brand story + lifestyle |
| 4 | `sections/nf-product-bento.liquid` | Dark rounded product cards |
| 5 | `sections/nf-how-sticky.liquid` | Sticky scrub how-to (image / video / text / button) |
| 6 | `sections/nf-features.liquid` | Accordion feature cards |
| 7 | `sections/nf-stats.liquid` | Glass impact stats |
| 8 | `sections/nf-flavors.liquid` | Flavor packs |

Header / footer live in `header-group.json` / `footer-group.json` (NF Header,
NF Footer 2). Nav anchors: Colors, How it works, Flavors, About, Shop.

## Tutorial: edit hero slides

1. Theme editor → Homepage → **NF Hero**.
2. Add or reorder **Media** blocks.
3. Prefer theme-editor uploads; curated fallbacks ship as
   `nf-lifestyle-hero-0N.jpg` via the `asset` setting.
4. Tune loader duration / enable in section settings.
5. Save → hard refresh storefront (preloader skips in design mode).

## Tutorial: wire the product bento

1. Edit **NF Product Bento** blocks: product picker, label, media overrides.
2. Ensure bottle products have colorway-friendly variant titles or metafields
   ([Chapter 07](07-colorways-metafields.md)).
3. Keep card copy short — the bento is a shoppable grid, not a PDP.

## Tutorial: sticky how-to steps

1. Edit **NF How To Use** blocks (media + text + optional CTA).
2. Keep one job per step; scrub length is controlled by section settings.
3. Confirm `prefers-reduced-motion` / Theme `motion_enabled` still shows static
   steps ([Chapter 08](08-motion-accessibility.md)).

## Media priority (all media blocks)

Implemented in [`snippets/nf-media.liquid`](../snippets/nf-media.liquid):

1. Shopify-hosted `video`  
2. External `video_url` (YouTube / Vimeo)  
3. Image setting  
4. Theme asset filename fallback  

`video` settings have no Liquid default — always provide an asset fallback.

## Theme styles

Max **5** presets (Shopify hard limit). Default: **Steel Navy**. Merchants can
switch Theme style or enable custom colors in Theme settings.

Next: [Chapter 05 — Intro / hero](05-intro-flythrough.md)
