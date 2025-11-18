# 🚨 URGENT: VPS Rebuild Required - v3.1

## Problem
Your logs show the OLD build is still running:
- Logs show: `index-CWso2qzf.js` (old minified file)
- Missing: `🚨 v3.1: Setting templates state` logs
- Templates are fetched (4 templates) but NOT showing in UI

## Solution: REBUILD NOW

```bash
cd /opt/petrodealhub

# 1. Pull latest code
git pull origin main

# 2. Verify source has v3.1
grep "v3.1-FORCE-REBUILD" src/components/VesselDocumentGenerator.tsx
# MUST show output!

# 3. Clean and rebuild
rm -rf dist node_modules/.vite .cache package-lock.json
npm cache clean --force
npm install
npm run build

# 4. CRITICAL: Verify build has v3.1
grep "v3.1-FORCE-REBUILD" dist/assets/*.js
# MUST show output! If not, build failed.

# 5. Restart nginx
sudo systemctl restart nginx

# 6. Check build file
ls -lh dist/assets/*.js | tail -1
```

## After Rebuild - What to Check

### In Browser Console:
1. Should see: `🚨🚨🚨 VesselDocumentGenerator v3.1 FORCE REBUILD`
2. Should see: `🚨 v3.1: Setting templates state: 4 templates`
3. Should see: `🚨 v3.1: Component render state: {loading: false, templatesCount: 4}`

### On Page:
1. Red border around component
2. Blue debug banner: "📊 Debug: Loading=false, Templates=4"
3. Card header: "Available Document Templates (4)"
4. All 4 templates listed below

## If Still Not Working

### Check if build succeeded:
```bash
# Check build output
grep "v3.1-FORCE-REBUILD" dist/assets/*.js
# If no output, build failed - check npm errors
```

### Nuclear Option:
```bash
cd /opt/petrodealhub
git fetch origin
git reset --hard origin/main
rm -rf dist node_modules .vite .cache package-lock.json
npm cache clean --force
npm install
npm run build
grep "v3.1-FORCE-REBUILD" dist/assets/*.js
sudo systemctl restart nginx
```

### Browser Cache:
- Press `Ctrl+Shift+Delete` → Clear cache
- Or use Incognito mode
- Or F12 → Network tab → Check "Disable cache"

## Current Status
- ✅ Code updated in git (v3.1)
- ✅ Templates fetching works (4 templates)
- ❌ VPS build is OLD (missing v3.1 code)
- ❌ Templates not rendering (old build issue)

**ACTION REQUIRED: Rebuild on VPS NOW**

