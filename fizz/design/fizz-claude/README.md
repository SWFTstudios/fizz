# Fizz Claude template

Homepage template **`fizz-claude`** and product template **`product.fizz-claude`** — ported from the Claude design in `~/Downloads/shopify 2` and `Fizz Product - Standalone.html`.

## Activate

1. Push theme to **Fizz SS Redesign** (`#188486385949`) or run `shopify theme dev`.
2. **Online Store → Themes → Customize**
3. **Home page** → template **`fizz-claude`**
4. **Bottle product** → template **`fizz-claude`**
5. **Theme settings → Fizz Claude brand colors:**
   - Accent: `#c6f24e`
   - Ink: `#080a0d`
   - Paper: `#f2efe7`
6. **Theme settings → Fizz Claude bottle product** — drives nav CTA price/URL and colorways fallback.
7. Save.

Preview:

`https://g9rykd-jt.myshopify.com/?preview_theme_id=188486385949`

## Architecture

| Piece | Location |
|-------|----------|
| Fixed nav (mix-blend-mode) | `snippets/fizz-claude-nav.liquid` — rendered in `layout/theme.liquid` **before** `<main>` |
| Homepage sections | `sections/fizz-claude-*.liquid` |
| Product PDP | `sections/fizz-claude-product.liquid` |
| Grain overlay | `layout/theme.liquid` (body-level) |

Shopify `.shopify-section` wrappers are zeroed in `fizz-claude-base.css` so full-bleed hero, sticky how grid, and flavor split panels match the reference.

## Sections (theme editor)

| Section | File |
|---------|------|
| Claude Hero | `fizz-claude-hero` |
| Claude Statement | `fizz-claude-statement` |
| Claude How It Works | `fizz-claude-how` (`#how`) |
| Claude Colorways | `fizz-claude-colorways` (`#colors`) |
| Claude Flavor Strip | `fizz-claude-flavor-strip` (`#flavors`) |
| Claude Footer | `fizz-claude-footer` |
| Claude Product | `fizz-claude-product` (PDP only) |

Nav is **not** a section — it lives in the layout snippet so `position: fixed` and `mix-blend-mode: difference` work correctly.

## Assets

- `assets/fizz-claude-base.css` — layout, homepage, PDP, wrapper resets, marquee animation
- `assets/fizz-claude.js` — bubbles, scroll reveals, parallax, cursor, colorway swatches, PDP addons/cart
- `assets/fizz-claude-transition.js` — bubble page transitions
- `assets/fizz-claude-logo.avif`

## Bubble animation

Ambient rising bubbles appear in **hero**, **how it works**, **footer**, and **PDP stage**. They are rendered with **HTML5 canvas** + `requestAnimationFrame` (inspired by [this canvas bubble tutorial](https://www.freecodecamp.org/news/how-to-create-animated-bubbles-with-html5-canvas-and-javascript/)). Page-transition bubbles (on internal link clicks) are a separate DOM system in `fizz-claude-transition.js`.

### Canvas engine

- Each `.bubf[data-bubbles]` container gets a `<canvas class="bubf-canvas">` inserted by `initBubbles` in `assets/fizz-claude.js`
- Particles use `arc()` + `createRadialGradient` (specular highlight + tinted fill) like the CodePen reference
- Ambient rising only — no click-to-spawn
- A single shared animation loop drives all visible fields; `IntersectionObserver` pauses off-screen sections
- `ring` / `glass` / `bold` theme presets control stroke weight, gradient fill, and highlight intensity

### Quick start (Theme Editor)

1. Open **Online Store → Themes → Customize**
2. Go to **Theme settings → Fizz Claude bubble animation**
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

Edit the `.bubf` container in section Liquid files (`fizz-claude-hero.liquid`, `fizz-claude-how.liquid`, `fizz-claude-footer.liquid`, `fizz-claude-product.liquid`):

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

Output by `snippets/fizz-claude-theme-tokens.liquid` on `:root`:

| Variable | Theme setting | Purpose |
|----------|---------------|---------|
| `--bubble-peak-opacity` | Animation peak opacity | Max opacity during rise animation |
| `--bubble-size-scale` | Bubble size | Diameter multiplier |
| `--bubble-count-scale` | Bubble density | Count multiplier |
| `--hero-bubble-color` | Hero & PDP alpha | Bubble tint in hero + PDP |
| `--how-bubble-color` | How it works alpha | Bubble tint in how section |
| `--footer-bubble-color` | Footer alpha | Bubble tint in footer |

The `<html>` element receives `bubble-style-glass` (or `ring` / `bold`), optional `bubble-wobble`, and `data-bubble-enabled` when the `fizz-claude` template is active.

### Page transition bubbles

Rendered on a **canvas layer above the liquid waves** during internal link navigation (`assets/fizz-claude-transition.js`). Uses the same glossy radial-gradient style as ambient bubbles.

```js
var BUB_PEAK = 0.98;       // animation peak opacity
var LEAVE_BURST = 48;      // bubbles on page leave (+ staggered second burst)
var ENTER_BURST = 40;      // bubbles on page enter (+ staggered second burst)
var BUB_STROKE = 'rgba(255,255,255,0.95)';
var BUB_FILL = 'rgba(210,248,255,0.9)';
```

Raise `BUB_PEAK` or burst counts for louder transitions. Links with `data-no-transition` skip the effect (homepage hash nav uses this).

## Wiring products

- **Colorways:** link bottle product in the Colorways section; variants drive swatches. Optional metafield `custom.swatch_hex` per variant.
- **Flavor strip:** set linked product + splash image per block.
- **PDP add-ons:** in the Product section, set each add-on block's **Variant ID** (numeric) for CO₂ packs, sampler, etc.

## Push Claude files

```bash
cd fizz
shopify theme push --store g9rykd-jt.myshopify.com --theme 188495003933 \
  --only templates/index.fizz-claude.json \
  --only templates/product.fizz-claude.json \
  --only layout/theme.liquid \
  --only snippets/fizz-claude-nav.liquid \
  --only config/settings_schema.json \
  --only sections/fizz-claude-*.liquid \
  --only assets/fizz-claude-*
```

## Visual QA checklist

Compare at **375px**, **1024px**, and **1440px** against design screenshots:

- [ ] Nav: fixed, difference blend, links (Bottle / How it works / Colorways / Flavors) + **Shop — $89** CTA
- [ ] Hero: stacked NEVER / DRINK / flat / AGAIN, bottle right, lime marquee scrolling
- [ ] Statement: cream band, Bodoni Moda italic
- [ ] How: sticky bottle left, 01/02/03 steps right
- [ ] Colorways: giant colorway name, swatches update preview
- [ ] Flavors: citrus / berry split panels
- [ ] Footer: HYDRATE / LOUDER outline
- [ ] PDP: 2-col grid, swatches, add-ons toggle, big CTA, accordions

## Notes

- Default KS header/footer are hidden on this template; Claude nav + footer replace them.
- No Lenis / GSAP on this template — native scroll + vanilla JS only.
- Stone Sip templates (`index`, collection, cart, etc.) are unchanged.
