# Global image corner radius

**Date:** 2026-08-14  
**Theme:** Ballena Fizz (`fizz-ballena-theme/`)

## Theme setting

**Theme settings → Images → Image corner radius** (`image_corner_radius`)

- Range: 0–48px  
- Default: **8px**

## CSS token

`snippets/nf-theme-tokens.liquid` outputs:

```css
--nf-image-radius: 8px; /* merchant value */
--nf-pdp-card-radius: var(--nf-image-radius);
```

## Application

- Global: `img`, `video`, `iframe`, `model-viewer` in `nf-base.css`
- Product cards, cart thumbs, PDP gallery/thumbs, homepage BF/NF media frames use `var(--nf-image-radius, 8px)`
- UI chrome (pills, swatches, dots, buttons) keeps fixed radii — not controlled by this setting
- Section shells (`--nf-radius-lg` / `--nf-radius-xl`) stay 32px / 48px for non-image panels

## Storefront vs editor

- Merchant adjusts slider in Theme settings; save applies site-wide without template push.
- Adding the setting to `settings_schema.json` does not reset existing `settings_data.json`.
