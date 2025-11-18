# 🚨 CRITICAL: VPS Build is Using OLD Code

## Problem
The minified JavaScript you're seeing in the browser is the OLD component. The VPS build is NOT including the new v3.0 component.

## Immediate Action Required

### Step 1: Verify Source Code on VPS
```bash
cd /opt/petrodealhub

# Check if source has v3.0
grep -n "v3.0-FORCE-RELOAD" src/components/VesselDocumentGenerator.tsx
```

**Expected:** Should show line numbers (e.g., `55:v3.0-FORCE-RELOAD`)

**If NO output:** Source code is old, need to pull from GitHub

### Step 2: Pull Latest Code
```bash
cd /opt/petrodealhub

# Force pull latest
git fetch origin
git reset --hard origin/main
git pull origin main

# Verify again
grep -n "v3.0-FORCE-RELOAD" src/components/VesselDocumentGenerator.tsx
# MUST show output now!
```

### Step 3: NUCLEAR Clean Rebuild
```bash
cd /opt/petrodealhub

# Stop everything
pm2 stop all 2>/dev/null || true

# Remove EVERYTHING
rm -rf dist
rm -rf node_modules
rm -rf .vite
rm -rf .cache
rm -rf .next
rm -rf build
rm -rf node_modules/.cache
rm -rf node_modules/.vite
rm -rf ~/.npm/_cacache

# Clear npm cache
npm cache clean --force

# Fresh install
npm install

# Rebuild
npm run build

# CRITICAL: Verify build has v3.0
grep "v3.0-FORCE-RELOAD" dist/assets/*.js
```

**MUST show output!** If no output, the build failed or used cached files.

### Step 4: Restart Services
```bash
sudo systemctl restart nginx
pm2 restart all 2>/dev/null || true
```

### Step 5: Verify on Browser
1. **Hard refresh:** `Ctrl+Shift+R` or `Ctrl+F5`
2. **Clear cache:** `Ctrl+Shift+Delete` → Clear cached images and files
3. **Check console:** Should see "🚨🚨🚨 VesselDocumentGenerator v3.0 FORCE RELOAD"
4. **Check page:** Should see red border and banners

## If Still Not Working

### Check Build Output
```bash
# Check what files were built
ls -lah dist/assets/*.js

# Check file sizes (new build should be different)
stat dist/assets/*.js

# Check build timestamp
ls -lt dist/assets/*.js | head -1
```

### Check Nginx is Serving New Files
```bash
# Check nginx config
sudo nginx -t

# Check nginx is pointing to correct dist folder
grep -r "root.*dist" /etc/nginx/sites-enabled/

# Reload nginx
sudo systemctl reload nginx
```

### Force Browser Cache Clear
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"
4. Or use Incognito mode

## Diagnostic Commands

```bash
# Check git status
cd /opt/petrodealhub
git status
git log --oneline -5

# Check if file was modified
git log --oneline --all -- src/components/VesselDocumentGenerator.tsx

# Check build date vs source date
stat src/components/VesselDocumentGenerator.tsx
stat dist/assets/*.js | head -1
```

## Expected Result

After successful rebuild:
- ✅ `grep "v3.0-FORCE-RELOAD" dist/assets/*.js` shows output
- ✅ Browser console shows v3.0 logs
- ✅ Page shows red border and banners
- ✅ Component displays template metadata correctly

