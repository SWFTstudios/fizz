# Fizz Claude — Theme Asset Library

All files live in **Online Store → Themes → … → Edit code → Assets**, or locally in `assets/`.

Use in Liquid: `{{ 'filename.jpg' | asset_url }}` or `{% render 'fizz-img', file: 'filename.jpg', alt: '…' %}`.

## Typography (self-hosted `.woff2` in `assets/`)

Loaded via `fizz-fonts.css` — flat asset folder (Shopify does not allow subfolders).

| File | Family |
|------|--------|
| `anton-latin.woff2` | Anton |
| `archivo-latin-400.woff2` | Archivo 400 |
| `archivo-latin-700.woff2` | Archivo 700 |
| `bodoni-moda-italic-latin.woff2` | Bodoni Moda italic |
| `jetbrains-mono-latin-500.woff2` | JetBrains Mono 500 |
| `jetbrains-mono-latin-600.woff2` | JetBrains Mono 600 |

## Brand

| Asset | Use |
|-------|-----|
| `fizz-logo.avif` | Nav + bottle fallback mark |
| `fizz-logo-white.jpg` | Light logo on dark backgrounds |
| `fizz-bottle-hero.jpg` | Hero / marketing bottle shot |

## PDP lifestyle thumbs (wired by default)

| Asset | Label |
|-------|-------|
| `fizz-lifestyle-trail.jpg` | lifestyle — trail |
| `fizz-lifestyle-pod-detail.jpg` | cap + CO₂ pod detail |
| `fizz-lifestyle-macro.jpg` | fizz macro shot |

## Colorway hero lifestyle (per color)

Desktop + mobile pairs — use in hero, colorways, or PDP variant story:

- `hero-lifestyle-arctic-white.png` / `-mobile.png`
- `hero-lifestyle-charcoal-black.png` / `-mobile.png`
- `hero-lifestyle-coral-orange.png` / `-mobile.png`
- `hero-lifestyle-electric-blue.png` / `-mobile.png`
- `hero-lifestyle-sage-green.png` / `-mobile.png`
- `hero-lifestyle-steel-navy.png` / `-mobile.png`

## Studio / marketing renders

| Asset | Use |
|-------|-----|
| `fizz-studio-navy.jpg` | Navy bottle studio |
| `fizz-studio-citrus.jpg` | Citrus / dynamic seltzer |
| `fizz-studio-berry.jpg` | Berry tone render |

## Stitch lifestyle collection (`stitch-*.jpg`)

Imported from the Claude / Stitch design workspace:

| Asset | Suggested use |
|-------|----------------|
| `stitch-hero-hiker-sunrise.jpg` | Hero / mission |
| `stitch-flavor-packs-lifestyle.jpg` | Flavor CTA band |
| `stitch-flavor-zesty-lime.jpg` | Citrus flavor panel (default) |
| `stitch-flavor-blood-orange.jpg` | Berry flavor panel (default) |
| `stitch-flavor-crisp-cucumber.jpg` | Alt flavor |
| `stitch-science-carbonation.jpg` | Science / macro bubbles |
| `stitch-bottle-*-studio.jpg` | PDP / collection per colorway |
| `stitch-bottle-*-pool.jpg` / `kitchen` / `desk` | Lifestyle contexts |
| `stitch-hero-slideshow-1.jpg` … `3.jpg` | Slideshow fallbacks |
| `stitch-hotspot-*.jpg` | Shop-the-look hotspots |

Full URL → filename map: `fizz/assets/stitch-asset-map.json` (main Fizz theme).

## Motion & transitions

| Asset | Role |
|-------|------|
| `fizz.js` | Bubbles, scroll reveal, parallax, cursor, swatches, PDP |
| `fizz-transition.js` | Liquid bubble **page transitions** on internal Shopify links |
| `fizz-base.css` | All layout, animation keyframes (`fizzrise`, `fizzslide`), grain |

Page transitions skip: `#` anchors on same page, external links, cart add, checkout. Nav hash links on homepage use `data-no-transition`.

## Re-import / push

```bash
cd fizz-claude-theme
shopify theme push --store g9rykd-jt.myshopify.com --theme "Fizz Claude" --only assets/
```
