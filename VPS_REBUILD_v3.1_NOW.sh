#!/bin/bash
# VPS Rebuild Script for v3.1 Component
# Run this on your VPS: bash VPS_REBUILD_v3.1_NOW.sh

cd /opt/petrodealhub

echo "=== Step 1: Checking current directory ==="
pwd

echo -e "\n=== Step 2: Pulling latest code from GitHub ==="
git fetch origin
git pull origin main

echo -e "\n=== Step 3: Verifying source has v3.1 (MUST show output!) ==="
if grep -q "v3.1-FORCE-REBUILD" src/components/VesselDocumentGenerator.tsx; then
    echo "✅ Source code HAS v3.1"
    grep "v3.1-FORCE-REBUILD" src/components/VesselDocumentGenerator.tsx | head -1
else
    echo "❌ ERROR: Source code does NOT have v3.1!"
    echo "Running git reset --hard origin/main..."
    git reset --hard origin/main
    git pull origin main
    if grep -q "v3.1-FORCE-REBUILD" src/components/VesselDocumentGenerator.tsx; then
        echo "✅ Now has v3.1 after reset"
    else
        echo "❌ CRITICAL: Still no v3.1 in source! Check GitHub."
        exit 1
    fi
fi

echo -e "\n=== Step 4: Cleaning old build ==="
rm -rf dist
rm -rf node_modules/.vite
rm -rf .cache
rm -rf .vite
rm -f package-lock.json
npm cache clean --force

echo -e "\n=== Step 5: Reinstalling dependencies ==="
npm install

echo -e "\n=== Step 6: Building ==="
npm run build

echo -e "\n=== Step 7: Verifying build has v3.1 (MUST show output!) ==="
if grep -q "v3.1-FORCE-REBUILD" dist/assets/*.js 2>/dev/null; then
    echo "✅ Build HAS v3.1"
    echo "Found in:"
    grep -l "v3.1-FORCE-REBUILD" dist/assets/*.js
else
    echo "❌ ERROR: Build does NOT have v3.1!"
    echo "Checking what's in the build..."
    ls -la dist/assets/*.js | head -3
    echo "Build may have failed. Check errors above."
    exit 1
fi

echo -e "\n=== Step 8: Restarting services ==="
sudo systemctl restart nginx
pm2 restart all || echo "PM2 not running or no processes"

echo -e "\n=== SUCCESS! ==="
echo "✅ Source has v3.1"
echo "✅ Build has v3.1"
echo "✅ Services restarted"
echo ""
echo "Now clear your browser cache and reload the page."
echo "You should see:"
echo "  - Red banner: '🚨 NEW VERSION v3.1 FORCE REBUILD'"
echo "  - Blue debug banner with template count"
echo "  - All templates displayed in the UI"





