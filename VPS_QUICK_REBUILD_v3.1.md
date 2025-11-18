# 🚀 QUICK REBUILD v3.1 - Force New Component

## What Changed
- Component version updated to **v3.1-FORCE-REBUILD-2025**
- Added browser alert to confirm new version loaded
- Updated visual markers to show v3.1
- Force reload key in VesselDetail updated

## FASTEST FIX - Run This:

```bash
cd /opt/petrodealhub

# Pull latest code
git pull origin main

# Quick clean and rebuild
rm -rf dist node_modules/.vite .cache package-lock.json
npm cache clean --force
npm install
npm run build

# Verify v3.1 is in build
grep "v3.1-FORCE-REBUILD" dist/assets/*.js

# Restart nginx
sudo systemctl restart nginx
```

## Verification

After rebuild, check:
1. `grep "v3.1-FORCE-REBUILD" dist/assets/*.js` - MUST show output
2. Browser console should show: "🚨🚨🚨 VesselDocumentGenerator v3.1 FORCE REBUILD"
3. Browser should show alert: "✅ NEW VERSION v3.1 LOADED!"
4. Page should show red border with "🚨 NEW VERSION v3.1 FORCE REBUILD"

## If Still Old Version

```bash
# Nuclear option
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

Then in browser:
- Press `Ctrl+Shift+Delete` → Clear cache
- Or use Incognito mode
- Or F12 → Network tab → Check "Disable cache"

