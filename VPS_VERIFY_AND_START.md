# VPS: Verify New Component and Start Services

## Step 1: Verify New Version is in Build

```bash
cd /opt/petrodealhub

# Check if new version is in the built JavaScript file
grep -r "v3.0-FORCE-RELOAD" dist/
grep -r "NEW VERSION v3.0 LOADED" dist/

# If you see output, new version is in build ✅
# If no output, the build didn't include it ❌
```

## Step 2: Check How Frontend is Served

The frontend might be served by nginx (static files), not PM2. Let's check:

```bash
# Check nginx configuration
sudo nginx -t
sudo systemctl status nginx

# Check if nginx is serving the dist folder
sudo cat /etc/nginx/sites-available/petrodealhub
# OR
sudo cat /etc/nginx/sites-enabled/petrodealhub
# OR
sudo cat /etc/nginx/nginx.conf | grep -A 20 "petrodealhub"
```

## Step 3: Restart Services

```bash
# Restart nginx (this serves the frontend)
sudo systemctl restart nginx
sudo systemctl status nginx

# Check if PM2 is needed for frontend
pm2 list

# If PM2 shows no processes, the frontend is likely served by nginx only
# The backend API might be in a different location
```

## Step 4: Verify Build Files

```bash
cd /opt/petrodealhub

# Check the actual built JavaScript file
# Find the main JS file
ls -lh dist/assets/*.js

# Check if new version is in the main JS file
grep "v3.0-FORCE-RELOAD" dist/assets/*.js
grep "NEW VERSION v3.0 LOADED" dist/assets/*.js

# If found, new version is in build ✅
```

## Step 5: Clear Nginx Cache (if applicable)

```bash
# If nginx has caching enabled, clear it
sudo rm -rf /var/cache/nginx/*
sudo systemctl reload nginx
```

## Step 6: Test in Browser

1. Open browser DevTools (F12)
2. Go to Network tab
3. Check "Disable cache"
4. Refresh page (F5)
5. Look for `index-*.js` file
6. Right-click → "Open in new tab"
7. Press Ctrl+F and search for "v3.0-FORCE-RELOAD"
8. If found: New version is loaded ✅
9. If not found: Browser is still caching old version

## Troubleshooting

### If PM2 shows "No process found":
- Frontend is likely served by nginx as static files
- Only restart nginx: `sudo systemctl restart nginx`
- PM2 might only be for the backend API (document-processor)

### If grep shows no results:
- The build might not have included the new code
- Check if you're in the right directory: `pwd` should show `/opt/petrodealhub`
- Rebuild: `npm run build`
- Check for build errors

### If browser still shows old version:
- Hard refresh: Ctrl+Shift+R or Ctrl+F5
- Clear browser cache completely
- Try incognito/private mode
- Check nginx is serving the new dist folder

