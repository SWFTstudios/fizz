# July 14th Custom Design

A standalone Shopify Online Store 2.0 theme for Fizz. Scroll-driven homepage
narrative, colorway-aware commerce, GSAP intro mask fly-through, and
merchant-editable sections throughout.

**Source of truth:** this package (`fizz-july-14th-theme/`). Do **not** push
the sibling `fizz/` package for July 14 work — that package’s default homepage
is a different design system.

| | |
| --- | --- |
| Store | `g9rykd-jt.myshopify.com` |
| Live theme | July 14th Custom Design (`#188630794525`) |
| Docs book | [`docs/`](docs/) |

---

## What you get

1. **Intro mask fly-through** — paper-colored SVG alpha mask with transparent
   FIZZ letter cutouts; on page load the mask scales through the **I** stem into
   a full-bleed hero slider (desktop + mobile masks), then is removed.
2. **Homepage story** — mosaic gallery, colorways carousel, sticky how-to,
   flavors, about, sustainability, footer.
3. **Commerce** — product gallery (slider/fade), colorway swatches, related
   products, collection / cart / search templates.
4. **Theme styles** — five colorway presets (Shopify’s max), typography, motion,
   and page transitions (melt / classic).
5. **Merchant control** — every section is editor-editable; warp metafields
   drive per-variant carousel media and scene colors.

---

## Quick start

```sh
# From the repository root
cd fizz-july-14th-theme

# Lint (Liquid / JSON / theme best practices)
shopify theme check --path .

# Targeted push to the live July 14 theme
shopify theme push \
  --path . \
  --store g9rykd-jt.myshopify.com \
  --theme 188630794525 \
  --allow-live

# Optional: define warp / scene metafields once per store
./scripts/setup-warp-metafields.sh
```

**Isolated intro preview** (no Shopify CLI required):

```sh
# From fizz-july-14th-theme/
python3 -m http.server 4173
# Open http://localhost:4173/preview/intro-mask-flythrough.html
```

> **Note:** `shopify theme dev` may fail on this store if the CLI identity
> lacks `read_themes` / theme-create scopes. Prefer Theme Check + the isolated
> preview + explicit `theme push` (see [Chapter 10](docs/10-development-deployment.md)
> and [Chapter 11](docs/11-troubleshooting.md)).

---

## Documentation book

Read these chapters in order if you are building or extending the theme from
scratch. Jump around if you already know Shopify themes.

| Ch | Title | Start here if you need… |
| --: | --- | --- |
| 00 | [Overview](docs/00-overview.md) | Goals, finished experience, package boundaries |
| 01 | [From scratch](docs/01-from-scratch.md) | CLI, auth, store, first verification |
| 02 | [Theme architecture](docs/02-theme-architecture.md) | OS 2.0 folders, Liquid vs editor |
| 03 | [Design system](docs/03-design-system.md) | Tokens, presets, typography, assets |
| 04 | [Homepage build](docs/04-homepage-build.md) | Section-by-section homepage |
| 05 | [Intro fly-through](docs/05-intro-flythrough.md) | Mask math, GSAP timeline, auto-scroll |
| 06 | [Commerce](docs/06-commerce.md) | PDP, collections, cart, header |
| 07 | [Colorways & metafields](docs/07-colorways-metafields.md) | Presets + warp metafield tutorial |
| 08 | [Motion & accessibility](docs/08-motion-accessibility.md) | Scroll engine, transitions, a11y |
| 09 | [Merchant guide](docs/09-merchant-guide.md) | Day-to-day theme editor workflows |
| 10 | [Development & deployment](docs/10-development-deployment.md) | Check, push, Git, rollback |
| 11 | [Troubleshooting](docs/11-troubleshooting.md) | Permissions, masks, cache, motion |
| 12 | [File reference](docs/12-file-reference.md) | Annotated map + asset catalog |
| 13 | [Build history](docs/13-build-history.md) | Why decisions changed over time |

Platform research (Shopify limits and sources):
[`design/JULY14-DESIGN-RESEARCH.md`](design/JULY14-DESIGN-RESEARCH.md)

---

## Homepage order

`templates/index.json`:

1. `j14-intro` — mask fly-through + hero slides
2. `j14-mosaic` — media grid
3. `j14-colorways` — bottle variants / warp media
4. `j14-how-sticky` — sticky how-to scrub
5. `j14-flavors` — flavor packs
6. `j14-about` — brand story
7. `j14-sustainability` — stats / claims
8. `j14-footer` — CTA, newsletter, links

---

## Motion stack

| Script | Role |
| --- | --- |
| `gsap.min.js` + `ScrollTrigger.min.js` | Intro load timeline (GSAP); ScrollTrigger reserved for other sections |
| `j14-intro.js` | Mask scale / fade, auto-scroll, slide carousel |
| `j14-scroll.js` | Mosaic + how-to rAF / IntersectionObserver |
| `j14-carousel.js` | Colorways scroll-snap rail |
| `j14-page-transition.js` | Melt / classic internal navigation |

All respect `prefers-reduced-motion` and Theme settings → **Enable scroll
animations**.

---

## License / ownership

Internal Fizz / SWFT Studios theme package. Not submitted to the Shopify Theme
Store.
