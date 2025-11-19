#!/bin/bash
# Quick script to stash changes and pull latest code
cd /opt/petrodealhub
git stash save "Local changes before pull - $(date +%Y-%m-%d_%H-%M-%S)"
git pull origin main
echo "✅ Pulled latest code. You can now run: bash VPS_SAFE_FRONTEND_UPDATE.sh"

