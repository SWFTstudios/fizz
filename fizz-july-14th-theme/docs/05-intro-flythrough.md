# Chapter 05 — Intro fly-through

This is the signature moment of the theme. Read this chapter if you need to
rebuild or retune the logo mask animation.

## The effect

1. A full-bleed hero slider sits at `z-index: 1`.
2. A paper-colored layer sits above it (`z-index: 2`).
3. CSS `mask-image` punches transparent holes in the shape of **FIZZ**.
4. On scroll, the mask **scales** from the center of the letter **I** until the
   hole swallows the viewport; then the mask fades and hero copy fades in.

Visitors can also let **auto-scroll** drive that scrub on first load.

## Files

| File | Role |
| --- | --- |
| `sections/j14-intro.liquid` | Markup, CSS vars, schema, slides |
| `assets/j14-intro.js` | GSAP timeline + auto-scroll |
| `assets/j14-base.css` | Mask / stage / copy styles |
| `assets/Fizz_Logo_Intro.svg` | Desktop mask source |
| `assets/Fizz_Logo_INTRO_SVG_Mobile.svg` | Mobile mask source (≤749px) |
| `preview/intro-mask-flythrough.html` | Isolated lab |

## Evolution (why not clip-path anymore)

1. **Text F / ZZ** — brittle typography, not the real mark.  
2. **Split logo crops + `clip-path` on the stage** — measured I stem from a
   spacer; F and ZZ flew off. Worked, but never looked like a single die-cut.  
3. **SVG alpha mask + scale** — one overlay, real logo cutouts, fly through
   the I. Matches brand intent.

## CSS mask technique

```css
.j14-intro__mask-fill {
  background: var(--j14-paper);
  mask-image: var(--j14-intro-mask);
  mask-size: cover;          /* desktop: full 100vw paper */
  mask-mode: alpha;          /* use alpha, not luminance */
}
```

Liquid sets:

```liquid
--j14-intro-mask: url('{{ 'Fizz_Logo_Intro.svg' | asset_url }}');
--j14-intro-mask-mobile: url('{{ 'Fizz_Logo_INTRO_SVG_Mobile.svg' | asset_url }}');
```

Mobile swaps the mask under `@media (max-width: 749px)`.

**Why alpha mode?** The SVG embeds a PNG whose opaque pixels are near-black.
Luminance masking would invert the intended paper/holes. Alpha masking uses
transparency for cutouts and opacity for paper.

**Why `cover` on desktop?** `contain` left hero visible in side gutters on wide
screens. `cover` fills the viewport; JS scale math uses `Math.max` for logo
display width to match.

## Measured origins

Hardcoded after analyzing the mask bitmaps (Liquid cannot measure SVG holes):

| Breakpoint | Transform origin | Stem width fraction | Aspect |
| --- | --- | --- | --- |
| Desktop | `45.24% 49.76%` | `0.027` | `3038 / 1888` |
| Mobile | `43.15% 49.90%` | `74 / 1926` | `1926 / 4512` |

If you replace a mask file, re-measure the I stem and update **both** CSS
`transform-origin` and `getMaskMetrics()` in `j14-intro.js`.

## Scale formula

```
logoW = cover ? max(vpW, vpH * aspect) : min(vpW, vpH * aspect)
stemPx = logoW * stemRatio
endScale = (vpW / stemPx) * 1.08
```

The `1.08` overshoot clears residual paper edges.

## GSAP timeline (scrubbed)

ScrollTrigger on `.j14-intro__track` (`height: scroll_length vh`):

| Progress | Action |
| --- | --- |
| 0 → 0.72 | Scale mask to `endScale` (`power2.inOut`) |
| ~0.68 | Fade mask opacity to 0 |
| 0 → early | Hide scroll hint |
| 0.72 → 1 | Fade / rise hero copy parts |

Classes: `is-zoomed` (>0.62), `is-copy-in` (>0.82), `is-done` (≥0.98).

## Auto-scroll settings (schema)

| Setting | Default | Meaning |
| --- | --- | --- |
| `autoscroll_enabled` | true | Run on first paint |
| `autoscroll_delay` | 0.4s | Wait before tween |
| `autoscroll_duration` | 2.2s | Scroll tween length |
| `autoscroll_ease` | power2.inOut | GSAP ease |
| `autoscroll_target` | 88% | End ScrollTrigger progress |

Cancelled immediately on `wheel`, `touchstart`, `pointerdown`, `keydown`.
Skipped when `Shopify.designMode`, reduced motion, or `scrollY > 4`.

## Reduced motion / no JS

- Mask hidden (`opacity: 0` / `visibility: hidden`)
- Full hero + copy visible
- Track height collapses to a normal viewport section

## Tutorial: retune the I origin

1. Replace `Fizz_Logo_Intro.svg` (or mobile).
2. Measure transparent I stem center as % of the **mask coordinate space**
   that `mask-size: cover/contain` uses.
3. Update CSS + JS origins and stem ratio.
4. Validate in `preview/intro-mask-flythrough.html` (press **D** for origin
   debug in the lab).
5. Push `j14-intro.liquid`, `j14-base.css`, `j14-intro.js`, and the SVG(s).

## Tutorial: isolated preview

```sh
cd fizz-july-14th-theme
python3 -m http.server 4173
# http://localhost:4173/preview/intro-mask-flythrough.html
```

The preview is listed in `.shopifyignore` so broad theme pushes do not upload
it as a theme asset.

Next: [Chapter 06 — Commerce](06-commerce.md)
