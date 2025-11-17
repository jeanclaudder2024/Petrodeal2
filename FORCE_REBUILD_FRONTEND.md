# Force Rebuild Frontend - Clear All Caches

## Problem
Old component is still showing even after updates.

## Solution: Complete Cache Clear and Rebuild

### Step 1: On VPS - Complete Clean Rebuild

```bash
cd /opt/petrodealhub

# Stop frontend service
pm2 stop all
# OR
sudo systemctl stop <your-frontend-service>

# Remove ALL caches
rm -rf dist
rm -rf node_modules/.vite
rm -rf .next
rm -rf .cache
rm -rf node_modules/.cache

# Clear npm cache
npm cache clean --force

# Reinstall dependencies (optional but recommended)
npm install

# Rebuild
npm run build

# Verify build succeeded
ls -la dist/

# Restart services
pm2 restart all
# OR
sudo systemctl restart <your-frontend-service>
sudo systemctl restart nginx
```

### Step 2: Clear Browser Cache Completely

#### Chrome/Edge:
1. Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
2. Select "All time" for time range
3. Check:
   - ✅ Cached images and files
   - ✅ Cookies and other site data
4. Click "Clear data"
5. Close browser completely
6. Reopen browser

#### Firefox:
1. Press `Ctrl+Shift+Delete`
2. Select "Everything" for time range
3. Check all boxes
4. Click "Clear Now"
5. Close browser completely
6. Reopen browser

#### Safari:
1. Safari → Preferences → Advanced
2. Check "Show Develop menu"
3. Develop → Empty Caches
4. Close browser completely
5. Reopen browser

### Step 3: Verify New Version is Loaded

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for: `🆕 VesselDocumentGenerator component mounted/updated - NEW VERSION`
4. Go to Elements tab
5. Find the document section
6. Look for: `data-component-version="v2.0-new-ui"` attribute
7. If you see this, the new version is loaded!

### Step 4: Check Network Tab

1. In DevTools, go to Network tab
2. Check "Disable cache" checkbox
3. Refresh page (F5)
4. Look for `index-*.js` file
5. Right-click → "Open in new tab"
6. Search for "v2.0-new-ui" - it should be there
7. Search for "NEW VERSION" - it should be there

### Step 5: If Still Not Working

Try incognito/private mode:
- Chrome: `Ctrl+Shift+N`
- Firefox: `Ctrl+Shift+P`
- Safari: `Cmd+Shift+N`

If it works in incognito, it's definitely a cache issue.

## Quick Test Command

After rebuilding, test if new version is in the build:

```bash
cd /opt/petrodealhub
grep -r "v2.0-new-ui" dist/
grep -r "NEW VERSION" dist/
```

If these commands return results, the new version is in the build!

