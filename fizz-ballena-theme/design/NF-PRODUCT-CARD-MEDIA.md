# NF product card media — cover + aspect ratio

**Date:** 2026-08-14  
**Theme:** Ballena Fizz (`fizz-ballena-theme/`)

## Sections

| Section | Fit setting | Ratio setting | Renders |
| --- | --- | --- | --- |
| `nf-collection` | `card_media_fit` (default cover) | `card_media_ratio` (default 4:5) | `nf-product-card` |
| `nf-related` | `media_fit` (default cover) | `media_ratio` (default 4:5) | `nf-product-card` |
| `nf-product` | — | `thumb_media_ratio` (default 1:1) | Gallery thumbnail buttons |

## Cover vs contain

- **Cover:** image fills the card frame with `object-fit: cover; object-position: center`. Color wash is subdued.
- **Contain:** packshot layout with min-height and bottom-aligned bottle PNGs. Use **Natural** ratio.

## Liquid guard

When fit is `cover` and ratio is `auto`, Liquid falls back to `4 / 5` so cover always has a fixed frame (existing merchant `auto` values on live collection instances).

## Limitations

- Search grid uses snippet defaults (cover + 4:5) — no section settings yet.
- NeoFizz twin not updated in this pass.
