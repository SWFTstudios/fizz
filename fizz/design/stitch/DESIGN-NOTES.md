# Stitch design notes

Project: **Fizz - Premium Hydration Landing Page** (`13307174822560991499`)

## Screens

| Screen | ID | Local reference |
|--------|-----|-----------------|
| Fizz Origin - Product Detail Page | `e824092ed29e40bfa8e1679f38bd8d91` | `design/stitch/pdp/` |
| Fizz - Premium Shopping Cart | `72772ecf9b9b4bcfb600fdd33956bb96` | `design/stitch/cart/` |

Run `./scripts/fetch-stitch-screens.sh` with `STITCH_API_KEY` set to download `reference.html` and `reference.png` for screen `e824092ed29e40bfa8e1679f38bd8d91`.

## Bottle template section stack (Stitch Origin)

1. `fizz-product-bottle` — hero (gallery, title+price row, circular swatches, highlight chips, pill ATC)
2. `fizz-pdp-elevate-band` — "Elevate Every Drop" full-bleed lifestyle
3. `fizz-pdp-science` — The Science of Sparkle
4. `fizz-pdp-how-it-works` — 3-step process
5. `fizz-pdp-experience` — Complete the Experience wide card
6. `fizz-pdp-faq` — accordion FAQs

## Tokens (aligned with Stitch landing import + `fizz-home.css`)

| Token | Value |
|-------|--------|
| Page background | `#030303` |
| Surface | `#111111` / glass `rgba(32,31,31,0.4)` |
| Elevated panel | `#1a1a1a` with `border: 1px solid rgba(255,255,255,0.1)` |
| Text | `#f5f5f7` / `#e5e2e1` |
| Muted | `rgba(255,255,255,0.72)` |
| Accent (commerce) | `#FF7F50` coral / per-color `--pdp-accent` on bottle |
| Font body | Hanken Grotesk |
| Font label | JetBrains Mono, 12px, 0.1em tracking, uppercase |
| H1 PDP | clamp(2rem, 4vw, 3rem), uppercase, -0.02em tracking |
| Radius media | `16px` |
| Radius CTA | `9999px` |
| Max width commerce | `1280px` |
| Sticky header offset | `5.5rem` |

## Layout patterns

**PDP:** Sticky 2-column hero (gallery left, glass buy panel right) → full-width lifestyle band → USP grid → accordions → product cards → collection rails.

**Cart:** Line items left, sticky order summary right; qty steppers; subscription badge on CO₂ lines; empty state with shop links.
