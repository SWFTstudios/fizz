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

## Bubble animation

Ambient rising bubbles appear in **hero**, **how it works**, **footer**, and **PDP stage**. They are rendered with **HTML5 canvas** + `requestAnimationFrame` (inspired by [this canvas bubble tutorial](https://www.freecodecamp.org/news/how-to-create-animated-bubbles-with-html5-canvas-and-javascript/)). Page-transition bubbles use the same canvas style in `fizz-transition.js`, layered above the liquid wave overlay.

### Canvas engine

- Each `.bubf[data-bubbles]` container gets a `<canvas class="bubf-canvas">` inserted by `initBubbles` in `assets/fizz.js`
- Particles use `arc()` + `createRadialGradient` (specular highlight + tinted fill) like the CodePen reference
- Ambient rising only — no click-to-spawn
- A single shared animation loop drives all visible fields; `IntersectionObserver` pauses off-screen sections
- `ring` / `glass` / `bold` theme presets control stroke weight, gradient fill, and highlight intensity

### Quick start (Theme Editor)

1. Open **Online Store → Themes → Customize**
2. Go to **Theme settings → Bubble animation**
3. Recommended defaults:
   - **Style:** Glass
   - **Animation peak opacity:** 88%
   - **Bubble size:** 115%
   - **Hero & PDP alpha:** 45%
   - **Footer alpha:** 38% (footer was historically the faintest)

### Style presets

| Style | Look | When to use |
|-------|------|-------------|
| Ring | Canvas outline, minimal fill | Lightweight / subtle |
| Glass | Canvas radial-gradient spheres | Default — reads as real bubbles |
| Bold | Canvas bubbles, thicker stroke + stronger highlight | Dark heroes, marketing screenshots |

### Opacity troubleshooting

| Symptom | Fix |
|---------|-----|
| Bubbles invisible on dark background | Raise **Hero & PDP alpha** or **How it works alpha** |
| Bubbles too loud | Lower **Animation peak opacity** or switch style to **Ring** |
| Footer bubbles too faint | Raise **Footer alpha** (was 16% before this update) |
| No motion at all | Check OS **Reduce motion** setting and **Enable ambient bubbles** toggle |
| Light colorway (e.g. Arctic Light) | Raise all section alpha sliders or switch to **Bold** style |

### Per-section overrides (developers)

Edit the `.bubf` container in section Liquid files (`fizz-hero.liquid`, `fizz-how.liquid`, `fizz-footer.liquid`, `fizz-product.liquid`):

| Attribute | Default | Example |
|-----------|---------|---------|
| `data-bub-count` | 14 | `data-bub-count="20"` |
| `data-bub-rise` | 700 | Legacy attribute (canvas uses continuous rise speed) |
| `data-bub-seed` | 7 | `data-bub-seed="42"` (changes random layout) |
| `data-bub-color` | section CSS var | `data-bub-color="var(--hero-bubble-color)"` |
| `data-bub-peak` | inherits global | `data-bub-peak="0.95"` (per-section peak opacity) |
| `data-bub-style` | inherits global | `data-bub-style="bold"` (override ring/glass/bold) |

Density and size are also scaled globally by theme settings (`--bubble-count-scale`, `--bubble-size-scale`).

### CSS variable reference

Output by `snippets/fizz-theme-tokens.liquid` on `:root`:

| Variable | Theme setting | Purpose |
|----------|---------------|---------|
| `--bubble-peak-opacity` | Animation peak opacity | Max opacity during rise animation |
| `--bubble-size-scale` | Bubble size | Diameter multiplier |
| `--bubble-count-scale` | Bubble density | Count multiplier |
| `--hero-bubble-color` | Hero & PDP alpha | Bubble tint in hero + PDP |
| `--how-bubble-color` | How it works alpha | Bubble tint in how section |
| `--footer-bubble-color` | Footer alpha | Bubble tint in footer |

The `<html>` element also receives `bubble-style-glass` (or `ring` / `bold`), optional `bubble-wobble`, and `data-bubble-enabled`.

### Page transition bubbles

Rendered on a **canvas layer above the liquid waves** during internal link navigation (`assets/fizz-transition.js` / `fizz-claude-transition.js`). Uses the same glossy radial-gradient style as ambient bubbles.

```js
var BUB_PEAK = 0.98;       // animation peak opacity
var LEAVE_BURST = 48;      // bubbles on page leave (+ staggered second burst)
var ENTER_BURST = 40;      // bubbles on page enter (+ staggered second burst)
var BUB_STROKE = 'rgba(255,255,255,0.95)';
var BUB_FILL = 'rgba(210,248,255,0.9)';
```

Raise `BUB_PEAK` or burst counts for louder transitions. Links with `data-no-transition` skip the effect (homepage hash nav uses this).

## Preview

After push, use the preview URL from CLI output or:

`https://g9rykd-jt.myshopify.com/?preview_theme_id=YOUR_THEME_ID`

## Source

Built from the fidelity-fixed Claude integration in `fizz/` and reference files in `~/Downloads/shopify 2`.
