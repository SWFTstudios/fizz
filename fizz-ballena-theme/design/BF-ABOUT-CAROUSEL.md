# BF About Carousel — card sizing + desktop side arrows

Date: 2026-08-17 (sizing); 2026-08-24 (side arrows; wrap-to-first)  
Theme: Ballena Fizz (`fizz-ballena-theme/`) — **no NeoFizz twin** (`bf-about-carousel` only)

## Goal

Give the Explore / About image cards the same Theme Editor size controls as **NF Horizontal Benefits**: width, orientation, aspect ratio, gap, radius, plus per-card overrides.

Desktop: left/right side arrows at the absolute left/right edges of the section (in the pad gutters), plus the bottom pill nav. Mobile: bottom pill only. Reaching the last card resets to the first (delayed auto-reset + next-at-end wrap).

## Docs verified

| Topic | Source |
|-------|--------|
| Section schema (settings, blocks, presets) | https://shopify.dev/docs/storefronts/themes/architecture/sections/section-schema |
| Input settings (`range`, `select`, `checkbox`) | https://shopify.dev/docs/storefronts/themes/architecture/settings/input-settings |
| `visible_if` on block settings | https://shopify.dev/docs/storefronts/themes/architecture/settings/input-settings#visible-if |
| Theme editor section load/unload | https://shopify.dev/docs/storefronts/themes/best-practices/editor/integrate-sections-and-blocks |

## Approach

1. Section defaults: `card_width` (280–720px), `card_orientation` (portrait / landscape / square), `card_ratio` (same options as Horizontal Benefits), `card_gap`, `card_radius`.
2. Orientation remaps the selected ratio so portrait stays taller-than-wide and landscape stays wider-than-tall. Square always `1 / 1`.
3. Per-card **Size override** and **Corners** checkboxes, with `visible_if` on the extra fields.
4. Cards are a flex row with per-card CSS variables (`--bf-about-card-w`, `--bf-about-card-ratio`, `--bf-about-card-radius`) so mixed sizes work. Nav arrows step by measured card width + gap.
5. Defaults (360px, portrait, 4:5, 14px gap, 8px radius) match the previous hard-coded about cards (`560 / 700` and ~⅓-row width).
6. **Desktop side arrows (≥900px):** `.bf-about__side-btn` are section children (`position: absolute; left/right: 0.5rem` on `.bf-section.bf-about`). JS vertically centers them on the card track. Bottom pill stays visible on all breakpoints. Side prev/next hide at scroll start/end.
7. **Wrap to first:** when horizontal scroll reaches the end, after ~500ms the track scrolls back to the first card. Clicking next while already at the end (pill) also scrolls to the start. Prev at start does not wrap to the last card. No clone-based infinite loop.
8. Vertical layout: no side arrows (unchanged).

## Limitations

- Existing Homepage instances pick up schema **defaults** until a merchant saves new values in the editor. Setting ids are additive — no merchant content reset.
- Theme Editor live preview re-renders Liquid; JS re-inits on `shopify:section:load` / `unload`.
- Mobile cards cap at `78vw` so a 720px desktop width still peeks the next slide.
