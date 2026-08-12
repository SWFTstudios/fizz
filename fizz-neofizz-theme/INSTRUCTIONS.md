# NeoFizz / Fizz theme agent instructions

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
2. For the live NeoFizz theme, include `--allow-live` and target theme id `189109174557` (or `--theme live` if that resolves correctly).
3. **Never** push `settings_data.json` or template/section-group JSON unless the user explicitly asks to overwrite editor content.
4. Do **not** inject the new section into `templates/index.json` locally and push it — that overwrites homepage content. After a code-only push, the merchant adds the section in the Theme Editor.
5. Prefer section-scoped `stylesheet_tag` / `script_tag` so layout changes are optional.

### Safe push checklist

- [ ] List exact `--only` paths (section + assets)
- [ ] Confirm no `settings_data.json` / `templates/*.json` in the push set
- [ ] Use `--nodelete`
- [ ] Confirm live theme before `--allow-live`
- [ ] Tell user to refresh editor → Add section → find the new section by name

### Live theme

- Store theme: **NeoFizz** (live) — id `#189109174557`
- Local root: `fizz-neofizz-theme/`
