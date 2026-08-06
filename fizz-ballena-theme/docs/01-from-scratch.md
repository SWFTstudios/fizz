# Chapter 01 — From scratch

Build a working local + remote loop before you edit design.

## Prerequisites

- Node.js (for Shopify CLI)
- [Shopify CLI](https://shopify.dev/docs/api/shopify-cli) with theme commands
- Access to the Fizz development store: `g9rykd-jt.myshopify.com`
- Git access to `https://github.com/SWFTstudios/fizz.git`
- A code editor (Cursor / VS Code) with optional Shopify Liquid extension

## 1. Authenticate

```sh
shopify auth login --store g9rykd-jt.myshopify.com
```

Confirm the active store:

```sh
shopify theme list --store g9rykd-jt.myshopify.com
```

You should see **NeoFizz** among unpublished themes (and **July 14th Custom
Design** as live). If listing fails with permission errors, see
[Chapter 11](11-troubleshooting.md).

## 2. Clone and enter the theme

```sh
git clone https://github.com/SWFTstudios/fizz.git
cd fizz
git checkout neofizz
```

Shopify CLI theme commands require the standard theme directory shape
(`assets/`, `config/`, `layout/`, `locales/`, `sections/`, `snippets/`,
`templates/`). NeoFizz lives at `fizz-neofizz-theme/` and already matches that
structure.
([CLI docs](https://shopify.dev/docs/storefronts/themes/tools/cli))

## 3. Verify the theme locally

```sh
shopify theme check --path fizz-neofizz-theme
```

Expect zero offenses. Theme Check is Shopify’s Liquid/JSON linter.
([Theme Check](https://shopify.dev/docs/storefronts/themes/tools/theme-check))

## 4. Push as unpublished (recommended)

```sh
shopify theme push \
  --path fizz-neofizz-theme \
  --store g9rykd-jt.myshopify.com \
  --unpublished \
  --theme "NeoFizz"
```

Or update an existing unpublished NeoFizz theme by ID:

```sh
shopify theme push \
  --path fizz-neofizz-theme \
  --store g9rykd-jt.myshopify.com \
  --theme 189109174557
```

Never push this path over the live July 14 theme.
([theme push](https://shopify.dev/docs/api/shopify-cli/theme/theme-push))

## 5. Bootstrap metafields (once)

```sh
./fizz-neofizz-theme/scripts/setup-warp-metafields.sh
```

Creates Product + ProductVariant definitions for warp media and scene colors.
Safe to re-run; existing definitions report “already exists”.

## Checklist before Chapter 02

- [ ] `theme check` passes on `fizz-neofizz-theme`
- [ ] You can open a NeoFizz preview URL in a browser
- [ ] You know the unpublished NeoFizz theme ID
- [ ] You are on the `neofizz` git branch for edits

Next: [Chapter 02 — Theme architecture](02-theme-architecture.md)
