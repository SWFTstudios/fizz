# Chapter 12 — File reference

## Core runtime

| Path | Purpose |
| --- | --- |
| `layout/theme.liquid` | HTML shell, CSS/JS includes |
| `layout/password.liquid` | Password page shell |
| `config/settings_schema.json` | Theme settings UI |
| `config/settings_data.json` | Saved values + 5 Theme styles |
| `locales/en.default.json` | Translations |
| `assets/j14-base.css` | Global + section styles |
| `assets/j14-intro.js` | Intro mask + auto-scroll |
| `assets/j14-scroll.js` | Mosaic / how-to |
| `assets/j14-carousel.js` | Colorways rail |
| `assets/j14-page-transition.js` | Page transitions |
| `assets/j14-transition.js` | Transition helpers / colors |
| `assets/gsap.min.js` | GSAP core |
| `assets/ScrollTrigger.min.js` | ScrollTrigger plugin |

## Sections

| File | Template use |
| --- | --- |
| `j14-intro.liquid` | Home |
| `j14-mosaic.liquid` | Home |
| `j14-colorways.liquid` | Home |
| `j14-how-sticky.liquid` | Home |
| `j14-flavors.liquid` | Home |
| `j14-about.liquid` | Home |
| `j14-sustainability.liquid` | Home |
| `j14-footer.liquid` | Many |
| `j14-header.liquid` | Header group |
| `j14-product.liquid` | Product |
| `j14-related.liquid` | Product |
| `j14-collection.liquid` | Collection |
| `j14-list-collections.liquid` | List collections |
| `j14-cart.liquid` | Cart |
| `j14-search.liquid` | Search |
| `j14-page.liquid` | Page |
| `j14-404.liquid` | 404 |
| `j14-password.liquid` | Password |
| `header-group.json` | Header section group |

## Snippets

| File | Purpose |
| --- | --- |
| `j14-media.liquid` | Unified media renderer |
| `j14-theme-tokens.liquid` | CSS variables |
| `j14-colorway-preset-data.liquid` | Theme style palettes |
| `j14-colorway-scene.liquid` | Bottle scene gradients |
| `j14-color-slug.liquid` | Variant → slug |
| `j14-product-card.liquid` | Card for grids / related |

## Templates

`index`, `product`, `collection`, `list-collections`, `cart`, `search`,
`page`, `404`, `password` — all JSON.

## Required intro / flavor assets

| Asset | Used by |
| --- | --- |
| `Fizz_Logo_Intro.svg` | Desktop intro mask |
| `Fizz_Logo_INTRO_SVG_Mobile.svg` | Mobile intro mask |
| `flavor-lifestyle-orange-tangerine.jpg` | Flavors |
| `flavor-lifestyle-cherry-limeade.jpg` | Flavors |
| `flavor-lifestyle-mixed-berry.jpg` | Flavors |

## Repo-only (ignored on deploy)

| Path | Purpose |
| --- | --- |
| `docs/` | This book |
| `design/JULY14-DESIGN-RESEARCH.md` | Shopify research |
| `preview/intro-mask-flythrough.html` | Isolated lab |
| `scripts/setup-warp-metafields.sh` | Metafield bootstrap |
| `README.md` | Package landing page |

## Future media library (optional)

Unreferenced lifestyle / logo files may exist for later editorial use
(`bottle-lifestyle-*`, `flavor-box-*`, alternate logo SVGs). They are not
required for a coherent runtime deploy. Prefer compressing and wiring them
through section settings before committing large binaries.

## Extension points

1. New homepage section → add Liquid + schema + `index.json` entry.  
2. New token → `settings_schema` + `j14-theme-tokens`.  
3. New bottle color → slug map + optional metafields.  
4. New transition style → `j14-page-transition.js` + settings select.  

Next: [Chapter 13 — Build history](13-build-history.md)
