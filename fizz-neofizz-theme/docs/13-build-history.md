# Chapter 13 — Build history

A chronological narrative of how NeoFizz arrived at its current shape. Useful
when a future change looks “obvious” but fights an earlier constraint.

## 1. Fork from July 14

NeoFizz began as a standalone fork of `fizz-july-14th-theme/` so NeoLeaf-inspired
motion could ship in the Theme Library **without** modifying the live July 14
storefront. Shared DNA kept: Helvetica Neue LT Std, Steel Navy defaults, sticky
how-to, flavor packs, colorway PDP pieces, melt / classic bubble transitions,
and the five Theme-style hard limit.

## 2. Package + branch boundaries

- Folder: `fizz-neofizz-theme/`  
- Git branch: `neofizz`  
- Deploy rule: unpublished theme only; never push over July 14 / Claude / `fizz/`  

Research notes live in `design/NEOFIZZ-DESIGN-RESEARCH.md` (Shopify limits,
storefront vs editor, preloader feasibility).

## 3. Homepage rebuild (NeoLeaf pipeline)

The July 14 intro → mosaic → colorways sequence was replaced with a NeoLeaf-
shaped scroll story:

1. **NF Hero** — preloader + clip-path grow hole + lifestyle slider  
2. **NF Marquee**  
3. **NF Story Split**  
4. **NF Product Bento**  
5. **NF How To Use** (sticky scrub; optional CTA per step)  
6. **NF Key Features**  
7. **NF Stats** (glass)  
8. **NF Flavors**  

Header nav (Colors, How it works, Flavors, About, Shop) stayed intentional.

## 4. Preloader polarity (current)

Direction settled on **black outside the letters; white→blue inside glyphs**:

1. Fullscreen `#000` shell  
2. White plate + rising blue water  
3. FIZZ SVG `<img>` stencil with `mix-blend-mode: destination-in` +
   `isolation: isolate` (CSS `mask-image` on near-black PNG-in-SVG glyphs falls
   back to luminance in Safari and punches the wrong holes)  
4. Scale from the I-stem, fade the preloader, reveal the hero  

Timed rAF progress — not scroll-scrubbed. Status `%` stays in the DOM but is
visually hidden. Desktop / mobile transform-origins are measured separately.

## 5. Clip-path hero window

After the loader, a sticky shell uses a growing clip-path “hole” so full-bleed
media reveals copy once the window settles — the NeoLeaf “look through the
brand” beat without WebGL.

## 6. Motion + a11y

- Theme setting `motion_enabled` and `prefers-reduced-motion` skip loader,
  marquees, and heavy scroll effects  
- Theme editor design mode skips the intro loader  
- Page transitions: melt or classic bubbles; liquid color = theme accent or
  custom picker  

## 7. Media discipline

A ~254MB CoreHome lifestyle dump does **not** ship in the theme. Curated
compressed `nf-lifestyle-*.jpg` assets cover defaults; merchants upload more
in the editor.

## 8. Documentation book

README + `docs/` chapters were rewritten for NeoFizz paths, homepage pipeline,
and unpublished deploy IDs so a new developer can rebuild the mental model
without replaying every conversation.

## Lessons worth keeping

1. Prefer **alpha / destination-in** over luminance masks when SVG RGB is near
   black.  
2. Measure transform-origin in the **same space** the stencil uses (desktop vs
   mobile SVGs).  
3. Case-sensitive CDN + case-insensitive macOS = naming traps.  
4. Editor mode must not inherit aggressive preloaders.  
5. One source of truth beats two “almost the same” packages — keep NeoFizz and
   July 14 pushes strictly separate.

Back to the index: [README](../README.md)
