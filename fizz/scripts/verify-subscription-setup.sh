#!/usr/bin/env bash
set -euo pipefail

STORE="g9rykd-jt.myshopify.com"
PRODUCT_ID="gid://shopify/Product/10229603565853"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

echo "==> Verifying Fizz Charge + NextFil subscription setup on $STORE"

RESULT=$(shopify store execute -s "$STORE" -j -q '
{
  product(id: "'"$PRODUCT_ID"'") {
    title
    handle
    status
    templateSuffix
    variants(first: 1) {
      edges {
        node {
          sku
          price
          showUnitPrice
          unitPriceMeasurement { referenceValue }
        }
      }
    }
    sellingPlanGroups(first: 5) {
      edges { node { id name } }
    }
  }
}')

TITLE=$(echo "$RESULT" | jq -r '.product.title')
SKU=$(echo "$RESULT" | jq -r '.product.variants.edges[0].node.sku')
PRICE=$(echo "$RESULT" | jq -r '.product.variants.edges[0].node.price')
TEMPLATE=$(echo "$RESULT" | jq -r '.product.templateSuffix')
PLAN_COUNT=$(echo "$RESULT" | jq '.product.sellingPlanGroups.edges | length')

PASS=0
FAIL=0

check() {
  local label="$1"
  local ok="$2"
  if [[ "$ok" == "true" ]]; then
    echo "  ✓ $label"
    PASS=$((PASS + 1))
  else
    echo "  ✗ $label"
    FAIL=$((FAIL + 1))
  fi
}

echo ""
echo "Product catalog"
check "Title includes 6-Pack" "$(echo "$TITLE" | grep -qi '6-pack' && echo true || echo false)"
check "SKU is FIZZ-CO2-6PK" "$([[ "$SKU" == "FIZZ-CO2-6PK" ]] && echo true || echo false)"
check "Price is \$10.00" "$([[ "$PRICE" == "10.00" ]] && echo true || echo false)"
check "Template suffix is co2-refill" "$([[ "$TEMPLATE" == "co2-refill" ]] && echo true || echo false)"

echo ""
echo "NextFil / selling plans"
check "Selling plan attached" "$([[ "$PLAN_COUNT" -gt 0 ]] && echo true || echo false)"

echo ""
echo "Theme files"
check "nextfil-app-wrapper.liquid exists" "$([[ -f "$ROOT/fizz/sections/nextfil-app-wrapper.liquid" ]] && echo true || echo false)"
check "account.subscriptions.json exists" "$([[ -f "$ROOT/fizz/templates/customers/account.subscriptions.json" ]] && echo true || echo false)"
check "app-extension.css exists" "$([[ -f "$ROOT/fizz/assets/app-extension.css" ]] && echo true || echo false)"

echo ""
echo "Result: $PASS passed, $FAIL failed"

if [[ "$PLAN_COUNT" -eq 0 ]]; then
  echo ""
  echo "Next step: Complete NextFil selling plan setup:"
  echo "  $ROOT/fizz/docs/nextfil-selling-plan-setup.md"
fi

exit $([[ "$FAIL" -eq 0 ]] && echo 0 || echo 1)
