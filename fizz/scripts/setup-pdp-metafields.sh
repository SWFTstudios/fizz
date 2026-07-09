#!/usr/bin/env bash
set -euo pipefail
STORE="g9rykd-jt.myshopify.com"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

run_mutation() {
  local name="$1"
  local query="$2"
  echo "==> $name"
  shopify store execute -s "$STORE" -j --allow-mutations -q "$query" 2>&1 | tail -5
}

define_product_metafield() {
  local key="$1"
  local type="$2"
  local label="$3"
  run_mutation "Define product.$key" "
    mutation {
      metafieldDefinitionCreate(definition: {
        name: \"$label\"
        namespace: \"custom\"
        key: \"$key\"
        type: \"$type\"
        ownerType: PRODUCT
      }) {
        createdDefinition { id key }
        userErrors { message }
      }
    }"
}

define_variant_metafield() {
  local key="$1"
  local type="$2"
  local label="$3"
  run_mutation "Define variant.$key" "
    mutation {
      metafieldDefinitionCreate(definition: {
        name: \"$label\"
        namespace: \"custom\"
        key: \"$key\"
        type: \"$type\"
        ownerType: PRODUCTVARIANT
      }) {
        createdDefinition { id key }
        userErrors { message }
      }
    }"
}

echo "=== Creating PDP metafield definitions ==="
define_product_metafield "pdp_tagline" "single_line_text_field" "PDP tagline"
define_product_metafield "how_to_use" "multi_line_text_field" "How to use"
define_product_metafield "care_instructions" "multi_line_text_field" "Care instructions"
define_product_metafield "warranty_note" "multi_line_text_field" "Warranty note"
define_product_metafield "pairs_with_heading" "single_line_text_field" "Pairs with heading"
define_product_metafield "pairs_with_products" "list.product_reference" "Pairs with products"
define_product_metafield "also_like_collection" "collection_reference" "Also like collection"

define_variant_metafield "color_slug" "single_line_text_field" "Color slug"
define_variant_metafield "pack_slug" "single_line_text_field" "Pack slug"
define_variant_metafield "lifestyle_caption" "single_line_text_field" "Lifestyle caption"
define_variant_metafield "variant_story" "multi_line_text_field" "Variant story"

echo "=== Assigning product templates ==="
shopify store execute -s "$STORE" -j --allow-mutations -q '
mutation {
  b: productUpdate(input: { id: "gid://shopify/Product/10216978874653", templateSuffix: "bottle" }) {
    product { templateSuffix } userErrors { message }
  }
  o: productUpdate(input: { id: "gid://shopify/Product/10229603369245", templateSuffix: "flavor-pack" }) {
    product { templateSuffix } userErrors { message }
  }
  l: productUpdate(input: { id: "gid://shopify/Product/10229603467549", templateSuffix: "flavor-pack" }) {
    product { templateSuffix } userErrors { message }
  }
  r: productUpdate(input: { id: "gid://shopify/Product/10229603533085", templateSuffix: "flavor-pack" }) {
    product { templateSuffix } userErrors { message }
  }
}' 2>&1 | tail -8

