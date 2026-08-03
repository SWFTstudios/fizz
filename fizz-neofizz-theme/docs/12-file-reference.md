# Chapter 12 — File reference

## Core runtime

| Path | Purpose |
| --- | --- |
| `layout/theme.liquid` | HTML shell, CSS/JS includes |
| `layout/password.liquid` | Password page shell |
| `config/settings_schema.json` | Theme settings UI |
| `config/settings_data.json` | Saved values + 5 Theme styles |
| `locales/en.default.json` | Translations |
| `assets/nf-fonts.css` | Helvetica Neue LT Std `@font-face` stack |
| `assets/helvetica-neue-lt-std-*.otf` | Brand typeface files (12 weights/styles) |
| `assets/nf-base.css` | Global + section styles |
| `assets/nf-neofizz.css` | NeoFizz-specific hero / preloader / layout |
| `assets/nf-hero.js` | Glyph preloader + clip-path hero window |
| `assets/nf-motion.js` | Scroll reveals / motion helpers |
| `assets/nf-scroll.js` | Sticky how-to / scroll effects |
| `assets/nf-carousel.js` | Carousel rails |
| `assets/nf-stats.js` | Stats count-up |
| `assets/nf-page-transition.js` | Page transitions |
| `assets/nf-transition.js` | Transition helpers / colors |
| `assets/gsap.min.js` | GSAP core |
| `assets/ScrollTrigger.min.js` | ScrollTrigger plugin |

## Sections

| File | Template use |
| --- | --- |
| `nf-hero.liquid` | Home (preloader + hero slider) |
| `nf-marquee.liquid` | Home |
| `nf-story-split.liquid` | Home |
| `nf-product-bento.liquid` | Home |
| `nf-how-sticky.liquid` | Home |
| `nf-features.liquid` | Home |
| `nf-stats.liquid` | Home (+ any template) |
| `nf-flavors.liquid` | Home |
| `nf-about.liquid` | Optional / other templates |
| `nf-sustainability.liquid` | Optional / other templates |
| `nf-footer.liquid` | Footer group |
| `nf-footer-2.liquid` | Footer group (glassmorphic) |
| `nf-header.liquid` | Header group |
| `nf-product.liquid` | Product |
| `nf-related.liquid` | Product |
| `nf-collection.liquid` | Collection |
| `nf-list-collections.liquid` | List collections |
| `nf-cart.liquid` | Cart |
| `nf-search.liquid` | Search |
| `nf-page.liquid` | Page |
| `nf-404.liquid` | 404 |
| `nf-password.liquid` | Password |
| `header-group.json` | Header section group |
| `footer-group.json` | Footer section group |

## Snippets

| File | Purpose |
| --- | --- |
| `nf-media.liquid` | Unified media renderer |
| `nf-theme-tokens.liquid` | CSS variables |
| `nf-colorway-preset-data.liquid` | Theme style palettes |
| `nf-colorway-scene.liquid` | Bottle scene gradients |
| `nf-color-slug.liquid` | Variant → slug |
| `nf-product-card.liquid` | Card for grids / related |

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
| `design/NEOFIZZ-DESIGN-RESEARCH.md` | Shopify research |
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
2. New token → `settings_schema` + `nf-theme-tokens`.  
3. New bottle color → slug map + optional metafields.  
4. New transition style → `nf-page-transition.js` + settings select.  

Next: [Chapter 13 — Build history](13-build-history.md)
