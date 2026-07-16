# Chapter 00 — Overview

## Why this theme exists

Fizz needed a storefront that feels like a brand film: a logo you can *fly
through*, a colorway you can swipe, and a product page that stays in the same
visual language. This package is that storefront as a **standalone Online Store
2.0 theme** — not an alternate template bolted onto another theme.

## Finished experience (visitor)

1. Land on home → paper mask with FIZZ cutouts over a living hero.
2. Scroll (or let auto-scroll run) → the **I** opens until the hero fills the
   screen; copy and CTAs appear.
3. Scroll further → lifestyle mosaic, bottle colorways, how-to, flavors, about,
   sustainability, footer.
4. Open a bottle PDP → gallery, swatches, colorway stage, add to cart.
5. Navigate internally → optional melt / classic page transition.

## Package boundaries

| Path | Role |
| --- | --- |
| `fizz-july-14th-theme/` | **Live source of truth** — this book |
| `fizz/` (repo sibling) | Multi-design package; July 14 *experiment* there is stale |
| `fizz-claude-theme/` (repo sibling) | Earlier design system; not this PR |

If you push the wrong path, you can overwrite the live July 14 theme with an
older homepage. Always use `--path fizz-july-14th-theme`.

## Reader roadmap

| You are… | Start at |
| --- | --- |
| New to the project | [01 — From scratch](01-from-scratch.md) |
| Extending sections | [02](02-theme-architecture.md) → [04](04-homepage-build.md) |
| Tuning the intro | [05 — Intro fly-through](05-intro-flythrough.md) |
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
4. **One source of truth** — this folder only for July 14 production work.

Next: [Chapter 01 — From scratch](01-from-scratch.md)
