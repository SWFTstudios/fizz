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

## Wiring products

- **Colorways:** link bottle product in the Colorways section; variants drive swatches. Optional metafield `custom.swatch_hex` per variant.
- **Flavor strip:** set linked product + splash image per block.
- **PDP add-ons:** in the Product section, set each add-on block's **Variant ID** (numeric) for CO₂ packs, sampler, etc.

## Push Claude files

```bash
cd fizz
shopify theme push --store g9rykd-jt.myshopify.com --theme 188486385949 \
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
