# Shopify Colorway Presets — Research Report

**Date:** 2026-07-09  
**Scope:** Fizz Claude theme colorway preset system (Phase 1–2)  
**Sources:** Shopify developer docs (verified via Shopify Dev MCP + shopify.dev), May–July 2025–2026

This document records what is **possible**, **impossible**, and **recommended** for the Fizz colorway design system. Future plans must reference this file before proposing architecture.

---

## Executive summary

| Question | Answer | Source |
|----------|--------|--------|
| Can presets change storefront colors without filling every picker? | **Yes** — Liquid resolves `colorway_preset` at render time | `snippets/fizz-theme-tokens.liquid` |
| Do color pickers auto-update when a select changes? | **No** — not without native theme presets or a custom app | [settings_data.json](https://shopify.dev/docs/storefronts/themes/architecture/config/settings-data-json) |
| Can we preload 6 full presets into theme install? | **Partially** — max **5** native theme presets in `settings_data.json` | [settings_data.json — Theme presets](https://shopify.dev/docs/storefronts/themes/architecture/config/settings-data-json) |
| Can we hide irrelevant settings in the editor? | **Yes** — `visible_if` (May 2025) | [Changelog](https://shopify.dev/changelog/conditional-settings-in-the-theme-editor), [Settings](https://shopify.dev/docs/storefronts/themes/architecture/settings) |
| Can Liquid read a JSON preset file at runtime? | **No** — parse JSON in Liquid is not supported; use snippets or metaobjects | Liquid architecture |
| Can metaobjects drive theme colors? | **Yes** on storefront via `metaobjects.type.handle` | [metaobject Liquid object](https://shopify.dev/docs/api/liquid/objects/metaobject) |
| Can a select setting trigger server-side settings writes? | **No** in theme-only code | Theme settings architecture |

---

## Why the editor showed identical colors

Two independent systems were conflated:

1. **`colorway_preset` (select)** — drives Liquid at **storefront render** when custom mode is off.
2. **Color pickers (`colorway_accent`, etc.)** — static theme settings whose schema defaults are Lime Fizz. Shopify does not recompute picker UI from the select.

`visible_if` hides pickers when inactive but does not change their stored values.

---

## Verified Shopify capabilities

### 1. `settings_data.json` theme presets (IMPLEMENTED — Phase 2)

**Docs:** https://shopify.dev/docs/storefronts/themes/architecture/config/settings-data-json

- `presets` object holds up to **5** named theme styles.
- `current` is the active preset name (string) or inline settings object.
- Switching **Theme style** in the editor copies **presentational** settings into `current`.
- Presentational types include: `color`, `select`, `checkbox`, `range`, `font_picker`, etc.

**Implication for Fizz:**  
We ship 5 native theme styles (Lime Fizz → Electric Pool). **Arctic Light** is the 6th preset via `colorway_preset` select + Liquid only (Shopify hard limit).

### 2. `visible_if` conditional settings (IMPLEMENTED — Phase 2)

**Docs:** https://shopify.dev/docs/storefronts/themes/architecture/settings  
**Changelog:** https://shopify.dev/changelog/conditional-settings-in-the-theme-editor (2025-05-21)

```json
{
  "type": "color",
  "id": "colorway_accent",
  "label": "Accent",
  "visible_if": "{{ settings.colorway_custom_enabled }}"
}
```

**Rules:**
- Hides UI only; values remain in `settings` object.
- Cannot reference products, collections, or runtime storefront data.
- Supported on theme, section, and block settings (not resource conditionals in blocks per forum clarification).

### 3. `color_scheme` / `color_scheme_group` (NOT USED)

**Status:** Deprecated for new themes; replaced by `color_palette` (2026).  
**Decision:** Fizz Claude uses custom semantic tokens (`--color-*`), not OS 2.0 scheme groups. No migration needed short-term.

### 4. Metaobjects as dynamic preset source (PHASE 4 — NOT YET)

**Docs:** https://shopify.dev/docs/api/liquid/objects/metaobjects

```liquid
{{ metaobjects.colorway_preset.steel_navy.accent.value }}
```

**Requirements:**
- Merchant creates metaobject definition in admin.
- Theme adds optional `colorway_source` setting (`builtin` | `metaobject`).
- Publishable metaobjects must be `active` to resolve.

**Feasible:** Yes, storefront-only. **Not feasible:** Auto-populate theme settings UI from metaobjects without an app.

### 5. Product metafields for colors (PARTIAL — Colorways section only)

Variant metafields (`custom.swatch_hex`, `custom.scene_bg`, etc.) already power the **Colorways section** bottle scenes.  
Extending to **global theme tokens** requires an explicit merchant toggle and Liquid branch — feasible, not automatic.

---

## Impossible / out of scope (do not suggest without app)

| Proposal | Verdict | Why |
|----------|---------|-----|
| Select changes → auto-write all color pickers | **Impossible** (theme-only) | No theme hook on setting change |
| Dynamic paragraph in schema showing active preset hex | **Impossible** | Paragraph settings are static strings |
| 6 native Shopify theme presets | **Impossible** | Hard limit of 5 in `settings_data.json` |
| Parse `presets.json` in Liquid | **Impossible** | No JSON parse filter |
| `visible_if` on product picker | **Not supported** | Resource settings excluded |

---

## Implementation decisions (Phase 1–2)

| Artifact | Purpose |
|----------|---------|
| `design/colorway-presets/presets.json` | Machine-readable source of truth (6 presets) |
| `design/colorway-presets/*.design.md` | Human design rationale per preset |
| `snippets/fizz-colorway-preset-data.liquid` | Runtime mirror of `presets.json` (pipe-delimited output) |
| `config/settings_data.json` | 5 native theme styles with full color values |
| `settings_schema.json` | `visible_if` on custom + section override pickers |
| `snippets/fizz-theme-tokens.liquid` | Uses preset data snippet; custom mode uses pickers |

---

## Merchant workflow (after Phase 2)

### Option A — Theme style (best editor accuracy, 5 presets)

1. Theme editor → **Theme settings** → change **Theme style** to e.g. Steel Navy.
2. All color pickers update to Steel Navy values.
3. Save.

### Option B — Colorway preset select (all 6 presets)

1. Theme settings → **Colorway design** → **Colorway preset** → e.g. Arctic Light.
2. Storefront updates on save; pickers stay hidden (custom off).
3. Editor pickers do not reflect preset (expected).

### Option C — Custom fine-tune

1. Enable **Use custom colors instead of preset**.
2. Pickers appear; overrides win over preset.

---

## Phase 4 backlog (research-approved)

1. Metaobject definition `colorway_preset` with accent/ink/paper/section fields.
2. Theme setting `colorway_source`: `builtin` | `metaobject` | `product_variant`.
3. Admin setup doc for linking bottle variant metafields to global theme.

---

## Variant product media (storefront runtime)

**Date:** 2026-07-13  
**Scope:** Bottle PDP and collection card variant photo switching

### Research

| Topic | Finding | Source |
|-------|---------|--------|
| Variant-attached image | `variant.image` and `variant.featured_image` return the image assigned to a variant in Admin; `variant.featured_media` returns attached media | [Liquid variant object](https://shopify.dev/docs/api/liquid/objects/variant) |
| Responsive rendering | Use `image_url` + `image_tag` (or manual `<img src="{{ variant.image \| image_url: width: 900 }}">`) | [Liquid image object](https://shopify.dev/docs/api/liquid/objects/image), [Support product media](https://shopify.dev/docs/storefronts/themes/product-merchandising/media/support-media) |
| Admin vs storefront | Merchants assign per-variant images in Admin; theme Liquid/JS only reads and switches them at render time | Theme architecture |

### Runtime vs editor

| Layer | Responsibility |
|-------|----------------|
| **Shopify Admin** | Assign featured image/media to each bottle color variant |
| **Liquid (`fizz-bottle-product-img`)** | Render `variant.image` first; fall back to `fizz-bottle-product-{slug}.png` theme asset |
| **JavaScript (`fizz-claude.js`)** | On swatch click, set `[data-way-photo].src` from swatch `data-image`; reset lifestyle thumbnail overlay |
| **Theme editor** | Cannot attach variant images; only controls section settings |

### Implementation artifacts

| File | Role |
|------|------|
| `snippets/fizz-color-slug.liquid` | Maps variant title/metafield → canonical bottle slug |
| `snippets/fizz-bottle-product-img.liquid` | Variant-image-first render + `data-way-photo` hook |
| `sections/fizz-claude-product.liquid` | Swatch `data-image` uses variant image URL when present |
| `assets/fizz-claude.js` | `applySwatch()` updates photo, backdrop, URL, clears thumb overlay |

### Limitations

- Theme code cannot create or attach variant images in Admin.
- Fallback PNGs (`fizz-bottle-product-*.png`) must exist in deployed theme assets when variants lack Admin images.
- Collection card swatches remain decorative (non-interactive) by design.

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| 2026-07-09 | Cursor agent | Initial research report; Phase 2 implementation |
| 2026-07-13 | Cursor agent | Variant product media research + implementation notes |
