# Chapter 08 — Motion & accessibility

## Motion map

| Feature | Engine | Reduced-motion behavior |
| --- | --- | --- |
| Intro fly-through | GSAP ScrollTrigger | Mask hidden; static hero + copy |
| Intro auto-scroll | GSAP scroll tween | Disabled |
| Mosaic / how-to | `j14-scroll.js` | Static layouts |
| Colorways | CSS scroll-snap + JS | Still swipeable; no auto scene thrash |
| Page transitions | `j14-page-transition.js` | Instant navigation |
| PDP gallery | CSS transforms | Transitions shortened / static |

Theme settings:

- **Enable scroll animations** → toggles `j14-no-motion` on `<html>`  
- **Enable page transitions** + style (melt / classic) + melt intensity  

## Theme editor lifecycle

All major engines re-init on:

- `shopify:section:load`  
- `shopify:section:unload`  
- `shopify:block:select` (jump to slide / step)  

Auto-scroll is **disabled** in `Shopify.designMode` so merchants are not
fought while editing.

## Accessibility checklist

- Skip link to `#main-content`  
- Intro SEO heading is visually hidden but present (`seo_heading`)  
- Buttons / thumbs have `aria-label`s  
- Focusable main landmark (`tabindex="-1"`)  
- Respect `prefers-reduced-motion`  
- Color contrast depends on chosen Theme style — verify accent on paper  

## Performance notes

- Scripts are `defer`ed after body content.  
- Intro slides should use `loading: eager` only for the first media.  
- Mask SVGs can be large (hundreds of KB) because they embed PNGs — optimize
  exports when possible.  
- Prefer compressed lifestyle JPGs (<500 KB) for new tiles.  
- Avoid animating layout properties; intro animates `transform` + `opacity`.

## Prefetch

Page transitions may prefetch the next document during the leave animation.
Failures fall back to hard navigation.

Next: [Chapter 09 — Merchant guide](09-merchant-guide.md)
