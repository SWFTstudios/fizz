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

You should see **July 14th Custom Design** (`188630794525`) among themes. If
listing fails with permission errors, see
[Chapter 11](11-troubleshooting.md).

## 2. Clone and enter the theme

```sh
git clone https://github.com/SWFTstudios/fizz.git
cd fizz/fizz-july-14th-theme
```

Shopify CLI theme commands require the standard theme directory shape
(`assets/`, `config/`, `layout/`, `locales/`, `sections/`, `snippets/`,
`templates/`). This package already matches that structure.
([CLI docs](https://shopify.dev/docs/storefronts/themes/tools/cli))

## 3. Verify the theme locally

```sh
shopify theme check --path .
```

Expect zero offenses. Theme Check is Shopify’s Liquid/JSON linter.
([Theme Check](https://shopify.dev/docs/storefronts/themes/tools/theme-check))

## 4. Preview the intro without CLI

```sh
python3 -m http.server 4173
```

Open `http://localhost:4173/preview/intro-mask-flythrough.html`. This uses the
real mask SVGs under `assets/` and a CDN build of GSAP. It is **not** the full
theme — only the fly-through technique.

## 5. Push a smoke change (optional)

Prefer targeted pushes while learning:

```sh
shopify theme push \
  --path . \
  --store g9rykd-jt.myshopify.com \
  --theme 188630794525 \
  --allow-live \
  --only sections/j14-intro.liquid
```

`--allow-live` is required when the target theme is the published theme.
([theme push](https://shopify.dev/docs/api/shopify-cli/theme/theme-push))

## 6. Bootstrap metafields (once)

```sh
./scripts/setup-warp-metafields.sh
```

Creates Product + ProductVariant definitions for warp media and scene colors.
Safe to re-run; existing definitions report “already exists”.

## Checklist before Chapter 02

- [ ] `theme check` passes
- [ ] You can open the live storefront in a browser
- [ ] You know the theme ID `188630794525`
- [ ] Isolated preview loads masks without 404s

Next: [Chapter 02 — Theme architecture](02-theme-architecture.md)
