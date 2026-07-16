# Chapter 10 — Development & deployment

## Golden rules

1. **Only push** `fizz-july-14th-theme/` for July 14 production.  
2. Prefer **targeted** `--only` pushes when iterating.  
3. Run **Theme Check** before every push.  
4. Never commit secrets or auth tokens.  

## Local validation

```sh
# From repo root
shopify theme check --path fizz-july-14th-theme

# Isolated intro lab
cd fizz-july-14th-theme && python3 -m http.server 4173
```

## Shopify CLI constraints

Theme commands require the standard theme folder structure.
([CLI](https://shopify.dev/docs/storefronts/themes/tools/cli))

`.shopifyignore` in this package excludes `docs/`, `design/`, `preview/`,
`scripts/`, and `*.md` from broad push/pull noise.

### `theme dev` caveat

On some accounts `shopify theme dev` fails with missing `read_themes` /
`themeCreate` permissions even when push to a known theme ID works. Verified
workaround:

1. Theme Check locally  
2. Isolated HTML preview for intro  
3. `theme push --theme 188630794525 --allow-live`  

## Push recipes

### Full theme (careful)

```sh
shopify theme push \
  --path fizz-july-14th-theme \
  --store g9rykd-jt.myshopify.com \
  --theme 188630794525 \
  --allow-live
```

### Intro-only iteration

```sh
shopify theme push \
  --path fizz-july-14th-theme \
  --store g9rykd-jt.myshopify.com \
  --theme 188630794525 \
  --allow-live \
  --only sections/j14-intro.liquid \
  --only assets/j14-base.css \
  --only assets/j14-intro.js \
  --only assets/Fizz_Logo_Intro.svg \
  --only assets/Fizz_Logo_INTRO_SVG_Mobile.svg
```

## Git workflow

```sh
git checkout july-14-custom-design
# ...edit fizz-july-14th-theme only...
git add fizz-july-14th-theme
git commit -m "Describe the change"
git push -u origin july-14-custom-design
gh pr create --base main --head july-14-custom-design
```

Do **not** stage sibling `fizz/` experiment files in the same PR unless you
intend to ship that alternate package.

## Rollback

1. Theme admin → duplicate the last known-good theme, **or**  
2. `git revert` / checkout previous commit and `theme push` again, **or**  
3. Shopify admin → Themes → publish a prior duplicate  

Keep a unpublished backup theme before risky full pushes.

## Environments

| Target | ID | Use |
| --- | --- | --- |
| Live July 14 | `188630794525` | Production storefront |
| Unpublished copy | (create as needed) | Risky experiments |

Next: [Chapter 11 — Troubleshooting](11-troubleshooting.md)
