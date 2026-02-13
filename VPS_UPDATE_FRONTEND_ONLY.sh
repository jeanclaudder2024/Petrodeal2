#!/bin/bash
# Update only the React frontend on VPS (no Python API).
# Run on VPS: cd /opt/petrodealhub && bash VPS_UPDATE_FRONTEND_ONLY.sh

set -e
cd /opt/petrodealhub

echo "=========================================="
echo "UPDATING FRONTEND ONLY (no Python API)"
echo "=========================================="

echo "1. Pulling main repository..."
git pull origin main

echo "2. npm install..."
npm install

echo "3. Building frontend..."
npm run build

echo "4. Restarting react-app only..."
pm2 restart react-app

echo ""
echo "=========================================="
echo "DONE. Frontend updated."
echo "  pm2 status: pm2 list"
echo "=========================================="
