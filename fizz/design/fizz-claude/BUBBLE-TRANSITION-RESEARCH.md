# Bubble + liquid page transition research

Topic report for ambient canvas bubbles and Shopify multi-page leave/enter overlays.
Does not replace colorway research in `design/colorway-presets/SHOPIFY-COLORWAY-RESEARCH.md`.

## Storefront vs theme editor

| Concern | Runtime (Liquid + JS) | Theme editor UI |
|---------|----------------------|-----------------|
| Ambient bubbles | Canvas fields in sections; settings drive CSS vars + `bubble-style-*` on `<html>` | Merchants toggle style, opacity, density |
| Page transitions | Full reload + `sessionStorage` overlay; no SPA router | Settings choose `melt` vs `classic`; preview of leave/enter is limited |

## Current stack (pre-upgrade)

- Ambient: `assets/fizz.js` — Canvas 2D `arc` + radial gradient, shared RAF, `IntersectionObserver` pause
- Transition: `assets/fizz-transition.js` — dual `border-radius` DOM slabs (WAAPI) + cyan bubble burst canvas
- Styles: `ring` / `glass` / `bold`

## Techniques evaluated

| Technique | Look | Feasible theme-only? | Sources |
|-----------|------|----------------------|---------|
| Canvas metaballs via CSS `blur` + `contrast` / SVG goo | Merging liquid / melt cover | **Yes — chosen** | [Effect.Labs metaballs](https://effect-labs.com/en/pages/blog/blood-goo-metaballs-canvas.html), [canvas-liquid-effect](https://github.com/n3r4zzurr0/canvas-liquid-effect) |
| Marching-squares scalar fields | Mercury melt | Possible; CPU-heavy on mobile | [slicker.me metaballs](https://slicker.me/javascript/metaballs/metaballs-tutorial.htm) |
| Noise dissolve / GL Transitions | Page sinks into liquid | Needs two textures (DOM capture) | [CSS-Tricks dissolve](https://css-tricks.com/nailing-that-cool-dissolve-transition/), [gl-transitions](https://github.com/gl-transitions/gl-transitions) (`dissolve`, `flyeye`, `WaterDrop`) |
| WebGL displacement + GSAP | Ripple / liquid warp | New heavy stack + capture | [Codrops shaders + GSAP](https://tympanus.net/codrops/2025/10/08/how-to-animate-webgl-shaders-with-gsap-ripples-reveals-and-dynamic-blur-effects/), [ripple dissolve](https://github.com/m1ckc3s/ripple) |
| `html2canvas` + Disintegrate | Page fragments into particles | Fragile on Shopify fonts/filters | [Disintegrate](https://github.com/ZachSaucier/Disintegrate) |
| Cross-document View Transitions | Browser crossfade / shared morph | Progressive only; fights custom overlay | [WebKit VT](https://webkit.org/blog/16967/two-lines-of-cross-document-view-transitions-code-you-can-use-on-every-website-today/), [Shopify VT examples](https://www.kelp.agency/blog/how-shopify-view-transition-liquid-theme/) |
| Upgraded canvas glass bubbles | Specular rim, depth bands, foam | Drop-in on existing engine | [Canvas bubbles lineage](https://shrutikapoor.dev/posts/JS-HTML-canvas-bubbles) |

## Verdict

Do **not** liquify actual page pixels (WebGL snapshot). Build a **carbonation melt overlay**: micro-bubbles merge (metaball) to cover on leave; solid field fractures into rising bubbles on enter. Ambient bubbles get modern glass/foam drawing. Keep full-reload + `sessionStorage` (Shopify-correct).

## Limitations

- No true DOM liquify without texture capture — unreliable with theme chrome
- GL Transitions need from/to images — incompatible with plain reload unless snapshotting
- View Transitions clash with branded JS overlay if both run as primary
- Metaball `blur`+`contrast` needs opaque compositing; cap particles and DPR (≤2) on mobile
- Theme editor cannot fully preview leave/enter across navigations
- Respect `prefers-reduced-motion` with instant navigate

## Implementation mapping

| Plan item | Primary files |
|-----------|---------------|
| Ambient upgrade | `assets/fizz.js`, mirror `fizz/assets/fizz-claude.js` |
| Melt transition | `assets/fizz-transition.js`, mirror `fizz/assets/fizz-claude-transition.js` |
| Merchant controls | `config/settings_schema.json`, `layout/theme.liquid`, token snippets |
| Docs | `README.md`, this file, `fizz/design/fizz-claude/README.md` |
