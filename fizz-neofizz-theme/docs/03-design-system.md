# Chapter 03 — Design system

## Tokens

Rendered by [`snippets/nf-theme-tokens.liquid`](../snippets/nf-theme-tokens.liquid)
from Theme settings / presets:

| Token | Role |
| --- | --- |
| `--nf-paper` | Page background (intro mask fill) |
| `--nf-ink` | Primary text |
| `--nf-accent` | Buttons, active states |
| `--nf-surface` | Cards / panels |
| `--nf-dark` / `--nf-dark-text` | Dark bands |
| `--nf-font-heading` / `--nf-font-body` | Typography |
| `--nf-gutter` / `--nf-page-width` | Layout |
| `--nf-radius` | Buttons |

Paper for the live Lime Fizz / ice palette is typically `#e8edf5` — the intro
mask fill **must** use `var(--nf-paper)` so Theme style switches stay coherent.

## Five Theme styles (hard limit)

Shopify allows at most **five** presets in `settings_data.json`. This theme
ships exactly five:

1. Lime Fizz  
2. Steel Navy  
3. Citrus Burst  
4. Berry Night  
5. Electric Pool  

Preset hex maps live in
[`snippets/nf-colorway-preset-data.liquid`](../snippets/nf-colorway-preset-data.liquid).
Merchants can enable **Use custom colors** to override with pickers
(`visible_if`).

## Bottle / scene colorways

Per-variant scene gradients (carousel + PDP stage) resolve through:

1. Variant metafields (`custom.scene_*`, `custom.swatch_hex`, …)  
2. Else Liquid slug map in `snippets/nf-colorway-scene.liquid`  
3. Else theme defaults  

Slug detection: `snippets/nf-color-slug.liquid`.

Because Liquid cannot load a JSON color database at runtime, the slug map is
mirrored in Liquid case statements. See research report and
[Chapter 07](07-colorways-metafields.md).

## Typography

- Heading: `font_picker` (default Anton)
- Body: `font_picker` (default Work Sans)
- Optional uppercase headings via Theme settings

## Spacing & layout

- Mobile-first gutters (`--nf-gutter`)
- Max page width range setting
- Sticky header with configurable blur / gradient

## Asset strategy

| Kind | Convention | Example |
| --- | --- | --- |
| Intro masks | Exact filenames in Liquid | `Fizz_Logo_Intro.svg` |
| Lifestyle photos | kebab descriptive | `flavor-lifestyle-mixed-berry.jpg` |
| Scripts | `nf-*.js` | `nf-intro.js` |
| Vendor | vendored min files | `gsap.min.js` |

Shopify CDN asset URLs are **case-sensitive**. On macOS’s case-insensitive
disk, `Fizz_Logo_INTRO_SVG_Mobile.svg` and `…_MOBILE.svg` can collide locally —
always keep one canonical name and match Liquid exactly.

### Wired vs library media

This package ships the masks and flavor lifestyle images the templates
reference. Other bottle/flavor-box files may exist on disk as a future media
library; they are not required for the theme to render. Prefer compressing
lifestyle JPGs before adding more ~2 MB files.

Next: [Chapter 04 — Homepage build](04-homepage-build.md)
