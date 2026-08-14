# NF Intro — placement, per-slide copy, pill buttons

Theme: Ballena Fizz (`fizz-ballena-theme/`)  
Section: `sections/nf-intro.liquid`

## Docs verified

| Topic | Source |
|-------|--------|
| Theme settings (`settings_schema.json`) | https://shopify.dev/docs/storefronts/themes/architecture/config/settings-schema-json |
| Section schema / blocks | https://shopify.dev/docs/storefronts/themes/architecture/sections/section-schema |
| Input settings (`select`, `color`, `range`, `url`, `text`) | https://shopify.dev/docs/storefronts/themes/architecture/settings/input-settings |
| Distinguishing editor settings vs storefront Liquid | Theme settings are editor UI; Liquid emits classes/CSS vars at render — no JSON parse in Liquid |

## Approach

- **Content block placement:** one stack (eyebrow + heading + body + CTA). Desktop Left/Center/Right + Top/Middle/Bottom; mobile selects use `inherit` (“Same as desktop”), resolved in Liquid before class output — same pattern as `nf-hero`.
- **Per-element styling:** text-align, color, font size (mobile size `0` = same as desktop). Button fill/text colors on the section CTA.
- **Per-slide copy:** optional block fields; if any text/link is set, that slide renders its own overlay (blank fields fall back to section defaults). Position selects on the block default to `inherit` (use section placement).
- **Site-wide pill buttons:** `button_corner_style` → `--nf-btn-radius` (sharp `0` / rounded `12px` / pill `999px`). Default pill.

## Limitations

- Per-element independent Top/Middle/Bottom (four floating boxes) is not supported — stacked hero layout only.
- New schema keys get defaults on existing section instances without wiping slide media; merchants must open settings to tune placement/type.
- Content-safe push: code files only (`--only` + `--nodelete`). Do not push `settings_data.json` / templates unless asked to overwrite editor content.

## Content-safe push (Ballena Fizz preview)

```bash
cd fizz-ballena-theme
shopify theme push --theme 189175267613 --nodelete \
  --only sections/nf-intro.liquid \
  --only snippets/nf-intro-copy.liquid \
  --only snippets/nf-theme-tokens.liquid \
  --only assets/nf-base.css \
  --only assets/nf-intro.js \
  --only config/settings_schema.json
```

Then refresh Theme Editor → NF Intro → Placement / Typography / Button style; optional per-slide copy on Media slide blocks. Theme settings → Buttons → Button corners (default Pill).
