# NF Marquee — Shopify research notes

Date: 2026-08-04  
Theme: `fizz-neofizz-theme`  
Section: `sections/nf-marquee.liquid`

## Research

| Topic | Finding | Source |
| --- | --- | --- |
| Section fonts | `font_picker` returns a [`font`](https://shopify.dev/docs/api/liquid/objects/font) object. Apply via CSS (`family`, `fallback_families`, `weight`, `style`) and load with `font_face`. | [Liquid font object](https://shopify.dev/docs/api/liquid/objects/font) |
| Font variants | Use [`font_modify`](https://shopify.dev/docs/api/liquid/filters/font_modify) when bold/italic variants are needed. Marquee uses the picked weight/style as-is. | [font_modify](https://shopify.dev/docs/api/liquid/filters/font_modify) |
| Logos | Separate **Image** block (`image_picker` + `alt`), not paired on Word. Height via `--nf-marquee-logo-h` / section `logo_height`. | Theme Liquid image filters |
| Full width | `.nf-marquee-section` / `.nf-marquee` use `width: 100%`, `max-width: none`, no horizontal padding. | Storefront CSS |
| Multi-unit padding | Shopify `range` is integer-only; schema `unit` is a label. Use a unit `select` (`px`/`rem`/`char`/`vh`) + ranges, compose in Liquid as `value + unit`. | [Input settings](https://shopify.dev/docs/storefronts/themes/architecture/settings/input-settings) |
| Colors | `text_color`, `background_color`, `separator_color` (glyph). Blank → theme tokens. | Section schema |

## Limitations

1. **Fill-to-viewport loop is JS-only.** Liquid cannot measure viewport width. `assets/nf-motion.js` clones originals until `track.scrollWidth >= root.clientWidth`, then doubles the segment for seamless CSS `translateX(-50%)`.
2. **`font_picker` is Shopify font library only** — not NeoFizz’s Helvetica Neue LT Std files unless that face is in Shopify’s library.
3. **Seamless CSS animation requires an exact 2× segment.** Fill clones must run before the final double.
4. **Editor vs storefront.** Schema drives the theme editor; `{% style %}` + CSS vars apply on the storefront. Section reload / resize re-inits clones.
5. **Padding ranges are integers (0–100).** Fractional rem (e.g. `1.5`) is not available; use whole units. Prefer smaller numbers for `vh` / `rem` / `char`.
6. **Word vs Image blocks are separate types.** Logos previously on Word blocks are not auto-migrated; re-add as **Image** blocks and reorder in the editor.
