#!/usr/bin/env bash
set -euo pipefail

# Local-safe webhook replay script
# Usage:
#   ./scripts/webhooks/replay-whatsapp-sample.sh http://localhost:3000

BASE_URL="${1:-http://localhost:3000}"

curl -sS -X POST "$BASE_URL/api/webhooks/whatsapp" \
  -H 'Content-Type: application/json' \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [
      {
        "id": "WABA_ID",
        "changes": [
          {
            "field": "messages",
            "value": {
              "messages": [
                { "from": "201000000000", "id": "wamid.test", "timestamp": "1700000000", "text": { "body": "Hello from replay" }, "type": "text" }
              ]
            }
          }
        ]
      }
    ]
  }' | cat

echo ""


