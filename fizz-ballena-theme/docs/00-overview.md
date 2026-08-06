# Chapter 00 — Overview

## Why this theme exists

NeoFizz is a **standalone Online Store 2.0 theme** in the Fizz Theme Library.
It takes NeoLeaf-inspired homepage motion (glyph preloader, clip-path hero
window, sticky scrub, glass stats) and pairs it with July 14 product copy,
Helvetica Neue LT Std, Steel Navy theme styles, and melt / classic bubble page
transitions — without overwriting the live July 14 or Claude packages.

## Finished experience (visitor)

1. Land on home → black shell; FIZZ glyphs fill white→blue, then I-stem zoom
   opens into a full-viewport lifestyle hero slider.
2. Scroll → NeoLeaf-style clip-path “grow hole” reveals hero copy/CTAs.
3. Continue → marquee, story split, product bento, sticky how-to, feature
   accordion, glass stats, flavor packs.
4. Open a bottle PDP → gallery, swatches, colorway stage, add to cart.
5. Navigate internally → optional melt / classic page transition.

## Package boundaries

| Path | Role |
| --- | --- |
| `fizz-neofizz-theme/` | **NeoFizz source of truth** — this book |
| `fizz-july-14th-theme/` | Live July 14 production theme (sibling) |
| `fizz-claude-theme/` | Earlier design system (sibling) |
| `fizz/` | Multi-design package; not this theme |

**Do not push this folder over July 14 / Claude / `fizz/`.** Always use
`--path fizz-neofizz-theme` and target an unpublished NeoFizz theme ID.

## Reader roadmap

| You are… | Start at |
| --- | --- |
| New to the project | [01 — From scratch](01-from-scratch.md) |
| Extending sections | [02](02-theme-architecture.md) → [04](04-homepage-build.md) |
| Tuning the hero / preloader | [05 — Intro fly-through](05-intro-flythrough.md) + `design/NEOFIZZ-DESIGN-RESEARCH.md` |
| Wiring products | [06](06-commerce.md) → [07](07-colorways-metafields.md) |
| Merchant / content | [09 — Merchant guide](09-merchant-guide.md) |
| Stuck | [11 — Troubleshooting](11-troubleshooting.md) |

## Design principles

1. **Merchant editable first** — copy, media, products, and motion toggles live
   in the theme editor where possible.
2. **Research-backed limits** — never pretend Liquid can parse JSON or that
   Shopify allows more than five Theme styles.
3. **Graceful degradation** — reduced motion and no-JS still show a complete
   homepage and PDP.
4. **One source of truth** — this folder only for NeoFizz production work.

Next: [Chapter 01 — From scratch](01-from-scratch.md)
