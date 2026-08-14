# Ballena Fizz theme agent instructions

> Workspace-wide ops: see root [`INSTRUCTIONS.md`](../INSTRUCTIONS.md) and `.cursor/rules/`.

## Active to-dos

- [ ] (none standing — update this list when starting multi-step work)

## Theme

- Store theme: **Ballena Fizz** (**live**) — id `#189175267613`
- Local root: `fizz-ballena-theme/`
- Preview: https://g9rykd-jt.myshopify.com?preview_theme_id=189175267613
- Editor: https://g9rykd-jt.myshopify.com/admin/themes/189175267613/editor
- Inspiration: https://ballenacabo.com/

## Push (this theme only)

- Use content-safe `--only` + `--nodelete`. Do not use `--allow-live` unless targeting a non-live theme and the user asks.
- **Never push to live NeoFizz** (`#189109174557`) from this folder.
- Never push `settings_data.json` / `templates/*.json` / `*-group.json` unless the user explicitly asks to overwrite editor content.
- After a code-only push: merchant refreshes Theme Editor → Add section if new.
- When editing shared `nf-*` twins, also update `fizz-neofizz-theme/` (or say you scoped Ballena-only).
