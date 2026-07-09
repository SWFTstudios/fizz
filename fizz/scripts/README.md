# Create Fizz Charge selling plan via Admin API

Run this **after** re-authenticating Shopify CLI with `write_purchase_options` scope, **or** complete setup in NextFil admin (recommended).

## Recommended: NextFil admin

See [nextfil-selling-plan-setup.md](./nextfil-selling-plan-setup.md)

## Alternative: GraphQL (ad hoc / 100-year interval)

```bash
shopify store execute -s g9rykd-jt.myshopify.com --allow-mutations -j \
  --query-file fizz/scripts/create-selling-plan.graphql \
  --variable-file fizz/scripts/create-selling-plan.vars.json
```

Requires scopes: `write_products`, `write_purchase_options`
