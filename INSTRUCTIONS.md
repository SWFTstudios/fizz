# Shopify workspace — agent instructions

## Session startup

1. Read this file and the **active theme’s** `INSTRUCTIONS.md` (theme-specific ids/URLs).
2. Confirm which theme folder you will edit before changing files or running `shopify theme push`.
3. Ask: **What would you like to work on?** Do not make changes until the user confirms the task (unless they already gave a clear task in the same message).

## Theme map

| Folder | Role | Notes |
| --- | --- | --- |
| `fizz-neofizz-theme/` | NeoFizz (unpublished) | Theme id `#189109174557`. See `fizz-neofizz-theme/INSTRUCTIONS.md`. |
| `fizz-ballena-theme/` | **Live storefront** — Ballena Fizz | Theme id `#189175267613`. |
| `fizz-july-14th-theme/` | July 14 design experiment | Prefixed `j14-*`. Treat as separate product line. |
| `fizz-claude-theme/` | Claude/design experiments | Research often lives under `design/`. |
| `fizz/` | Legacy / archive material | Prefer active themes above unless user names this folder. |

## Always-on Cursor rules (workspace root)

- `.cursor/rules/shopify-content-safe-push.mdc` — never overwrite Theme Editor content unless asked
- `.cursor/rules/shopify-research-backed.mdc` — verify against Shopify docs before architecture plans
- `.cursor/rules/shopify-workspace-ops.mdc` — multi-theme ops, namespacing, isolation
- `.cursor/rules/shopify-no-redundant-sections.mdc` — search before scaffolding; mirror twins
- `.cursor/rules/shopify-nf-section-patterns.mdc` — patterns for `nf-*` sections/assets (glob)

## Active to-dos (cross-theme)

- [ ] (none standing — update when starting multi-step work)
