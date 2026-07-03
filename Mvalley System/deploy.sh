#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
#  MV-OS — Datacenter Deploy Script (runs ON mv-app at /opt/stacks/mvalley-system)
#  Pattern copied from NourAutoERP. Source of truth: GitHub main.
#
#  Usage:
#    ./deploy.sh backend            → pull main + rebuild/restart backend
#    ./deploy.sh frontend           → pull main + rebuild/restart frontend
#    ./deploy.sh all                → pull main + rebuild both
#    ./deploy.sh sync               → pull main + sync code only (no build)
#    ./deploy.sh status             → containers + ports
#    ./deploy.sh logs [svc]         → tail logs (default backend)
#    ./deploy.sh rollback <ref>     → reset to tag/commit + rebuild both
#
#  Rules (same as NourAutoERP):
#   - never touches postgres/minio containers
#   - never overwrites .env* on the server (rsync-excluded)
#   - if backend crash-loops after deploy: ./deploy.sh rollback <last-stable-tag>
# ═══════════════════════════════════════════════════════════════════════════
set -euo pipefail

REPO=/opt/stacks/mvalley-repo
APPSRC="$REPO/Mvalley System"
STACK=/opt/stacks/mvalley-system
COMPOSE="docker-compose -f docker-compose.local.yml"

sync_code() {
  local ref="${1:-origin/main}"
  cd "$REPO"
  git fetch origin main --tags --depth 20
  git reset --hard "$ref"
  echo "📥 Repo at: $(git log -1 --format='%h %ad %s' --date=short)"
  rsync -a --delete \
    --exclude '.env' --exclude '.env.*' --exclude 'node_modules' --exclude 'dist' \
    "$APPSRC/backend/" "$STACK/backend/"
  rsync -a --delete \
    --exclude '.env' --exclude '.env.*' --exclude 'node_modules' --exclude '.next' --exclude 'out' \
    "$APPSRC/frontend/" "$STACK/frontend/"
  echo "✅ Code synced (server .env files preserved)"
}

rebuild() {
  local svc="$1"
  cd "$STACK"
  echo "🔨 Building $svc ..."
  $COMPOSE build "$svc"
  echo "🔄 Restarting $svc ..."
  $COMPOSE up -d --no-deps "$svc"
  sleep 8
  $COMPOSE ps | grep -E "Name|$svc" || true
  echo "── last logs ($svc) ──"
  docker logs "mvalley-system_${svc}_1" --tail 15 2>&1 | tail -15
}

case "${1:-status}" in
  sync)     sync_code ;;
  backend)  sync_code; rebuild backend ;;
  frontend) sync_code; rebuild frontend ;;
  all)      sync_code; rebuild backend; rebuild frontend ;;
  status)   cd "$STACK"; $COMPOSE ps ;;
  logs)     docker logs "mvalley-system_${2:-backend}_1" --tail 40 ;;
  rollback) sync_code "${2:?usage: ./deploy.sh rollback <tag-or-commit>}"; rebuild backend; rebuild frontend ;;
  *) echo "usage: ./deploy.sh {backend|frontend|all|sync|status|logs [svc]|rollback <ref>}"; exit 1 ;;
esac
