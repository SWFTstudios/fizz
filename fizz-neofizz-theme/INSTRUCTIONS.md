# NeoFizz / Fizz theme agent instructions

> Workspace-wide ops: see root [`INSTRUCTIONS.md`](../INSTRUCTIONS.md) and `.cursor/rules/`.

## Active to-dos

- [ ] (none standing — update this list when starting multi-step work)

## Theme

- Store theme: **NeoFizz** (live) — id `#189109174557`
- Local root: `fizz-neofizz-theme/`
- Preview: https://g9rykd-jt.myshopify.com?preview_theme_id=189109174557
- Editor: https://g9rykd-jt.myshopify.com/admin/themes/189109174557/editor

## Push (this theme only)

- Use content-safe `--only` + `--nodelete` + `--allow-live` for code files.
- Never push `settings_data.json` / `templates/*.json` / `*-group.json` unless the user explicitly asks to overwrite editor content.
- After a code-only push: merchant refreshes Theme Editor → Add section if new.
