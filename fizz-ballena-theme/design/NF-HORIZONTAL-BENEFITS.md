# NF Horizontal Benefits — research

Date: 2026-08-12  
Theme: Ballena Fizz (`fizz-ballena-theme/`)

## Goal

Webflow-style vertical→horizontal scroll section for benefit cards with Theme Editor controls for background image, width, orientation, and aspect ratio.

## Docs verified

| Topic | Source |
|-------|--------|
| Section schema (settings, blocks, presets) | https://shopify.dev/docs/storefronts/themes/architecture/sections/section-schema |
| Input settings (`image_picker`, `range`, `select`) | https://shopify.dev/docs/storefronts/themes/architecture/settings/input-settings |
| Webflow horizontal scrolling (sticky track + rail) | https://help.webflow.com/hc/en-us/articles/33961273565843-Horizontal-scrolling |

## Approach

1. Tall track + sticky `100dvh` stage (same runway idea as `fizz-key-features` / `nf-how-sticky`).
2. Flex row of cards; JS maps `trackProgress()` to `translate3d(-maxX * p, 0, 0)`.
3. Native rAF scrub — **no GSAP ScrollTrigger pin** (avoids fighting adjacent sticky sections + Lenis).
4. Mobile `<750px`, `prefers-reduced-motion`, and no-JS: stack / wrap; clear inline height and transform.
5. Section defaults for width / orientation / ratio; per-card override via checkbox.
6. Section-scoped CSS/JS only — content-safe push with `--only` + `--nodelete`.

## Limitations

- Liquid cannot measure overflow; runway height requires JS after layout/images load.
- Theme Editor may need section reload after large image swaps for accurate runway (handlers listen to `shopify:section:load` / reorder / block select + image `load`).
- `scroll_speed` (60–200%) multiplies horizontal overflow into vertical runway; it does not change card layout.
- Do not push `settings_data.json` or templates unless the merchant asks to overwrite editor content.
