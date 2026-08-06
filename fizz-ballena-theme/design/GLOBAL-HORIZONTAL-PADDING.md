# Global horizontal padding — research

Date: 2026-08-06  
Theme: Ballena Fizz (`fizz-ballena-theme/`)

## Problem

BF Flavors (and other sections using `.bf-section__inner`) were capped at `min(1120px, 100%)`, while BF About Carousel used a full-width wrap inside section side padding. Content widths did not match.

## Docs verified

| Topic | Source |
|-------|--------|
| `settings_schema.json` / Theme settings | https://shopify.dev/docs/storefronts/themes/architecture/config/settings-schema-json |
| Liquid `settings` object | https://shopify.dev/docs/api/liquid/objects/settings |
| `select` input (string values; supports `group`) | https://shopify.dev/docs/storefronts/themes/architecture/settings/input-settings |
| Max 5 theme presets; `settings_data.json` 1.5MB | https://shopify.dev/docs/storefronts/themes/architecture/config/settings-data-json |

## Approach

1. Theme setting `horizontal_padding` (select) under Layout — values are CSS literals (`20px`, `2rem`, `5%`, `0`).
2. Emit `--bf-page-pad-x` from `snippets/nf-theme-tokens.liquid`. Non-zero values use `max(var(--nf-gutter), …)` so mobile never goes below Page gutter; Full width (`0`) skips the floor.
3. `.bf-section` uses `padding-inline: var(--bf-page-pad-x)`. `.bf-section__inner` / `.bf-about__wrap` use `max-width: var(--nf-page-width)`.
4. Per-section `padding_left` / `padding_right` removed from chrome schema UI; ignored for layout. Intentional full-bleed (BF Feature Tabs) keeps `padding: 0` in section CSS.

## Limitations

- Liquid cannot parse CSS units; select strings are emitted verbatim.
- Do not add theme presets for this setting (5-preset hard limit).
- Content-safe push: do not overwrite remote `settings_data.json` / templates unless asked.
