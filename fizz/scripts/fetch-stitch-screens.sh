#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -z "${STITCH_API_KEY:-}" ]]; then
  echo "Error: STITCH_API_KEY is not set."
  echo "  export STITCH_API_KEY=your-key"
  echo "  ./scripts/fetch-stitch-screens.sh"
  exit 1
fi

if [[ ! -d node_modules/@google/stitch-sdk ]]; then
  npm install @google/stitch-sdk --no-save
fi

node scripts/fetch-stitch-screens.mjs
