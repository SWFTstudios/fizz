# Global section padding — research

Date: 2026-08-12  
Theme: Ballena Fizz (`fizz-ballena-theme/`)  
Updated: 2026-08-12 — desktop/mobile on both axes + per-section overrides

## Problem

BF Flavors (and other sections using `.bf-section__inner`) were capped at `min(1120px, 100%)`, while BF About Carousel used a full-width wrap inside section side padding. Content widths did not match. Feature Tabs forced `padding: 0`, so chrome spacing/type settings in the Theme Editor did not affect the storefront. Merchants also needed separate desktop vs mobile insets on **both** axes, with a per-section override toggle.

## Docs verified

| Topic | Source |
|-------|--------|
| `settings_schema.json` / Theme settings | https://shopify.dev/docs/storefronts/themes/architecture/config/settings-schema-json |
| Liquid `settings` object | https://shopify.dev/docs/api/liquid/objects/settings |
| `select` input (string values; supports `group`) | https://shopify.dev/docs/storefronts/themes/architecture/settings/input-settings |
| Section `visible_if` for conditional settings | https://shopify.dev/docs/storefronts/themes/architecture/settings |
| Max 5 theme presets; `settings_data.json` 1.5MB | https://shopify.dev/docs/storefronts/themes/architecture/config/settings-data-json |

## Approach

### Theme settings (Layout)

1. `horizontal_padding` / `horizontal_padding_mobile` — select CSS literals (`20px`, `2rem`, `5%`, `0`).
2. `section_padding_top` / `section_padding_bottom` — labeled **(desktop)**; range px.
3. `section_padding_top_mobile` / `section_padding_bottom_mobile` — range px (default 48).

### Tokens (`snippets/nf-theme-tokens.liquid`)

- `--bf-page-pad-x-desktop` / `--bf-page-pad-x-mobile` (non-zero uses `max(var(--nf-gutter), …)`; Full width `0` skips the floor)
- `--bf-page-pad-x` = mobile by default; at `min-width: 750px` switches to desktop
- `--bf-section-pad-top-desktop|mobile` / `--bf-section-pad-bottom-desktop|mobile`
- `--bf-section-pad-top` / `--bf-section-pad-bottom` switch at 750px

### Per-section (`snippets/bf-section-padding.liquid`)

- Checkbox `use_theme_spacing` (label **Use global padding**, default true on content sections).
- When on: `--bf-pad-top/bottom/x` follow theme vars.
- When off (`visible_if`): unique `padding_top` / `padding_bottom` (desktop), `padding_top_mobile` / `padding_bottom_mobile`, `padding_x` / `padding_x_mobile`.
- Chrome sections render via `bf-section-chrome` → padding snippet.
- `.bf-section` uses `padding-block` / `padding-inline` from `--bf-pad-*`.
- `.nf-container` uses `padding-inline: var(--bf-pad-x, var(--bf-page-pad-x))`.

### Full-bleed exceptions

| Section | Default |
|---------|---------|
| `bf-hero`, `bf-feature-tabs`, `nf-intro`, `nf-water-wave`, `fizz-key-features` | `use_theme_spacing: false`, pads 0 |
| `nf-marquee` | `use_theme_spacing: false` (keeps rem-based pads until merchant opts into global) |
| `bf-header` | horizontal only (`horizontal_only: true`) |

## Limitations

- Liquid cannot parse CSS units; select strings are emitted verbatim.
- Section schema defaults cannot reference theme settings — “follow global” needs `use_theme_spacing` + Liquid.
- Do not add theme presets for these settings (5-preset hard limit).
- Content-safe push: do not overwrite remote `settings_data.json` / templates unless asked.
- Intentionally full-bleed sections stay edge-to-edge until the merchant turns on global padding or sets overrides.
