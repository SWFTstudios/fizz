# Chapter 07 — Colorways & metafields

## Two color systems (do not confuse them)

| System | Controls | Used by |
| --- | --- | --- |
| **Theme style / preset** | Theme settings → Colorway | Global paper/ink/accent chrome |
| **Bottle scene** | Variant title slug + metafields | Colorways carousel + PDP stage |

## Preset resolution

`settings.colorway_preset` → `j14-colorway-preset-data` → CSS variables in
`j14-theme-tokens`. Custom pickers override when
`colorway_custom_enabled` is true.

## Warp metafield definitions

Bootstrap script: [`scripts/setup-warp-metafields.sh`](../scripts/setup-warp-metafields.sh)

| Key | Type | Owners |
| --- | --- | --- |
| `custom.warp_media` | file_reference | Product, ProductVariant |
| `custom.scene_bg` | color | Product, ProductVariant |
| `custom.scene_bg_end` | color | Product, ProductVariant |
| `custom.scene_btn` | color | Product, ProductVariant |
| `custom.scene_text` | color | Product, ProductVariant |
| `custom.swatch_hex` | single_line_text_field | Product, ProductVariant |

Storefront access is set to **PUBLIC_READ** so Liquid can read them.

### Tutorial: run the script

```sh
cd fizz-july-14th-theme
./scripts/setup-warp-metafields.sh
# or STORE=your-store.myshopify.com ./scripts/setup-warp-metafields.sh
```

Requires Shopify CLI auth with product write scopes. Re-running is safe.

### Tutorial: fill a variant

1. Admin → Products → bottle product → variant (e.g. Electric Blue).  
2. Metafields → set **Warp media** to a lifestyle image or video.  
3. Set scene colors / swatch hex to match brand.  
4. Save → hard refresh homepage colorways.  

## Media priority on a colorway slide

1. `variant.metafields.custom.warp_media`  
2. `product.metafields.custom.warp_media`  
3. Section/block image override (if present)  
4. `variant.featured_image`  
5. Theme demo asset  

## Liquid slug fallback

Without metafields, `j14-color-slug` derives a handle from the variant title
and `j14-colorway-scene` returns a baked gradient. That is intentional —
Liquid cannot load an external JSON palette at runtime.

## Editor vs storefront

- Metafield values are read at Liquid render time into `data-*` / inline
  styles.  
- Active-slide scene sync is client-side in `j14-carousel.js`.  
- Changing Theme style re-renders tokens on save; carousel slides keep their
  per-variant scene data.

## Known gap

Section setting `scroll_height_per_colorway` and `data-j14-colorway-scroll` are
present for a future pin-scroll enhancement; the current carousel is still
horizontal scroll-snap. Documented so merchants are not surprised if the
setting appears to do little.

Next: [Chapter 08 — Motion & accessibility](08-motion-accessibility.md)
