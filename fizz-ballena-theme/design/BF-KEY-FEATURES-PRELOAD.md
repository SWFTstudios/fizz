# Ballena Key Features — first-scrub preload

Date: 2026-08-18  
Theme: `fizz-ballena-theme/` only (live `#189175267613`). NeoFizz `fizz-key-features.js` is a divergent older copy; not mirrored.

## Cause

The “Lottie” Key Benefits pin is **canvas + 121 WebP frames**, not `lottie-web` ([BF-MOBILE-STICKY-SCROLL.md](BF-MOBILE-STICKY-SCROLL.md)).

First scrub hitch / second-pass smoothness came from the loader, not from GSAP:

1. Init only fetched **center ± 6** frames (`preloadAround(frame, 6)`).
2. Scrub lookahead stayed **±8–24** at **4** concurrent downloads.
3. IntersectionObserver `rootMargin: 120px` started extra loads only at the pin.
4. `drawFrame` skipped paint when `images[index]` was missing (no neighbor hold).
5. `is-ready` hid the poster at init, before a decoded frame existed.

After one full pass, frames were in HTTP/memory cache → smooth.

Desktop `fizz-kf-d-*.webp` ≈ **11 MB**; mobile `fizz-kf-m-*` ≈ **13 MB**. Only the active breakpoint is loaded.

## What we changed

| File | Change |
| --- | --- |
| [assets/fizz-key-features.js](../assets/fizz-key-features.js) | `preloadAll()` playhead-first, 8 concurrent, approach IO `200%`, idle/`#features` kick after intro, decode window ±24, nearest-frame hold, poster until first paint |
| [assets/bf-flavor-sequence.js](../assets/bf-flavor-sequence.js) | Same loader (section can be on the live homepage even when absent from local `templates/index.json`) |

Full download waits until the glyph intro is done (`[data-nf-preloader].is-done`, `data-nf-intro-done`, or `nf:intro:done`) so LCP is not competing with 8 WebP streams.

## Shopify constraints (do not “fix” with `<link rel="preload">`)

- Storefront sends **at most 10** preload Link headers; extras are dropped. Image preloads sort last. Docs warn against preloading more than ~two resources.  
  [Use preload resource hints sparingly](https://shopify.dev/docs/storefronts/themes/best-practices/performance/use-preload-resource-hints-sparingly)
- Section JS stays `defer`.  
  [Defer non-critical resources](https://shopify.dev/docs/storefronts/themes/best-practices/performance/defer-non-critical-resources)
- Theme Editor / `request.design_mode`: empty frame manifests + poster only.  
  [Integrate sections and blocks](https://shopify.dev/docs/storefronts/themes/best-practices/editor/integrate-sections-and-blocks)  
  [`request.design_mode`](https://shopify.dev/docs/api/liquid/objects/request#request-design_mode)

## Limitation

Smooth first scrub still needs the sequence **downloaded** before the pin. On a slow radio, 11–13 MB may not finish even with a 2-viewport head start. Neighbor hold avoids a blank/jumpy canvas; frames can still skip until the queue catches up. Recompressing WebPs is out of this pass.

## Verify (after a content-safe JS push)

1. Hard refresh homepage (disable cache). First scroll through Key Features should stay on-frame.
2. Network: `fizz-kf-d-*` (desktop) or `fizz-kf-m-*` (mobile) starts while still in earlier sections, **after** the intro overlay is gone.
3. Hero LCP / glyph loader must not wait on the sequence.
4. Theme Editor: static poster, no 121 downloads.
5. Push JS only: `--only assets/fizz-key-features.js --only assets/bf-flavor-sequence.js --nodelete`. Live `#189175267613` only when explicitly asked (`--allow-live`).
