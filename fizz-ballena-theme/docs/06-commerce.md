# Chapter 06 — Commerce

## Product template

[`templates/product.json`](../templates/product.json) composes:

1. `nf-product` — gallery + buy box  
2. `nf-related` — recommendations  

Footer is global via `sections/footer-group.json` (not in the product template).

### Gallery modes

Section settings on `nf-product`:

| Setting | Options |
| --- | --- |
| `gallery_mode` | `slider` (swipe) / `fade` |
| `media_fit` | `cover` / `contain` |
| `show_thumbnails` | desktop thumbs |
| `thumbnails_on_mobile` | thumbs vs dots on small screens |
| `show_arrows` | prev / next |
| `enable_lightbox` | click-to-zoom grouped dialog (images only) |
| `dark_surface` | dark `--nf-dark` section background (Ballena PDP) |
| `desktop_layout` | side / stack |
| `mobile_media_ratio` | 4:5, 1:1, 3:4, auto |
| `thumb_media_ratio` | 1:1, 4:5, 3:4, 4:3 (small centered thumbs under the stage) |
| `stage_mode` | surface / colorway gradient / dark |

On desktop **side** layout the gallery is `position: sticky` and fills
remaining viewport height (`100dvh` minus `--nf-nav-top` and a 16px inset).
Thumbnails stay a small centered row under the stage. The buy box scrolls.
Mobile stays stacked (no sticky, no forced `dvh`) so Add to cart stays
reachable.

### Description accordions

`product.description` renders as the first `<details open>` row when
`show_description` is on. Extra **Accordion** blocks sit below, closed.
Merchants connect product metafields to Accordion → Body via Theme Editor
[dynamic sources](https://shopify.dev/docs/storefronts/themes/architecture/settings/dynamic-sources).
Theme `richtext` cannot embed images — Accordion blocks have an optional
`image` picker (also connectable to a `file_reference` metafield). Images
in `product.description` (from the product admin editor) render in the
first accordion. Do not push `templates/product.json` to bind metafields.

Pointer swipe (~48px threshold) advances slides in slider mode. Keyboard
arrows work when the stage is focused. Click/tap an image (without dragging)
opens a native `<dialog>` lightbox grouped by product — prev/next syncs with
the in-page slider. Videos and 3D models stay in the slider only (Shopify UX).
Variant swatches update featured media + URL `?variant=`.

Gallery JS lives in [`assets/nf-product.js`](../assets/nf-product.js).
Research: [`design/NF-PRODUCT-GALLERY-LIGHTBOX.md`](../design/NF-PRODUCT-GALLERY-LIGHTBOX.md).
**Ballena-only** in this pass — NeoFizz twin not updated.

### Colorway swatches

When enabled, each variant renders a swatch using scene / swatch metafields
or the Liquid slug palette. Selecting a swatch:

- Sets the hidden variant `id` input  
- Updates price / availability  
- Syncs stage CSS variables  
- Updates history with `variant` query param  

## Related products

`nf-related` accepts `media_fit` (cover/contain) and `media_ratio` (4:5, 1:1,
3:4, 16:10, auto). Cards use [`snippets/nf-product-card.liquid`](../snippets/nf-product-card.liquid)
with `nf-card--fit-*` modifiers — images use `object-fit: cover` and
`object-position: center` in cover mode.

## Collection product cards

[`sections/nf-collection.liquid`](../sections/nf-collection.liquid) settings:

| Setting | Default |
| --- | --- |
| `card_media_fit` | cover |
| `card_media_ratio` | 4:5 |

When fit is cover and ratio is Natural/auto, Liquid falls back to 4:5.
Research: [`design/NF-PRODUCT-CARD-MEDIA.md`](../design/NF-PRODUCT-CARD-MEDIA.md).

## Collection / cart / search

JSON templates compose dedicated `nf-*` sections. Collection grids paginate
with `{% paginate collection.products %}`. Cart uses the standard Shopify cart
form patterns.

## Header

[`sections/nf-header.liquid`](../sections/nf-header.liquid) (via
`sections/header-group.json`):

- Transparent-on-home option with scroll solidification  
- Configurable gradient, opacity, backdrop blur  
- Mobile menu can match bar styles or use independent styles  
- Full-viewport mobile nav (avoids collapsed height under `backdrop-filter`)

Nav anchors should match section `anchor_id` values (`colors`, `how`,
`flavors`, `about`, `sustainability`, …).

## Forms

- Product ATC: `{% form 'product', product %}`  
- Dynamic checkout optional via section setting  
- Quantity optional  

Money formatting uses Liquid `money` filters so shop currency settings apply.

Next: [Chapter 07 — Colorways & metafields](07-colorways-metafields.md)
