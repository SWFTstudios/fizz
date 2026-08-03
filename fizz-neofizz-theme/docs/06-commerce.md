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
| `desktop_layout` | side / stack |
| `mobile_media_ratio` | 4:5, 1:1, 3:4, auto |
| `stage_mode` | surface / colorway gradient / dark |

Pointer swipe (~48px threshold) advances slides in slider mode. Variant
swatches update featured media + URL `?variant=`.

### Colorway swatches

When enabled, each variant renders a swatch using scene / swatch metafields
or the Liquid slug palette. Selecting a swatch:

- Sets the hidden variant `id` input  
- Updates price / availability  
- Syncs stage CSS variables  
- Updates history with `variant` query param  

## Related products

`nf-related` accepts `media_fit` and `media_ratio`. Cards use
`snippets/nf-product-card.liquid` with `nf-card--fit-*` modifiers.

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
