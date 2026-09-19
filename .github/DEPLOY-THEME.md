# Deploy July 14th theme on merge to `main`

This repo uses GitHub Actions to push [`fizz-july-14th-theme`](../fizz-july-14th-theme) to Shopify whenever `main` updates that theme path.

## Workflow

- File: [`.github/workflows/deploy-theme.yml`](../.github/workflows/deploy-theme.yml)
- Triggers: `push` to `main` (path-filtered) and **workflow_dispatch**
- Command roughly: `shopify theme push --path fizz-july-14th-theme --allow-live --nodelete`

## One-time GitHub setup

1. In Shopify admin, install **Theme Access** (or create a Theme Access password).
2. In the GitHub repo → **Settings → Secrets and variables → Actions**:
   - Secret **`SHOPIFY_CLI_THEME_TOKEN`** = Theme Access password (`shptka_…`)
   - Optional variable **`SHOPIFY_STORE`** = `g9rykd-jt.myshopify.com`
   - Optional variable **`SHOPIFY_THEME_ID`** = live theme id (default `188630794525`)
3. Merge a PR that changes `fizz-july-14th-theme/**` (or run the workflow manually) and confirm the Action succeeds.

## Cursor / agent note

See [`.cursor/rules/deploy-theme-on-main.mdc`](../.cursor/rules/deploy-theme-on-main.mdc): agents should rely on this CI path after merges to `main` instead of ad-hoc live pushes.
