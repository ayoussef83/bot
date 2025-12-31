#!/usr/bin/env bash
set -euo pipefail

# MV-OS Git workflow enforcement without SSH keys and without clicking in the UI.
# Uses GitHub CLI (gh) to configure branch protection for:
# - main   (production)
# - develop (staging)
#
# Requirements:
# - gh installed: https://cli.github.com/
# - gh authenticated: `gh auth login`
#
# Usage:
#   ./scripts/github/setup-branch-protection.sh
#
# Optional env:
#   REPO=ayoussef83/bot

REPO="${REPO:-ayoussef83/bot}"

need() { command -v "$1" >/dev/null 2>&1 || { echo "❌ Missing '$1'"; exit 1; }; }
need gh

echo "🔐 Configuring branch protection via GitHub API for: $REPO"
echo "   (No SSH needed. Uses your gh auth.)"
echo ""

# Ensure we can access the repo
gh repo view "$REPO" >/dev/null

protect_branch () {
  local BRANCH="$1"
  echo "➡️  Protecting branch: $BRANCH"

  # Note: required_status_checks.contexts can be updated later once the workflow has run at least once.
  # We'll still add the rule, then set the required check to "Branch policy" (workflow name).
  gh api \
    -X PUT \
    -H "Accept: application/vnd.github+json" \
    "/repos/$REPO/branches/$BRANCH/protection" \
    -f required_status_checks.strict=true \
    -f required_status_checks.contexts[]="Branch policy" \
    -f enforce_admins=true \
    -f required_pull_request_reviews.dismiss_stale_reviews=true \
    -f required_pull_request_reviews.required_approving_review_count=1 \
    -f restrictions=null \
    -f allow_force_pushes=false \
    -f allow_deletions=false \
    >/dev/null

  echo "✅ Branch protection set for $BRANCH"
}

protect_branch "main"
protect_branch "develop"

echo ""
echo "✅ Done."
echo "If GitHub says the required check 'Branch policy' doesn't exist yet:"
echo "- open any PR once, let Actions run, then re-run this script."


