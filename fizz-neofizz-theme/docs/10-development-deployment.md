# Chapter 10 — Development & deployment

## Golden rules

1. **Only push** `fizz-neofizz-theme/` for NeoFizz.  
2. Prefer **unpublished** themes — never overwrite live July 14.  
3. Prefer **targeted** `--only` pushes when iterating.  
4. Run **Theme Check** before every push.  
5. Never commit secrets or auth tokens.  

## Local validation

```sh
# From repo root
shopify theme check --path fizz-neofizz-theme
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
2. `theme push --unpublished` (or `--theme <id>`) to an unpublished copy  
3. Use the admin preview / editor links from the JSON push output  

## Push recipes

### New unpublished theme

```sh
shopify theme push \
  --path fizz-neofizz-theme \
  --store g9rykd-jt.myshopify.com \
  --unpublished \
  --theme "NeoFizz"
```

### Update existing unpublished NeoFizz

```sh
shopify theme push \
  --path fizz-neofizz-theme \
  --store g9rykd-jt.myshopify.com \
  --theme 189109174557
```

### Hero / preloader-only iteration

```sh
shopify theme push \
  --path fizz-neofizz-theme \
  --store g9rykd-jt.myshopify.com \
  --theme 189109174557 \
  --only sections/nf-hero.liquid \
  --only assets/nf-hero.js \
  --only assets/nf-neofizz.css \
  --only assets/Fizz_Logo_Intro.svg \
  --only assets/Fizz_Logo_INTRO_SVG_Mobile.svg
```

## Git workflow

```sh
git checkout neofizz
# ...edit fizz-neofizz-theme only...
git add fizz-neofizz-theme
git commit -m "Describe the change"
git push -u origin neofizz
gh pr create --base main --head neofizz
```

Do **not** stage sibling July 14 / Claude / `fizz/` experiment files in the
same PR unless you intend to ship those packages.

## Rollback

1. Theme admin → duplicate the last known-good theme, **or**  
2. `git revert` / checkout previous commit and `theme push` again, **or**  
3. Shopify admin → Themes → publish a prior duplicate  

Keep an unpublished backup theme before risky full pushes.

## Environments

| Target | ID | Use |
| --- | --- | --- |
| NeoFizz (unpublished) | `189109174557` | Theme library preview / editor |
| Live July 14 | `188630794525` | **Do not push NeoFizz here** |

Next: [Chapter 11 — Troubleshooting](11-troubleshooting.md)
