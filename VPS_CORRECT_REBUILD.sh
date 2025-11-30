#!/bin/bash
# Correct Rebuild Script for VPS
# Run this: bash VPS_CORRECT_REBUILD.sh

echo "=== Step 1: Navigate to project root ==="
cd /opt/petrodealhub
pwd

echo -e "\n=== Step 2: Pull latest code ==="
git pull origin main

echo -e "\n=== Step 3: Verify source has changes ==="
if grep -q "RED BUTTON TEST" src/pages/VesselDetail.tsx; then
    echo "✅ Source has red button change"
    grep "RED BUTTON TEST" src/pages/VesselDetail.tsx
else
    echo "❌ ERROR: Source doesn't have changes!"
    echo "Running git fetch and reset..."
    git fetch origin
    git reset --hard origin/main
    git pull origin main
    if grep -q "RED BUTTON TEST" src/pages/VesselDetail.tsx; then
        echo "✅ Now has changes after reset"
    else
        echo "❌ CRITICAL: Still no changes in source!"
        exit 1
    fi
fi

echo -e "\n=== Step 4: Clean old build (IMPORTANT) ==="
echo "Removing dist, node_modules/.vite, .cache..."
rm -rf dist
rm -rf node_modules/.vite
rm -rf .cache
rm -rf .vite
npm cache clean --force

echo -e "\n=== Step 5: Rebuild from project root ==="
echo "Running: npm run build"
npm run build

echo -e "\n=== Step 6: Verify build has changes ==="
if grep -q "RED BUTTON TEST" dist/assets/*.js 2>/dev/null; then
    echo "✅ Build has red button change"
    echo "Found in:"
    grep -l "RED BUTTON TEST" dist/assets/*.js
else
    echo "❌ ERROR: Build does NOT have changes!"
    echo "Build may have failed. Check errors above."
    echo "Listing dist files:"
    ls -la dist/assets/*.js | head -5
    exit 1
fi

echo -e "\n=== Step 7: Restart nginx ==="
sudo systemctl restart nginx
sudo systemctl status nginx --no-pager | head -10

echo -e "\n=== SUCCESS! ==="
echo "✅ Source has changes"
echo "✅ Build has changes"  
echo "✅ Nginx restarted"
echo ""
echo "NOW: Clear browser cache and reload page."
echo "You should see: 🔴 TEST: Create Broker Deal (RED BUTTON TEST) 🔴"





