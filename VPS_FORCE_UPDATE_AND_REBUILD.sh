#!/bin/bash
# VPS: Force Update and Rebuild Script
# This script ensures the latest code is pulled and rebuilt

cd /opt/petrodealhub

echo "=========================================="
echo "STEP 1: Pulling latest code from GitHub"
echo "=========================================="
git fetch origin
git reset --hard origin/main
git pull origin main

echo ""
echo "=========================================="
echo "STEP 2: Verifying component file has new code"
echo "=========================================="
if grep -q "v3.0-FORCE-RELOAD" src/components/VesselDocumentGenerator.tsx; then
    echo "✅ Component file has new v3.0 code"
else
    echo "❌ ERROR: Component file does NOT have v3.0 code!"
    echo "   File might not have been updated"
    exit 1
fi

echo ""
echo "=========================================="
echo "STEP 3: Removing all build artifacts"
echo "=========================================="
rm -rf dist
rm -rf node_modules/.vite
rm -rf .vite
rm -rf .cache
rm -rf .next
rm -rf build
rm -rf node_modules/.cache

echo ""
echo "=========================================="
echo "STEP 4: Clearing npm cache"
echo "=========================================="
npm cache clean --force
rm -rf ~/.npm/_cacache

echo ""
echo "=========================================="
echo "STEP 5: Rebuilding"
echo "=========================================="
npm run build

echo ""
echo "=========================================="
echo "STEP 6: Verifying new version is in build"
echo "=========================================="
if grep -q "v3.0-FORCE-RELOAD" dist/assets/*.js 2>/dev/null; then
    echo "✅ SUCCESS: New version v3.0 is in the build!"
    echo "   Found in:"
    grep -l "v3.0-FORCE-RELOAD" dist/assets/*.js
else
    echo "❌ ERROR: New version v3.0 is NOT in the build!"
    echo "   Build might have failed or used cached files"
    exit 1
fi

echo ""
echo "=========================================="
echo "STEP 7: Restarting nginx"
echo "=========================================="
sudo systemctl restart nginx
sudo systemctl status nginx --no-pager

echo ""
echo "=========================================="
echo "✅ DONE! New version should now be live"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Clear browser cache (Ctrl+Shift+Delete)"
echo "2. Hard refresh (Ctrl+Shift+R)"
echo "3. Look for red banner: '🚨 NEW VERSION v3.0 LOADED'"

