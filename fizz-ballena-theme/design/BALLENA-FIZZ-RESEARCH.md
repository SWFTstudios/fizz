# Ballena Fizz — Shopify research notes

Inspiration: [ballenacabo.com](https://ballenacabo.com/)  
Theme: Ballena Fizz (`fizz-ballena-theme/`)  
Branch: `feature/ballena-fizz`

## Docs verified

| Topic | Source |
|-------|--------|
| Section schema / settings | https://shopify.dev/docs/storefronts/themes/architecture/sections/section-schema |
| Input settings (`image_picker`, `video`, `video_url`, `color`, `range`, `font_picker`) | https://shopify.dev/docs/storefronts/themes/architecture/settings/input-settings |
| Theme presets max 5; `settings_data.json` 1.5MB | https://shopify.dev/docs/storefronts/themes/architecture/config/settings-data-json |
| Theme file size limits | https://shopify.dev/docs/storefronts/themes/architecture/limits |

## Ballena navigation (observed)

Floating centered pill header:

- Fixed, top inset, max-width ~45em, backdrop blur, rounded corners
- Left CTA (“BOOK NOW” → Ballena Fizz: **SHOP NOW** → Shop all)
- Center logo (light/dark swap when menu open)
- Right hamburger → X; menu expands as a panel **under** the pill (not a full-screen drawer)
- Stack: GSAP + ScrollTrigger + Lenis for floaty scroll

Recreated in `sections/bf-header.liquid` — do not copy Ballena proprietary assets.

## Glassmorphic BF Header (2026-08-06)

Verified against Shopify docs for dual-logo + admin color glass bar:

| Topic | Source |
|-------|--------|
| `image_picker` (light/dark logos; no schema `default`; use `image_url` + `image_tag`) | https://shopify.dev/docs/storefronts/themes/architecture/settings/input-settings |
| `color` / `range` for bar fill, opacity, blur | https://shopify.dev/docs/storefronts/themes/architecture/settings/input-settings |
| `color_modify` alpha for frosted fill | https://shopify.dev/docs/api/liquid/filters/color-filters |
| Section schema for header settings | https://shopify.dev/docs/storefronts/themes/architecture/sections/section-schema |

**Storefront behavior (CSS, not a Shopify setting type):** closed bar uses admin color + opacity + `backdrop-filter` (blur + saturate) + light border; open menu uses solid admin `open_background` with blur disabled and dark logo.

**Limitations:** `backdrop-filter` unsupported browsers fall back to tinted fill; logos must be uploaded in Theme Editor (`image_picker` cannot ship defaults).

## Shared section chrome

Liquid **cannot** include `{% schema %}` from snippets. Pattern:

1. `snippets/bf-section-chrome.liquid` — CSS vars + background layers
2. `assets/bf-section-chrome.css` — layout for chrome layers
3. Duplicate the canonical settings JSON (see `design/BF-SECTION-CHROME-SCHEMA.json`) into each Ballena content section

## Global horizontal padding (2026-08-06)

See [`design/GLOBAL-HORIZONTAL-PADDING.md`](GLOBAL-HORIZONTAL-PADDING.md).

| Topic | Source |
|-------|--------|
| Theme settings / `settings_schema.json` | https://shopify.dev/docs/storefronts/themes/architecture/config/settings-schema-json |
| `select` string values + `group` | https://shopify.dev/docs/storefronts/themes/architecture/settings/input-settings |
| Liquid `settings` | https://shopify.dev/docs/api/liquid/objects/settings |

**Storefront:** `--bf-page-pad-x` from Theme settings → Layout → Horizontal padding. BF sections use it for `padding-inline`; content max-width follows `--nf-page-width`. Full-bleed sections (Feature Tabs) override in CSS.

## Limitations

- Schema settings cannot be shared via `{% render %}`
- Shopify-hosted `video` preferred for muted autoplay backgrounds; `video_url` embeds are secondary
- Max **5** native theme presets
- Content-safe pushes: never overwrite remote `settings_data.json` / templates unless asked
- Liquid cannot parse CSS units — horizontal padding select emits unit strings into CSS vars
