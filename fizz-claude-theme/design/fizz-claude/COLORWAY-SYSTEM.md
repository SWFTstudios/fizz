# Fizz Claude Colorway Design System

Global design tokens for the Fizz Claude theme. Merchants configure palettes from **Theme settings → Colorway design** (standalone) or **Fizz Claude colorway design** (integrated `fizz/` theme).

## Architecture

```
Theme editor (preset / custom / typography)
        ↓
snippets/fizz-theme-tokens.liquid
        ↓
:root CSS variables (--color-*, --font-*, section tokens)
        ↓
assets/fizz-base.css + sections
```

Legacy aliases `--acc`, `--ink`, `--paper` map to semantic tokens for backward compatibility with `fizz.js`.

## Preset palettes

| Preset | Color theory | Accent | Ink | Paper |
|--------|-------------|--------|-----|-------|
| **Lime Fizz** (default) | High-contrast brand | `#c6f24e` | `#080a0d` | `#f2efe7` |
| **Steel Navy** | Monochromatic cool | `#6b9fd4` | `#0f1a2e` | `#e8edf5` |
| **Citrus Burst** | Warm analogous | `#f07a2e` | `#1a0f08` | `#f5ebe0` |
| **Berry Night** | Complement of lime | `#c86bff` | `#120818` | `#f0e8f5` |
| **Electric Pool** | Triadic blue-forward | `#2f6fd6` | `#061018` | `#e6f0fa` |
| **Arctic Light** | Inverted light mode | `#9ed12f` | `#f2efe7` | `#080a0d` |

Presets apply when **Use custom colors** is off. Enable custom mode to override individual tokens.

**Research & platform limits:** [design/colorway-presets/SHOPIFY-COLORWAY-RESEARCH.md](../colorway-presets/SHOPIFY-COLORWAY-RESEARCH.md)  
**Preset registry:** [design/colorway-presets/presets.json](../colorway-presets/presets.json)

## Semantic tokens

| CSS variable | Role |
|--------------|------|
| `--color-accent` | CTAs, eyebrows, strokes, swatch rings |
| `--color-accent-contrast` | Text on accent buttons (auto from brightness) |
| `--color-ink` | Dark brand / body background |
| `--color-paper` | Light text / inverted surfaces |
| `--color-surface` | Body background (= ink) |
| `--color-on-surface` | Body text (= paper) |
| `--color-on-surface-muted` | Hints, meta (paper @ 65%) |
| `--color-surface-elevated` | Cards, PDP stage (ink + 8% lighten) |
| `--color-border` | Marquee, dividers (paper @ 16%) |
| `--color-outline-stroke` | Hero outline text |
| `--color-link-hover` | Nav/link hover |

## Section surface tokens

| Section | Variables | Default mapping |
|---------|-----------|-----------------|
| Hero | `--hero-bg`, `--hero-text`, `--hero-accent`, `--hero-bubble-color` | ink / paper / accent |
| Statement | `--statement-bg`, `--statement-text` | paper / ink (inverted band) |
| How | `--how-bg`, `--how-text`, `--how-step-stroke`, `--how-bubble-color` | ink / paper / accent |
| Footer | `--footer-bg`, `--footer-text`, `--footer-stroke`, `--footer-bubble-color` | ink / paper / accent |
| PDP | `--pdp-stage-bg`, `--pdp-text` | elevated / paper |
| Colorways | Per-section bg picker; swatch rings use `--ways-accent` or `--color-accent` |

Each section group has a **Use global colorway** checkbox in theme settings. Uncheck to use the section-specific color pickers in the same group.

## Typography tokens

| Variable | Role |
|----------|------|
| `--font-display` | Anton (hero, footer giant type) |
| `--font-body` | Archivo (paragraphs, UI) |
| `--font-accent` | Bodoni Moda italic (statement, flavor names) |
| `--font-label` | JetBrains Mono (eyebrows, crumbs) |
| `--typo-hero-scale` | Hero display size multiplier (80–120%) |
| `--typo-body-size` | Base body size (14–18px) |
| `--typo-label-spacing` | Label letter-spacing |

## CTA tokens

| Variable | Role |
|----------|------|
| `--btn-primary-bg` / `--btn-primary-text` | Solid CTAs (`.bigcta`, `.fbtn--solid`) |
| `--btn-outline-border` / `--btn-outline-text` | Outline buttons |
| `--btn-radius` | Pill (`999px`) or rounded (`12px`) |
| `--btn-hover-scale` | Hover transform on `.bigcta` |

## Merchant workflow

1. Pick a **Colorway preset** and preview the homepage.
2. Fine-tune with **Use custom colors** for accent, ink, paper, borders, and CTAs.
3. Override individual sections by unchecking **Use global colorway** for that section.
4. Adjust typography and button radius under the same settings group.
5. Optionally enable **Sync nav tint to colorway ink** under Navigation.

## Contrast guidance

- Accent on ink: Lime Fizz and Electric Pool pass for large display type; verify small text.
- Paper statement band: ink-on-paper provides strong contrast in all presets except Arctic Light (review inverted mode).
- Button contrast: leave **Accent contrast** blank for auto (ink on light accent, paper on dark).

## Files

| File | Purpose |
|------|---------|
| `snippets/fizz-theme-tokens.liquid` | Token resolution and `{% style %}` output |
| `config/settings_schema.json` | Colorway design theme settings |
| `assets/fizz-base.css` | Semantic token consumption |
| `layout/theme.liquid` | Renders token snippet in `<head>` |

Integrated mirror: `fizz/snippets/fizz-claude-theme-tokens.liquid`, `fizz/assets/fizz-claude-base.css`, `fizz_claude_*` setting IDs.
