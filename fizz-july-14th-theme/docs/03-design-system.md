# Chapter 03 — Design system

## Tokens

Rendered by [`snippets/j14-theme-tokens.liquid`](../snippets/j14-theme-tokens.liquid)
from Theme settings / presets:

| Token | Role |
| --- | --- |
| `--j14-paper` | Page background (intro mask fill) |
| `--j14-ink` | Primary text |
| `--j14-accent` | Buttons, active states |
| `--j14-surface` | Cards / panels |
| `--j14-dark` / `--j14-dark-text` | Dark bands |
| `--j14-font-heading` / `--j14-font-body` | Typography |
| `--j14-gutter` / `--j14-page-width` | Layout |
| `--j14-radius` | Buttons |

Paper for the live Lime Fizz / ice palette is typically `#e8edf5` — the intro
mask fill **must** use `var(--j14-paper)` so Theme style switches stay coherent.

## Five Theme styles (hard limit)

Shopify allows at most **five** presets in `settings_data.json`. This theme
ships exactly five:

1. Lime Fizz  
2. Steel Navy  
3. Citrus Burst  
4. Berry Night  
5. Electric Pool  

Preset hex maps live in
[`snippets/j14-colorway-preset-data.liquid`](../snippets/j14-colorway-preset-data.liquid).
Merchants can enable **Use custom colors** to override with pickers
(`visible_if`).

## Bottle / scene colorways

Per-variant scene gradients (carousel + PDP stage) resolve through:

1. Variant metafields (`custom.scene_*`, `custom.swatch_hex`, …)  
2. Else Liquid slug map in `snippets/j14-colorway-scene.liquid`  
3. Else theme defaults  

Slug detection: `snippets/j14-color-slug.liquid`.

Because Liquid cannot load a JSON color database at runtime, the slug map is
mirrored in Liquid case statements. See research report and
[Chapter 07](07-colorways-metafields.md).

## Typography

- Heading: `font_picker` (default Anton)
- Body: `font_picker` (default Work Sans)
- Optional uppercase headings via Theme settings

## Spacing & layout

- Mobile-first gutters (`--j14-gutter`)
- Max page width range setting
- Sticky header with configurable blur / gradient

## Asset strategy

| Kind | Convention | Example |
| --- | --- | --- |
| Intro masks | Exact filenames in Liquid | `Fizz_Logo_Intro.svg` |
| Lifestyle photos | kebab descriptive | `flavor-lifestyle-mixed-berry.jpg` |
| Scripts | `j14-*.js` | `j14-intro.js` |
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
