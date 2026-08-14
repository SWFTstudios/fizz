# NF Water Wave — research notes

Date: 2026-08-12  
Themes: `fizz-neofizz-theme`, `fizz-ballena-theme` (mirrored)

## Docs verified

- Theme editor **range** settings require numeric `min` / `max` / `default` (not strings); values return as numbers.  
  Source: [Input settings — range](https://shopify.dev/docs/storefronts/themes/architecture/settings/input-settings)

## Storefront vs editor

- Schema range labels/bounds control Theme Editor UI only.
- Storefront reads saved numbers via Liquid into `#shopify-section-{{ id }}` CSS variables (`--nf-wave-height`, `--nf-wave-duration`, `--nf-wave-overlap`).
- Path geometry is JS-only (Liquid has no trig / SVG path builders).

## Hard limits

1. **Seamless loop:** CSS `translate3d(-50%)` requires the crest function to be periodic over half the SVG width (`tileWidth = period * tiles`). Harmonics use integer cycles (1, 2, 5) so `y(0) === y(tileWidth)`.
2. **Setting ids:** Keep `duration`, `overlap`, `height` ids when only changing labels/max — renaming ids resets merchant values.
3. **Overlap stacking:** Negative `margin-block` alone is not enough; section wrapper needs `overflow: visible` + `position: relative` + `z-index` scoped to `#shopify-section-{{ id }}`. Neighbors with their own `overflow: hidden` may still clip the crest.
4. **Isolation:** All selectors / vars / JS stay under `nf-water-wave`; wave uses `pointer-events: none`; z-index (~10) stays below header (50).

## Implemented merchant ranges

| Setting id | Label | Range | Default |
| --- | --- | --- | --- |
| `duration` | Speed | 2–20 s | 5 |
| `overlap` | Overlap into adjacent sections | 0–64 px | 8 |
| `height` | Wave height | 16–160 px | 40 |
