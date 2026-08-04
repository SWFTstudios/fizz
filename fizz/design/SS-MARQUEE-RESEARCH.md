# SS Marquee — Shopify research notes

Date: 2026-08-03  
Section: `sections/fizz-ss-marquee.liquid`

## Research

| Topic | Finding | Source |
| --- | --- | --- |
| Section fonts | `font_picker` returns a [`font`](https://shopify.dev/docs/api/liquid/objects/font) object. Apply via CSS (`family`, `fallback_families`, `weight`, `style`) and load with `font_face`. | [Liquid font object](https://shopify.dev/docs/api/liquid/objects/font) |
| Font variants | Use [`font_modify`](https://shopify.dev/docs/api/liquid/filters/font_modify) when bold/italic variants are needed. Marquee uses the picked weight/style as-is. | [font_modify](https://shopify.dev/docs/api/liquid/filters/font_modify) |
| Logos | Block `image_picker` + `image_url` / `image_tag` (theme-supported). Height driven by section CSS var `--ss-marquee-logo-h`. | Theme Liquid image filters |
| Full width | Theme spacing snippet `padding_horizontal: full` emits `data-fizz-section-full-width`; storefront gutters zeroed in `fizz-spacing.css`. Label stays in `.ss-container`; ticker is edge-to-edge. | Theme: `snippets/fizz-section-spacing.liquid` |

## Limitations

1. **Fill-to-viewport loop is JS-only.** Liquid cannot measure viewport width or clone items until the track fills the screen. `assets/fizz-ss-motion.js` clones the original set until `track.scrollWidth >= root.clientWidth`, then doubles that segment for seamless GSAP `xPercent: -50`.
2. **`font_picker` is Shopify font library only** — not arbitrary uploaded webfonts.
3. **Seamless animation requires an exact 2× segment.** Fill clones must run before the final double; otherwise the loop shows a jump or gap.
4. **Editor vs storefront.** Schema settings control the theme editor UI; `{% style %}` + CSS vars apply on the storefront. Section reload / resize re-inits the marquee so clones stay correct.
