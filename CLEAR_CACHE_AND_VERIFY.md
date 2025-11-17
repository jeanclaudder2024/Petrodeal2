# Clear Cache and Verify New Component

## Problem
The old "File Download" component is still showing instead of the new one.

## Solution: Clear All Caches

### Step 1: On VPS - Rebuild Frontend
```bash
cd /opt/petrodealhub
git pull origin main
rm -rf dist node_modules/.vite  # Clear build cache
npm run build
```

### Step 2: Restart Frontend Service
```bash
# If using PM2:
pm2 restart all
pm2 flush  # Clear PM2 logs

# If using nginx:
sudo systemctl restart nginx
sudo nginx -s reload

# If using systemd:
sudo systemctl restart <your-frontend-service>
```

### Step 3: Clear Browser Cache (IMPORTANT!)

#### Chrome/Edge:
1. Press `F12` to open DevTools
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"
4. OR Press `Ctrl+Shift+Delete` → Clear browsing data → Cached images and files

#### Firefox:
1. Press `Ctrl+Shift+Delete`
2. Select "Cached Web Content"
3. Click "Clear Now"
4. OR Press `Ctrl+F5` for hard refresh

#### Safari:
1. Press `Cmd+Option+E` to empty caches
2. OR Press `Cmd+Shift+R` for hard refresh

### Step 4: Verify New Version is Loading

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for this message:
   ```
   🆕 VesselDocumentGenerator component mounted/updated - NEW VERSION
   ```
4. If you see this message, the new component is loaded!
5. If you DON'T see this message, the old cached version is still being used

### Step 5: Check Network Tab

1. In DevTools, go to Network tab
2. Refresh the page
3. Look for `index-*.js` file
4. Check the file size - new version should be different
5. Right-click → "Open in new tab" to see the file
6. Search for "NEW VERSION" in the file - it should be there

### Step 6: Force Clear All (Nuclear Option)

If still not working:

```bash
# On VPS:
cd /opt/petrodealhub
rm -rf dist node_modules/.vite .next .cache
npm cache clean --force
npm install
npm run build

# Restart everything
pm2 restart all
sudo systemctl restart nginx
```

Then in browser:
- Clear ALL browser data (cookies, cache, everything)
- Close browser completely
- Reopen browser
- Visit the page again

## What to Look For

### New Version Should Show:
- ✅ Template display name (not file name)
- ✅ Description (if set in CMS)
- ✅ Plan information (for logged-in users)
- ✅ Locked button with upgrade message (if not in plan)
- ✅ Console log: "🆕 VesselDocumentGenerator component mounted/updated - NEW VERSION"

### Old Version Shows:
- ❌ Just file names
- ❌ No description
- ❌ No plan information
- ❌ Different UI layout

## Still Not Working?

Check browser console for errors:
1. Open DevTools (F12)
2. Go to Console tab
3. Look for any red errors
4. Check if component is importing correctly

If you see import errors, the build might have failed. Check VPS build logs.

