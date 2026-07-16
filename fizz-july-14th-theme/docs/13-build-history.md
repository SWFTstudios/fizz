# Chapter 13 — Build history

A chronological narrative of how the July 14 theme arrived at its current
shape. Useful when a future change looks “obvious” but fights an earlier
constraint.

## 1. Standalone theme package

July 14 began as research + sections. It became
`fizz-july-14th-theme/` so the design could ship without modifying other
themes in the monorepo. Research lived in
`design/JULY14-DESIGN-RESEARCH.md` (media settings, block limits, five Theme
styles, no JSON parse in Liquid).

## 2. Parallel experiment in `fizz/`

An alternate `index.july14` template was prototyped inside the multi-design
`fizz/` package (`july14-*` assets/sections). That experiment froze while the
standalone package continued. **Do not treat it as production.**

## 3. Homepage narrative v1

Intro used typographic F / gap / ZZ with a CSS `clip-path` expanding from an
uppercase I. Mosaic, colorways, sticky how-to, flavors, combined
about+sustainability, and footer completed the scroll story. Motion was
mostly vanilla (`j14-scroll.js`) plus carousel snap.

## 4. Commerce + transitions

Product / collection / cart templates, colorway-aware PDP stage, related
cards, melt page transitions, and five Theme styles landed as the theme
became store-ready.

## 5. Split logo crops

Merchants wanted the real FIZZ mark. Phase 1 cropped `j14-logo-mark.svg`
into F and ZZ halves around a measured gap; GSAP still drove `clip-path` on
the media stage. Autoscroll-on-load with cancel-on-input was added to the
intro schema.

## 6. Mask fly-through (current)

Brand direction shifted to a die-cut paper mask:

- Desktop `Fizz_Logo_Intro.svg`  
- Mobile `Fizz_Logo_INTRO_SVG_Mobile.svg`  
- CSS alpha mask + paper fill (`--j14-paper`)  
- Scale from I stem instead of clipping the video  
- Desktop `mask-size: cover` to eliminate side gutters  
- Mobile metrics re-measured when the tall mobile SVG was replaced  

Isolated `preview/intro-mask-flythrough.html` became the fastest way to tune
the effect when `theme dev` permissions were unavailable.

## 7. Homepage / PDP polish in the same era

- Sustainability extracted into `j14-sustainability`  
- Flavor lifestyle photography refreshed  
- Header gradient / blur / mobile menu controls  
- PDP slider/fade gallery with fit and chrome options  
- Warp metafield bootstrap script for carousel media  

## 8. Documentation book

README + `docs/` chapters were written so a new developer or merchant partner
can rebuild the mental model from scratch without replaying every
conversation. Staging rules keep unused media dumps and the stale `fizz/`
experiment out of the production PR.

## Lessons worth keeping

1. Measure mask geometry in the **same space** CSS uses (`cover` vs
   `contain`).  
2. Prefer alpha masks when the file’s RGB is not the brand paper color.  
3. Case-sensitive CDN + case-insensitive macOS = naming traps.  
4. Editor mode must not inherit aggressive auto-scroll.  
5. One source of truth beats two “almost the same” packages.

Back to the index: [README](../README.md)
