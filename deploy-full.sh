#!/bin/bash
# Run from your LOCAL machine (or CI). Pushes to GitHub then deploys on VPS.
# Usage:
#   ./deploy-full.sh                    # push to GitHub, then print VPS commands
#   DEPLOY_SSH=user@your-vps ./deploy-full.sh   # push then run FULL_DEPLOY.sh on VPS via SSH
#   SKIP_PUSH=1 ./deploy-full.sh         # skip git push (e.g. already pushed)

set -e

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO_ROOT"

echo "=========================================="
echo "DEPLOY: Push to GitHub + Full VPS Deploy"
echo "=========================================="
echo ""

# 1. Optional: push to GitHub
if [ -z "$SKIP_PUSH" ]; then
  echo "1. Pushing to GitHub..."
  git add -A
  if git diff --staged --quiet 2>/dev/null; then
    echo "   No changes to commit."
  else
    git commit -m "Deploy: document API portal and updates"
    git push origin main 2>/dev/null || git push origin master 2>/dev/null || true
    echo "   ✅ Pushed to origin"
  fi
  echo ""
else
  echo "1. Skipping git push (SKIP_PUSH=1)"
  echo ""
fi

# 2. Deploy on VPS
if [ -n "$DEPLOY_SSH" ]; then
  echo "2. Running full deploy on VPS ($DEPLOY_SSH)..."
  ssh "$DEPLOY_SSH" "cd /opt/petrodealhub && bash FULL_DEPLOY.sh"
  echo "   ✅ VPS deploy finished"
else
  echo "2. Run the full deploy ON YOUR VPS:"
  echo ""
  echo "   ssh root@your-vps-host   # or your VPS user@host"
  echo "   cd /opt/petrodealhub"
  echo "   bash FULL_DEPLOY.sh"
  echo ""
  echo "   Or in one line:"
  echo "   ssh root@your-vps-host 'cd /opt/petrodealhub && bash FULL_DEPLOY.sh'"
  echo ""
  echo "   To run deploy automatically from this script, set:"
  echo "   DEPLOY_SSH=user@your-vps ./deploy-full.sh"
  echo ""
fi

echo "=========================================="
echo "DONE"
echo "=========================================="
