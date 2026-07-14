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
| `assets/fizz-page-transition.js` | Melt / classic page transitions |

## Bubble animation

Ambient rising bubbles appear in **hero**, **how it works**, **footer**, and **PDP stage**. They are rendered with **HTML5 canvas** + `requestAnimationFrame`. Research notes: [`design/BUBBLE-TRANSITION-RESEARCH.md`](design/BUBBLE-TRANSITION-RESEARCH.md).

### Canvas engine

- Each `.bubf[data-bubbles]` container gets a `<canvas class="bubf-canvas">` inserted by `initBubbles` in `assets/fizz.js`
- Modern glass draw: off-center specular, rim stroke, depth bands (micro / mid / large), optional contact shadow on large bubbles
- Ambient rising only — no click-to-spawn
- A single shared animation loop drives all visible fields; `IntersectionObserver` pauses off-screen sections
- Mobile throttles particle count; canvas DPR capped at 2
- `ring` / `glass` / `foam` / `bold` theme presets control look

### Quick start (Theme Editor)

1. Open **Online Store → Themes → Customize**
2. Go to **Theme settings → Bubble animation**
3. Recommended defaults:
   - **Style:** Glass
   - **Animation peak opacity:** 88%
   - **Bubble size:** 115%
   - **Hero & PDP alpha:** 45%
   - **Footer alpha:** 38%
   - **Transition style:** Melt

### Style presets

| Style | Look | When to use |
|-------|------|-------------|
| Ring | Canvas outline, minimal fill | Lightweight / subtle |
| Glass | Specular + rim + depth bands | Default — modern glass |
| Foam | Dense micro-fizz, softer fills | High-energy carbonation |
| Bold | Larger bubbles, thicker stroke + stronger highlight | Dark heroes, marketing screenshots |

### Opacity troubleshooting

| Symptom | Fix |
|---------|-----|
| Bubbles invisible on dark background | Raise **Hero & PDP alpha** or **How it works alpha** |
| Bubbles too loud | Lower **Animation peak opacity** or switch style to **Ring** |
| Footer bubbles too faint | Raise **Footer alpha** |
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
| `data-bub-style` | inherits global | Documented; style is global via `bubble-style-*` on `<html>` |

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

The `<html>` element also receives `bubble-style-glass` (or `ring` / `foam` / `bold`), optional `bubble-wobble`, `data-bubble-enabled`, and transition data attrs (`data-transition-style`, `data-transition-intensity`, `data-transition-duration-scale`).

### Page transitions

Internal navigation overlay in `assets/fizz-transition.js`:

| Style | Behavior |
|-------|----------|
| **Melt** (default) | Micro-bubbles rise and merge (SVG goo / metaball), flood with brand accent, navigate; enter fractures the solid field into rising bubbles |
| **Classic** | Original dual liquid-wave slabs + cyan burst canvas |

Colors pull from `--hero-accent` / `--hero-bg` / `--hero-text` (fallbacks: `--color-accent` / ink / paper). Intensity and duration are merchant-scalable. Links with `data-no-transition` skip the effect. `prefers-reduced-motion` navigates instantly.
## Preview

After push, use the preview URL from CLI output or:

`https://g9rykd-jt.myshopify.com/?preview_theme_id=YOUR_THEME_ID`

## Source

Built from the fidelity-fixed Claude integration in `fizz/` and reference files in `~/Downloads/shopify 2`.
