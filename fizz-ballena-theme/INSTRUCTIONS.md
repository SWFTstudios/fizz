# Ballena Fizz theme agent instructions

## Active to-dos

- [ ] (none standing — update this list when starting multi-step work)

## Content-safe theme pushes (always)

**Do not reset Theme Editor content when shipping new features.**

Merchant images, copy, padding, and section order live in:

- `config/settings_data.json`
- `templates/**/*.json`
- `sections/*-group.json`

### Rules

1. When adding a new section/feature, push **only** the new/changed code files with `shopify theme push --only … --nodelete`.
2. For an unpublished Ballena Fizz preview theme, push without `--allow-live` unless targeting a non-live theme id.
3. **Never** push `settings_data.json` or template/section-group JSON unless the user explicitly asks to overwrite editor content.
4. Do **not** inject new sections into remote `templates/index.json` unless the user asks — after a code-only push, add sections in the Theme Editor.
5. Prefer section-scoped `stylesheet_tag` / `script_tag` so layout changes are optional.
6. **Do not push to live NeoFizz** (`#189109174557`) from this theme folder.

### Safe push checklist

- [ ] List exact `--only` paths (section + assets)
- [ ] Confirm no `settings_data.json` / `templates/*.json` in the push set (unless user asked)
- [ ] Use `--nodelete`
- [ ] Confirm target theme is Ballena Fizz (unpublished), not live NeoFizz
- [ ] Tell user to refresh editor → Add section → find the new section by name

### Theme

- Store theme: **Ballena Fizz** (unpublished) — id `#189175267613`
- Preview: https://g9rykd-jt.myshopify.com?preview_theme_id=189175267613
- Editor: https://g9rykd-jt.myshopify.com/admin/themes/189175267613/editor
- Local root: `fizz-ballena-theme/`
- Inspiration: https://ballenacabo.com/
- **Never push to live NeoFizz** (`#189109174557`) from this folder.
