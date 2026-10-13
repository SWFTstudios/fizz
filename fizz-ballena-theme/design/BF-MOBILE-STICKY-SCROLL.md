# Ballena mobile sticky / intro scroll

Date: 2026-08-18  
Theme: `fizz-ballena-theme/` only (live `#189175267613`). No NeoFizz twin update.

## Recon

Local `templates/index.json` order: `nf-intro` → `nf-marquee` → `bf-about-carousel` → `bf-feature-tabs` → `nf-water-wave` → `fizz-key-features` → `bf-benefits` → `bf-flavors` → `bf-social-carousel`.

Live Theme Editor can also include **BF Flavor Sequence** (not in this JSON).

Lenis is not loaded. Frame sequences are canvas + WebP, not lottie-web.

## 2026-08-18 — pin + lerp scrub restored on phones

Mobile previously **unpinned** both sequences (Key Features below 1099px, Flavor Sequence below 750px). That avoided leftover beige tracks from desktop `margin-top: -100vh` sibling cover, but killed Apple-style scrub.

Storefront now pins both on phones with native `position: sticky` + a tall track. Scrub is rAF-lerped toward scroll progress (`visualViewport.height` when present). Canvas backing store is CSS box × DPR (capped at 3). Hold the last decoded frame if the target WebP is still loading.

| Section | Mobile pin | Cover trick |
| --- | --- | --- |
| Fizz Key Features | Yes, all storefront widths | None |
| BF Flavor Sequence | Yes, simple pin below 750px | Sibling `-100vh` / z-index **desktop only** (`min-width: 750px`) |

Key Features mobile layout: bottle in the top band, glass cards in a merchant-sized bottom band (`mobile_cards_share` 30–50%, `split_gap`). Cards stay `z-index: 5` over the canvas. No nested `overflow-x` / `touch-action: pan-x`. Same smoothed progress drives card `is-in` / `is-active`.

## 2026-08-18 — mobile Apple-picker cards

Key Features phones/tablets (`max-width: 1099px`) no longer accordion-stack cards in the bottom band. The band is a **visual picker wheel**: one focused card in the center, neighbors peek above/below via `translateY` / `scale` / `opacity`.

Page scroll still drives the bottle frames **and** the wheel (float index interpolated between each card’s frame midpoints). There is **no** nested `overflow-y` carousel — that would steal touch from the sticky pin. `touch-action: pan-y` stays on the layer.

Desktop overlay cards (`min-width: 1100px`) are unchanged. Theme Editor / `prefers-reduced-motion`: static poster and card stack, no pin and no wheel ([editor integration](https://shopify.dev/docs/storefronts/themes/best-practices/editor/integrate-sections-and-blocks)).

New Key Features setting ids (existing ids unchanged): `mobile_cards_share`, `split_gap`, `glass_blur`, `card_gradient`, `card_gradient_opacity`. Range min/max/step/default are numeric ([input settings](https://shopify.dev/docs/storefronts/themes/architecture/settings/input-settings)).

## Older pass (2026-08-17)

1. **Intro** — Do not set `bf-loader-active`. Overlay dismisses after hero media ready with a 0.8s floor and **2s cap**.
2. **Feature Tabs** — Mobile `height: auto` + rAF progress.
3. **Water wave** — `z-index: 10`; a seam, not a covering stage.

## Isolation

- No `templates/*.json` / `settings_data.json` edits.
- Flavor Sequence does not write `margin-top` on sibling `.shopify-section`s below 750px.
- `nf-intro.js` divergence from NeoFizz is intentional (Ballena-only).
