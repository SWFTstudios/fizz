# NeoFizz — Shopify research report

Research-backed notes for the NeoFizz theme package (`fizz-neofizz-theme/`),
inspired by [NeoLeaf](https://neoleaf.bytetown.agency) motion/layout while
preserving July 14 product copy, fonts, stats, how-it-works, and bubble page
transitions.

## Sources

- [Theme architecture](https://shopify.dev/docs/storefronts/themes/architecture)
- [Input settings](https://shopify.dev/docs/storefronts/themes/architecture/settings/input-settings)
- [Section schema](https://shopify.dev/docs/storefronts/themes/architecture/sections/section-schema)
- Prior report: sibling `fizz-july-14th-theme/design/JULY14-DESIGN-RESEARCH.md`

## Feasible in theme-only Liquid + JS

| Pattern | Approach |
| --- | --- |
| White→blue glyph preloader | Black shell; white plate + blue water; FIZZ SVG stencil via `mix-blend-mode: destination-in` (not CSS mask); I-stem zoom then fade |
| Full-viewport hero slider | Section blocks + autoplay (same media priority as J14) |
| Scroll section reveals | GSAP ScrollTrigger / IntersectionObserver |
| Sticky how-it-works | Port of J14 sticky scrub; optional CTA buttons per step |
| Melt / classic page transitions | Port of J14 canvas melt; CSS var for liquid color |
| Theme styles | Max **5** presets; default Steel Navy |

### Preloader vs NeoLeaf / J14

**Polarity:** black outside the letters; white→blue **inside** the glyphs only.

1. Fullscreen `#000` shell  
2. White plate + timed blue water inside `.nf-preloader__logo`  
3. FIZZ SVG `<img>` stencil with `mix-blend-mode: destination-in` + `isolation: isolate` — keeps plate pixels only where the logo’s **alpha** is opaque. (CSS `mask-image` on near-black PNG-in-SVG glyphs falls back to luminance in Safari and punches black letter holes on a white/blue field.)  
4. Scale the logo wrapper from the I-stem, fade the preloader, hero underneath is revealed  

Timed rAF `%` — not scroll-scrubbed. Status `%` stays in the DOM but is visually hidden.

## Limitations

| Limit | Mitigation |
| --- | --- |
| No JSON parse in Liquid | Color presets via Liquid `case` maps |
| Max 5 Theme styles | Lime Fizz, Steel Navy, Citrus Burst, Berry Night, Electric Pool |
| `video` setting has no default | Asset filename fallbacks via `nf-media` |
| NeoLeaf WebGL / Three.js | Replaced with lifestyle photography + CSS/GSAP |
| Large lifestyle library (~254MB) | Ship compressed curated JPGs only |

## Storefront vs theme editor

- Preloader and scroll pins run on the storefront.
- Theme editor: skip preloader when `Shopify.designMode`; listen for
  `shopify:section:load` / `shopify:block:select` on sticky how + hero slider.

## Default tokens (Steel Navy)

| Token | Value |
| --- | --- |
| Paper | `#e8edf5` |
| Ink | `#0f1a2e` |
| Accent | `#6b9fd4` |
| Surface | `#d5deeb` |
| Dark | `#0a1220` |
| Dark text | `#e8edf5` |
| Type | Helvetica Neue LT Std (site-wide) |

## Transition liquid color

`--nf-transition-liquid` resolves to theme accent **or** a custom color
setting (`page_transition_color_mode` = `theme_accent` | `custom`).
