# VPS: Complete Clean Reinstall and Rebuild

## Problem
The build might be using cached node_modules or old dependencies. Let's do a complete clean reinstall.

## Solution - Complete Clean Reinstall

```bash
cd /opt/petrodealhub

# 1. Stop services
pm2 stop all 2>/dev/null || true
sudo systemctl stop nginx

# 2. Remove EVERYTHING
rm -rf dist
rm -rf node_modules
rm -rf .vite
rm -rf .cache
rm -rf .next
rm -rf build
rm -rf node_modules/.cache
rm -rf .vite

# 3. Clear ALL npm caches
npm cache clean --force
rm -rf ~/.npm
rm -rf ~/.npm/_cacache

# 4. Verify component file has new code (should show output)
grep "v3.0-FORCE-RELOAD" src/components/VesselDocumentGenerator.tsx

# 5. Fresh install dependencies
npm install

# 6. Rebuild
npm run build

# 7. Verify new version is in build (should show output)
grep "v3.0-FORCE-RELOAD" dist/assets/*.js
grep "NEW VERSION v3.0 LOADED" dist/assets/*.js

# If grep shows output, new version is in build ✅
# If no output, there's still a problem

# 8. Restart services
sudo systemctl restart nginx
pm2 restart all 2>/dev/null || true
```

## Alternative: Check if Vite is Caching

```bash
cd /opt/petrodealhub

# Check Vite cache location
ls -la node_modules/.vite 2>/dev/null || echo "No .vite cache"

# Remove Vite cache specifically
rm -rf node_modules/.vite
rm -rf .vite

# Rebuild with no cache
npm run build -- --force
```

## Check Build Output for Errors

```bash
# Run build and check for errors
npm run build 2>&1 | tee build.log

# Check for errors
grep -i error build.log
grep -i warning build.log

# Check if component was included
grep -i "VesselDocumentGenerator" build.log
```

## Verify Source File Before Building

```bash
# Make sure source file is correct
head -60 src/components/VesselDocumentGenerator.tsx | tail -20

# Should show the useEffect with v3.0 console.log
# OR check around line 332
sed -n '330,340p' src/components/VesselDocumentGenerator.tsx

# Should show: data-component-version="v3.0-FORCE-RELOAD"
```

## If Still Not Working

```bash
# Check if there are multiple component files
find src -name "*Document*.tsx" -type f

# Should only show:
# src/components/VesselDocumentGenerator.tsx
# (VesselDocumentDownloader.tsx should be deleted)

# Check git status
git status

# Make sure you're on latest code
git pull origin main

# Verify file is committed
git log --oneline -5 -- src/components/VesselDocumentGenerator.tsx
```

## Expected Result

After complete reinstall and rebuild:

```bash
$ grep "v3.0-FORCE-RELOAD" dist/assets/*.js
dist/assets/index-XXXXX.js: ...v3.0-FORCE-RELOAD...
```

If you still get no output after this, there might be a build configuration issue.