echo "=== Seeding product metafields ==="
shopify store execute -s "$STORE" -j --allow-mutations -q '
mutation {
  bottle: productUpdate(input: {
    id: "gid://shopify/Product/10216978874653"
    metafields: [
      { namespace: "custom", key: "pdp_tagline", value: "Portable sparkling water — your color, your fizz." }
      { namespace: "custom", key: "how_to_use", value: "Fill to the line with cold water. Insert a Fizz Charge cartridge. Shake gently and enjoy. Add one squeeze of flavor per liter if desired." }
      { namespace: "custom", key: "care_instructions", value: "Bottle is top-rack dishwasher safe. Hand-wash the cap. Do not microwave. Store without cartridge when not in use." }
      { namespace: "custom", key: "warranty_note", value: "2-year limited warranty against manufacturing defects." }
      { namespace: "custom", key: "pairs_with_heading", value: "Complete your setup" }
      { namespace: "custom", key: "pairs_with_products", value: "[\"gid://shopify/Product/10229603565853\",\"gid://shopify/Product/10229603369245\"]" }
    ]
  }) { userErrors { message } }

  co2: productUpdate(input: {
    id: "gid://shopify/Product/10229603565853"
    metafields: [
      { namespace: "custom", key: "pdp_tagline", value: "On-demand CO₂ refills — $10 per 6-pack." }
      { namespace: "custom", key: "how_to_use", value: "Insert one canister into your Fizz bottle. Each canister carbonates up to 12 liters. Subscribe for on-demand 6-pack refills when you run low." }
      { namespace: "custom", key: "care_instructions", value: "Store canisters at room temperature away from heat. Do not puncture. Recycle empty canisters per local guidelines." }
      { namespace: "custom", key: "pairs_with_heading", value: "People pair this with" }
      { namespace: "custom", key: "pairs_with_products", value: "[\"gid://shopify/Product/10216978874653\",\"gid://shopify/Product/10229603369245\"]" }
    ]
  }) { userErrors { message } }

  flavor: productUpdate(input: {
    id: "gid://shopify/Product/10229603369245"
    metafields: [
      { namespace: "custom", key: "pdp_tagline", value: "Natural flavor — one squeeze per liter." }
      { namespace: "custom", key: "how_to_use", value: "Fizz your water first, then add one squeeze per liter. Stir gently and enjoy." }
      { namespace: "custom", key: "care_instructions", value: "Store in a cool, dry place. Refrigerate after opening." }
      { namespace: "custom", key: "pairs_with_heading", value: "People pair this with" }
      { namespace: "custom", key: "pairs_with_products", value: "[\"gid://shopify/Product/10216978874653\",\"gid://shopify/Product/10229603565853\"]" }
    ]
  }) { userErrors { message } }
}' 2>&1 | tail -10

echo "=== Seeding bottle variant color_slug + variant_story ==="
for row in \
  "51846210388253:charcoal-black:Desk-to-gym black — understated and always ready." \
  "51846210421021:arctic-white:Clean white for minimal kitchens and bright routines." \
  "51846210453789:coral-orange:Warm coral energy for kitchens that never sit still." \
  "51846210486557:sage-green:Soft sage for calm mornings and slow weekends." \
  "51846210519325:electric-blue:Electric blue for bold hydration on the go." \
  "51846210552093:steel-navy:Deep navy that looks sharp anywhere."
do
  vid="${row%%:*}"
  rest="${row#*:}"
  slug="${rest%%:*}"
  story="${rest#*:}"
  shopify store execute -s "$STORE" -j --allow-mutations -q "
    mutation {
      metafieldsSet(metafields: [
        { ownerId: \"gid://shopify/ProductVariant/$vid\", namespace: \"custom\", key: \"color_slug\", type: \"single_line_text_field\", value: \"$slug\" }
        { ownerId: \"gid://shopify/ProductVariant/$vid\", namespace: \"custom\", key: \"variant_story\", type: \"single_line_text_field\", value: \"$story\" }
      ]) { userErrors { message } }
    }" 2>&1 | grep -E "userErrors|error" || true
done

echo "=== Seeding flavor pack_slug metafields ==="
shopify store execute -s "$STORE" -j --allow-mutations -q '
mutation {
  metafieldsSet(metafields: [
    { ownerId: "gid://shopify/ProductVariant/51885256442141", namespace: "custom", key: "pack_slug", type: "single_line_text_field", value: "orange-tangerine" }
    { ownerId: "gid://shopify/ProductVariant/51885256573213", namespace: "custom", key: "pack_slug", type: "single_line_text_field", value: "zesty-lime" }
    { ownerId: "gid://shopify/ProductVariant/51885256638749", namespace: "custom", key: "pack_slug", type: "single_line_text_field", value: "mixed-berry" }
  ]) { userErrors { message } }
}' 2>&1 | tail -5

echo "Done."
