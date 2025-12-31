#!/usr/bin/env bash
set -euo pipefail

# Local-safe Meta Messenger webhook replay script
# Usage:
#   ./scripts/webhooks/replay-meta-messenger-sample.sh http://localhost:3000

BASE_URL="${1:-http://localhost:3000}"

curl -sS -X POST "$BASE_URL/api/webhooks/meta/messenger" \
  -H 'Content-Type: application/json' \
  -d '{
    "object": "page",
    "entry": [
      {
        "id": "PAGE_ID",
        "time": 1700000000,
        "messaging": [
          {
            "sender": { "id": "USER_ID" },
            "recipient": { "id": "PAGE_ID" },
            "timestamp": 1700000000,
            "message": { "mid": "m_test", "text": "Hello from Messenger replay" }
          }
        ]
      }
    ]
  }' | cat

echo ""


