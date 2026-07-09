# Fizz Claude — Standalone Shopify Theme

Self-contained Shopify Online Store 2.0 theme with the Claude Fizz design (homepage + product PDP). Import this folder as a **new theme** — no Stone Sip templates or suffix switching required.

## Import options

### Option A — Shopify CLI (recommended)

```bash
cd fizz-claude-theme
shopify theme push --store g9rykd-jt.myshopify.com --unpublished
```

Or push to a named theme:

```bash
shopify theme push --store g9rykd-jt.myshopify.com --theme "Fizz Claude" --unpublished
```

### Option B — Admin ZIP upload

```bash
cd "/Users/elombe.kisala/CURSOR PROJECT BUILDS/SHOPIFY"
zip -r fizz-claude-theme.zip fizz-claude-theme -x "*.DS_Store"
```

Then **Online Store → Themes → Add theme → Upload zip file**.

## After import

1. **Theme settings → Brand colors:** accent `#c6f24e`, ink `#080a0d`, paper `#f2efe7`
2. **Theme settings → Products:** link the bottle product (nav CTA + colorways fallback)
3. **Colorways section:** link bottle product; variants drive swatches (`custom.swatch_hex` metafield optional)
4. **Flavor strip:** link flavor products + splash images per block
5. **Product section add-ons:** set numeric variant IDs for CO₂ pack / sampler upsells
6. Publish when ready

## Structure

| Path | Purpose |
|------|---------|
| `layout/theme.liquid` | Fonts, CSS vars, nav snippet, grain, JS |
| `snippets/fizz-nav.liquid` | Fixed nav with design links + Shop CTA |
| `sections/fizz-*.liquid` | Hero, statement, how, colorways, flavors, footer, product |
| `templates/index.json` | Homepage (default) |
| `templates/product.json` | Bottle PDP |
| `assets/fizz-base.css` | All styles + PDP + wrapper resets |
| `assets/fizz.js` | Motion, swatches, PDP addons/cart |
| `assets/fizz-transition.js` | Bubble page transitions |

## Preview

After push, use the preview URL from CLI output or:

`https://g9rykd-jt.myshopify.com/?preview_theme_id=YOUR_THEME_ID`

## Source

Built from the fidelity-fixed Claude integration in `fizz/` and reference files in `~/Downloads/shopify 2`.
