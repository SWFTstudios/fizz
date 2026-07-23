# July 14th Custom Design — Shopify research report

Research performed against shopify.dev before building the theme, per the
workspace rule on research-backed Shopify planning. This theme has its own
`design/` folder because the other themes in this repository must not be
modified.

## Questions answered

### 1. Can merchants add photos AND videos to homepage sections from the theme editor?

Yes. Verified in the input settings reference
(https://shopify.dev/docs/storefronts/themes/architecture/settings/input-settings):

- `image_picker` — image from Files, supports focal point.
- `video` — picker for Shopify-hosted videos uploaded to Files; returns a
  `video` object usable with `video_tag`. **Does not support a `default`
  value**, so sections must render a fallback (this theme falls back to a
  theme-asset filename, then a `placeholder_svg_tag`).
- `video_url` — YouTube/Vimeo URL field with an `accept` array; returns
  `.id` and `.type` for building an embed.

Consequence adopted in this theme: every media block (`j14-intro`,
`j14-mosaic`, `j14-how-sticky`, `j14-flavors`, `j14-about`) exposes all three
inputs plus a theme-asset fallback text field, with priority
video → external video → image → asset → placeholder
(implemented in `snippets/j14-media.liquid`).

### 2. Section/block limits

Verified in the section schema reference
(https://shopify.dev/docs/storefronts/themes/architecture/sections/section-schema):

- Max **50 blocks per section**; `max_blocks` can lower this. The mosaic is
  capped at 24 tiles, intro at 8 slides, how-to at 6 steps.
- `presets` make sections addable from the editor's "Add section" picker;
  every non-main-template section in this theme ships a preset with sensible
  default blocks.
- `enabled_on` / `disabled_on` restrict where sections can be added; used so
  e.g. `j14-intro` only appears on the home template and `j14-product` only
  on product templates.
- `limit: 1` is applied to the intro and how-to sections (only one scroll
  narrative per page).

### 3. Theme presets and JSON parsing (carried over from prior research)

- `settings_data.json` supports at most **5 theme presets / Theme styles**
  (source: Shopify docs + prior colorway research). This theme ships **5**:
  Lime Fizz, Steel Navy, Citrus Burst, Berry Night, Electric Pool.
- Storefront colors resolve from `settings.colorway_preset` via
  `snippets/j14-colorway-preset-data.liquid` → `j14-theme-tokens.liquid`.
  Merchants can enable **Use custom colors** to override with pickers
  (`visible_if`). Theme style dropdown values mirror the same tokens so
  editor pickers match the live palette when switching styles.
- **Liquid cannot parse JSON files at runtime**, so bottle/scene colorway
  data remains mirrored as Liquid case statements in
  `snippets/j14-colorway-scene.liquid`, with per-variant metafield
  overrides (`custom.color_slug`, `custom.swatch_hex`, `custom.scene_bg`,
  `custom.scene_bg_end`, `custom.scene_btn`, `custom.scene_text`).

### 4. Storefront runtime vs theme editor behavior

- Scroll-driven effects (intro expansion, mosaic slide-up, sticky how-to)
  are storefront runtime JS (`assets/j14-scroll.js`). The theme editor does
  not scroll-drive the preview, so the engine also listens for
  `shopify:section:load`, `shopify:section:unload`, and
  `shopify:block:select` to re-initialize and to jump to the selected
  slide/step when a merchant clicks a block in the editor sidebar.
- Section settings are read at render time in Liquid; visual color syncing
  of the colorways carousel happens client-side from data attributes
  produced by Liquid.

## Limitations (documented, with sources)

| Limitation | Source | Mitigation in this theme |
| --- | --- | --- |
| `video` setting has no `default` | input-settings reference (see URL above) | Theme-asset fallback + `placeholder_svg_tag` |
| Autoplay requires muted video | Browser autoplay policies (Chrome/Safari) | `video_tag` rendered with `muted`, `playsinline`, `loop` |
| Max 50 blocks/section | section-schema reference | `max_blocks` set per section |
| Max 5 theme presets | settings_data docs / prior colorway research | 5 Theme styles shipped |
| No JSON parse in Liquid | Liquid docs / prior colorway research | Palette mirrored in Liquid snippet |
| CSS scroll-driven animations not cross-browser | caniuse (animation-timeline) | rAF + IntersectionObserver JS engine; `prefers-reduced-motion` gets a static layout |

### 5. Product and collection templates (commerce)

Verified against Online Store 2.0 architecture
(https://shopify.dev/docs/storefronts/themes/architecture):

- Product/collection templates are JSON templates that compose sections
  (`templates/product.json`, `templates/collection.json`).
- Variant selection and carts use the standard `{% form 'product' %}` and
  `{% form 'product', product %}` (quick add) patterns; money formatting and
  availability come from Liquid product/variant objects.
- Colorway-aware PDP stage gradients reuse
  `snippets/j14-colorway-scene.liquid` (variant/bottle palette). Global
  Theme style / colorway presets still flow through
  `snippets/j14-theme-tokens.liquid` (`--j14-paper`, `--j14-ink`,
  `--j14-accent`, `--j14-surface`, `--j14-dark`, fonts, radii) so switching
  Theme style restyles product + collection chrome without a separate
  template per preset.
- Collection pagination uses `{% paginate collection.products %}`.

Storefront vs editor: swatch → stage gradient sync is client-side JS on
the product section; Theme style token changes re-render via Liquid on
save / style switch.

## Reference implementation notes

- Structure mirrors a standalone OS 2.0 theme layout (`layout/`, `config/`,
  `locales/`, `sections/`, `snippets/`, `templates/`, `assets/`, `design/`).
- Colorway slug/scene logic was adapted (copied and renamed with the `j14-`
  prefix) from earlier Fizz Claude snippets into this package.

## 6. Intro mask fly-through (load-only GSAP)

Later iterations replaced scroll-scrubbed intro with a **one-shot page-load**
GSAP timeline. Current architecture (storefront runtime):

1. Full-bleed hero media stage in a normal `100svh` section (no multi-vh sticky track).
2. Paper fill layer using `background: var(--j14-intro-mask-fill, var(--j14-paper))`
   (optional section `mask_color` overrides Theme style paper for the cutout only).
3. CSS `mask-image` pointing at `Fizz_Logo_Intro.svg` (desktop) or
   `Fizz_Logo_INTRO_SVG_Mobile.svg` (max-width 749px).
4. `mask-mode: alpha` so transparent letter cutouts reveal the hero.
5. On load, GSAP scales the mask from a measured I-stem `transform-origin`,
   fades it, then permanently tears it down (`display: none`, scale reset).
6. Hero copy fades in; visitor is already on the hero — normal page scroll follows.
7. User interrupt jumps to the completed state. Theme editor and reduced motion
   show the static completed hero (no animation).

Hardcoded stem metrics live in `assets/j14-intro.js` and matching CSS origins.
Mobile uses viewBox `1926×3128`. See `docs/05-intro-flythrough.md`.

Isolated lab (not deployed; listed in `.shopifyignore`):
`preview/intro-mask-flythrough.html`.

Section `color` settings for `mask_color` follow standard Online Store 2.0
section schema: https://shopify.dev/docs/storefronts/themes/architecture/settings/input-settings#color

### CLI tooling notes (verified against shopify.dev)

- Theme directory structure and `.shopifyignore`:
  https://shopify.dev/docs/storefronts/themes/tools/cli
- Theme Check: https://shopify.dev/docs/storefronts/themes/tools/theme-check
- `theme push` flags / live overwrite:
  https://shopify.dev/docs/api/shopify-cli/theme/theme-push

**Operational limitation:** `shopify theme dev` may fail when the CLI identity
lacks `read_themes` / development-theme creation scopes. Production workflow
for this store uses Theme Check + isolated preview + explicit
`theme push --theme 188630794525 --allow-live`.

## Limitations (additions)

| Limitation | Source | Mitigation |
| --- | --- | --- |
| CSS mask RGB ≠ brand paper | Asset export | Paper from `--j14-intro-mask-fill` / `--j14-paper`; alpha mask only |
| Bitmap mask pixelates at extreme CSS scale | PNG-in-SVG + ~40× transform | Load-only timeline + permanent `display: none` teardown after fade |
| Mask origin not measurable in Liquid | Liquid runtime | Hardcoded % after offline analysis |
| Case-sensitive asset URLs | Shopify CDN | Canonical filenames; avoid macOS case collisions |
| Max 5 Theme styles | settings_data | Five presets shipped; no sixth |
| No JSON parse in Liquid | Liquid docs | Slug/scene maps mirrored in snippets |
