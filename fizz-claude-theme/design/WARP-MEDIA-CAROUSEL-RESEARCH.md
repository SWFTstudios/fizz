# Warp media product carousel — Shopify research record

Research backing the July 14th theme's `j14-warp-colorways` upgrade from a
variant-only colorway rail to a general product media carousel
(image/video panels, three product sources). Verified against shopify.dev,
July 2026.

## Section setting types (sources)

| Setting type | Returns | Notes |
| --- | --- | --- |
| `product` | product object | existing "Bottle product" picker (variants mode) |
| `collection` | collection object | loop `collection.products` (cap at 12 with `limit:`) |
| `product_list` | array of products | supports `"limit": 12` in schema |

Source: https://shopify.dev/docs/storefronts/themes/architecture/settings/input-settings

## Media metafields (`file_reference`)

- A `file_reference` metafield holds an image (`jpg/png/gif/heic/webp`),
  a video (`mp4/mov`), or a generic file.
- Access the underlying object via `.value`; check `.value.media_type`
  (`'video'` vs `'image'`) to branch rendering.
- Render videos with `video_tag` (`loop: true, muted: true, controls:
  false, preload: 'metadata'`); render images with `image_url | image_tag`.
- `metafield_tag` also works but gives less control over attributes.
- Metafields exist on **both products and variants**, so variants mode and
  product modes each read their own `custom.warp_media`.

Sources:
- https://shopify.dev/docs/api/liquid/filters/metafield_tag
- https://shopify.dev/docs/api/liquid/objects/video

## Native product video

`product.featured_media.media_type == 'video'` detects a video first media;
render with `video_tag`. Filtering all media:
`product.media | where: 'media_type', 'video'`.

## Known platform limitations

- Liquid cannot index into reference-**list** metafields directly
  (`list.file_reference`, `product_list` metafields). Workarounds:
  `.value | compact` or `.value | reverse | reverse`, or plain `for` loops.
  The warp carousel only uses single `file_reference` fields, avoiding this.
  Source: https://community.shopify.com/t/access-product-list-metafields-by-index-not-working/188022
- The `video_url` setting type is YouTube/Vimeo embed only — unsuitable for
  a drag carousel (iframe steals pointer events); excluded by design.
- Metafield definitions must be created in Admin > Settings > Custom data
  (Products and Variants) before merchants can set values. Keys used:

| Metafield (namespace `custom`) | Type | Used for |
| --- | --- | --- |
| `warp_media` | `file_reference` | slide media (image or video), products + variants |
| `scene_bg`, `scene_bg_end`, `scene_btn`, `scene_text` | color/text | background sync scene, products + variants |
| `swatch_hex` | text | dot + panel color |

## Slide media resolution order (implemented)

1. `custom.warp_media` metafield (video or image)
2. Colorway block override image (variants mode only)
3. Native media: `variant.featured_image` / `product.featured_media`
   (video-aware for products)
4. Fallback: colorway gradient panel (+ bottle PNG in variants/demo modes)
