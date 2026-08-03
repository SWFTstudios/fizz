# NeoFizz

Standalone Online Store 2.0 theme in the Fizz Theme Library. NeoLeaf-inspired
homepage motion and layout, with July 14 product copy, Helvetica Neue LT Std,
Steel Navy defaults, sticky how-it-works, glass stats, and melt/classic bubble
page transitions.

**Do not push this folder over July 14 / Claude / `fizz/`.** Deploy as its own theme.

## Deploy

Push as an **unpublished** Theme Library entry (never over live July 14):

```bash
shopify theme push \
  --path fizz-neofizz-theme \
  --unpublished \
  --theme "NeoFizz"

# Update existing unpublished NeoFizz (example ID):
shopify theme push --path fizz-neofizz-theme --theme 189109174557
```

Docs: [`docs/10-development-deployment.md`](docs/10-development-deployment.md).

## Branch

Work lives on the `neofizz` git branch. All NeoFizz edits should stem from it.

## Homepage pipeline

1. **NF Hero** — water-fill FIZZ logo loader → zoom/fade → full-viewport lifestyle slider  
2. **NF Marquee** — keyword strip  
3. **NF Story Split** — brand story + lifestyle  
4. **NF Product Bento** — dark rounded product cards  
5. **NF How To Use** — sticky scrub steps (image / video / text / button)  
6. **NF Key Features** — accordion feature cards  
7. **NF Stats** — glass impact stats  
8. **NF Flavors** — flavor packs  

Header nav (Colors, How it works, Flavors, About, Shop) is preserved.

## Theme styles

Max 5 presets. Default: **Steel Navy**. Merchants can switch Theme style or enable custom colors.

## Page transitions

Theme settings → Motion:

- Enable melt / classic bubble transitions  
- **Bubble transition color**: Theme accent **or** custom color picker  

## Research

See [`design/NEOFIZZ-DESIGN-RESEARCH.md`](design/NEOFIZZ-DESIGN-RESEARCH.md).

## Motions & a11y

- `prefers-reduced-motion` and Theme setting `motion_enabled` skip the loader, marquees, and heavy scroll effects  
- Theme editor design mode skips the intro loader  

## Media

Curated CoreHome lifestyles ship as compressed `nf-lifestyle-*.jpg` assets. Prefer theme-editor uploads for additional photography.
