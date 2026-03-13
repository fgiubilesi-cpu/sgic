#!/usr/bin/env bash

set -euo pipefail

BASE_URL="${1:-http://127.0.0.1:3000}"
PAYLOAD_FILE="${2:-scripts/fixtures/filemaker-management-sample.json}"
SYNC_KEY="${MANAGEMENT_SYNC_API_KEY:-${INTERNAL_API_KEY:-}}"
ORGANIZATION_SLUG_OVERRIDE="${ORGANIZATION_SLUG_OVERRIDE:-${3:-}}"
DRY_RUN_OVERRIDE="${DRY_RUN_OVERRIDE:-}"

if [[ ! -f "$PAYLOAD_FILE" ]]; then
  echo "Payload file not found: $PAYLOAD_FILE" >&2
  exit 1
fi

if [[ -z "$SYNC_KEY" ]]; then
  echo "Set MANAGEMENT_SYNC_API_KEY or INTERNAL_API_KEY before running this script." >&2
  exit 1
fi

PAYLOAD_TO_SEND="$PAYLOAD_FILE"

if [[ -n "$ORGANIZATION_SLUG_OVERRIDE" || -n "$DRY_RUN_OVERRIDE" ]]; then
  PAYLOAD_TO_SEND="$(mktemp)"
  INPUT_PATH="$PAYLOAD_FILE" OUTPUT_PATH="$PAYLOAD_TO_SEND" ORGANIZATION_SLUG="$ORGANIZATION_SLUG_OVERRIDE" DRY_RUN_VALUE="$DRY_RUN_OVERRIDE" node <<'NODE'
const fs = require('node:fs');
const inputPath = process.env.INPUT_PATH;
const outputPath = process.env.OUTPUT_PATH;
const organizationSlug = process.env.ORGANIZATION_SLUG;
const dryRunValue = process.env.DRY_RUN_VALUE;

if (!inputPath || !outputPath) {
  throw new Error('Missing payload override inputs.');
}

const payload = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
if (organizationSlug) {
  payload.organization_slug = organizationSlug;
}
if (dryRunValue) {
  payload.dry_run = dryRunValue === 'true';
}
fs.writeFileSync(outputPath, JSON.stringify(payload));
NODE
fi

curl -X POST "$BASE_URL/api/management/filemaker-sync" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SYNC_KEY" \
  --data @"$PAYLOAD_TO_SEND"

echo

if [[ "$PAYLOAD_TO_SEND" != "$PAYLOAD_FILE" ]]; then
  rm -f "$PAYLOAD_TO_SEND"
fi
