# Chapter 05 — Intro fly-through

This is the signature moment of the theme. Read this chapter if you need to
rebuild or retune the logo mask animation.

## The effect

1. A full-bleed hero slider sits at `z-index: 1`.
2. A paper-colored layer sits above it (`z-index: 2`).
3. CSS `mask-image` punches transparent holes in the shape of **FIZZ**.
4. On **page load**, a timed GSAP timeline scales the mask from the center of
   the letter **I** until the hole swallows the viewport; the mask is then
   permanently removed and hero copy fades in.

This is **not** scroll-driven. There is no multi-viewport sticky track. The
intro is a normal full-viewport hero section. Any user input during the
animation jumps straight to the completed hero state.

## Files

| File | Role |
| --- | --- |
| `sections/j14-intro.liquid` | Markup, CSS vars, schema, slides |
| `assets/j14-intro.js` | Load-only GSAP timeline |
| `assets/j14-base.css` | Mask / stage / copy styles |
| `assets/Fizz_Logo_Intro.svg` | Desktop mask source |
| `assets/Fizz_Logo_INTRO_SVG_Mobile.svg` | Mobile mask source (≤749px) |
| `preview/intro-mask-flythrough.html` | Isolated lab |

## Evolution

1. **Text F / ZZ** — brittle typography, not the real mark.  
2. **Split logo crops + `clip-path` on the stage** — measured I stem.  
3. **SVG alpha mask + ScrollTrigger scrub** — fly through the I, but reverse
   scrub after sticky sections re-showed mid-scale bitmap fragments.  
4. **Load-only timeline + permanent mask teardown** — same visual, no scrub,
   no post-sticky ghosting.

## CSS mask technique

```css
.j14-intro__mask-fill {
  background: var(--j14-intro-mask-fill, var(--j14-paper));
  mask-image: var(--j14-intro-mask);
  mask-size: cover;
  mask-mode: alpha;
}
.j14-intro.is-done .j14-intro__mask {
  display: none;
}
```

Liquid sets:

```liquid
--j14-intro-mask: url('{{ 'Fizz_Logo_Intro.svg' | asset_url }}');
--j14-intro-mask-mobile: url('{{ 'Fizz_Logo_INTRO_SVG_Mobile.svg' | asset_url }}');
/* Optional section setting mask_color → */
--j14-intro-mask-fill: {{ section.settings.mask_color }};
```

**Mask paper color:** Section setting `mask_color` overrides Theme style paper
for the cutout fill and hero stage background. Leave blank to inherit
`--j14-paper`.

**Why alpha mode?** The SVG embeds a PNG whose opaque pixels are near-black.
Luminance masking would invert the intended paper/holes.

## Measured origins

| Breakpoint | Transform origin | Stem width fraction | Aspect |
| --- | --- | --- | --- |
| Desktop | `45.24% 49.76%` | `0.027` | `3038 / 1888` |
| Mobile | `37.59% 49.78%` | `135 / 1926` | `1926 / 3128` |

If you replace a mask file, re-measure the I stem and update **both** CSS
`transform-origin` and `getMaskMetrics()` in `j14-intro.js`.

## Scale formula

```
logoW = cover ? max(vpW, vpH * aspect) : min(vpW, vpH * aspect)
stemPx = logoW * stemRatio
endScale = (vpW / stemPx) * 1.08
```

## Load timeline

| Phase | Action |
| --- | --- |
| Delay (`autoscroll_delay`) | Hold on logo cutout |
| ~0–72% of duration | Scale mask to `endScale` |
| ~55–77% | Fade mask opacity; then `display: none` + reset scale |
| ~70–100% | Fade / rise hero copy; restore scroll hint |
| Complete | Classes `is-zoomed`, `is-copy-in`, `is-done` |

Interrupt (`wheel` / `touchstart` / `pointerdown` / `keydown`): jump to end.

Skipped when reduced motion, `autoscroll_enabled` false, or `Shopify.designMode`
(static completed hero for editing).

## Intro animation settings (schema)

Setting IDs keep the `autoscroll_*` names for saved theme data compatibility.

| Setting ID | Label | Default |
| --- | --- | --- |
| `autoscroll_enabled` | Play intro animation on load | true |
| `autoscroll_delay` | Intro animation delay | 0.4s |
| `autoscroll_duration` | Intro animation duration | 2.2s |
| `autoscroll_ease` | Intro animation easing | power2.inOut |

Removed: `scroll_length`, `autoscroll_target` (no scroll track).

## Reduced motion / no JS

- Mask `display: none`
- Full hero + copy visible

## Tutorial: isolated preview

```sh
cd fizz-july-14th-theme
python3 -m http.server 4173
# http://localhost:4173/preview/intro-mask-flythrough.html
```

Next: [Chapter 06 — Commerce](06-commerce.md)
