# Chapter 11 — Troubleshooting

## CLI / permissions

### `theme list` or `theme dev` fails with missing scopes

**Symptom:** errors mentioning `read_themes`, `themeCreate`, or inability to
create a development theme.

**Fix:** Use an explicit theme ID with `theme push --theme 188630794525
--allow-live`. Re-auth with broader Theme Access if your org requires it.
Isolated preview does not need CLI.

### Pushing the wrong package

**Symptom:** storefront reverts to Stone Sip / dark hero or unrelated chrome.

**Fix:** Confirm `--path fizz-july-14th-theme`. Never push `fizz/` for July 14.

## Intro mask

### Side gutters of hero visible around the logo

**Cause:** `mask-size: contain` on a wide viewport.

**Fix:** Desktop uses `cover` (≥750px). Confirm CSS was pushed.

### Mask inverted (black letters / wrong holes)

**Cause:** luminance masking on near-black opaque pixels.

**Fix:** Keep `mask-mode: alpha` and `-webkit-mask-source-type: alpha`.

### Fly-through misses the I

**Cause:** new SVG with different I position; origins still old.

**Fix:** Re-measure stem; update CSS + `getMaskMetrics()` in `j14-intro.js`.
See [Chapter 05](05-intro-flythrough.md).

### Mobile still shows desktop mask

**Cause:** filename casing mismatch or CSS media query not deployed.

**Fix:** Liquid must reference `Fizz_Logo_INTRO_SVG_Mobile.svg` exactly.
Shopify CDN is case-sensitive; macOS may hide local collisions.

### Auto-scroll never cancels

**Cause:** listeners not attached or animated via non-window scroll.

**Fix:** Ensure `j14-intro.js` is loaded; cancel events are on `window`.

### Auto-scroll fights the merchant in the editor

Expected: auto-scroll is disabled when `Shopify.designMode` is true.

## Assets / cache

### Changes not visible after push

Hard-refresh, try an incognito window, or append a cache-buster query. Confirm
the push targeted theme `188630794525`.

### 404 on mask URL

Asset missing from remote theme or wrong case. Push the SVG with `--only`.

## Colorways

### Scene colors wrong

Check variant metafields vs slug fallback. Empty metafields fall through to
Liquid maps.

### `scroll_height_per_colorway` seems ignored

Known gap — setting is reserved; carousel is still scroll-snap. See
[Chapter 07](07-colorways-metafields.md).

## Motion

### Nothing animates

Theme settings → Enable scroll animations; OS reduced-motion setting; check
console for GSAP load errors.

### Melt transition looks like waves

Use **melt** style (not classic) and current `j14-page-transition.js`. Classic
is the older swipe/fizz burst.

Next: [Chapter 12 — File reference](12-file-reference.md)
