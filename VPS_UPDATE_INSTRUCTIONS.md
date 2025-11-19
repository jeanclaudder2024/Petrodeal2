# How to Update VPS with Latest Changes

## Quick Update (Recommended)

Run this on your VPS:

```bash
cd /opt/petrodealhub
git pull origin main
bash VPS_SAFE_FRONTEND_UPDATE.sh
```

## Step-by-Step Instructions

### 1. Connect to Your VPS
```bash
ssh root@your-vps-ip
# or
ssh your-username@your-vps-ip
```

### 2. Navigate to Project Directory
```bash
cd /opt/petrodealhub
```

### 3. Pull Latest Code from GitHub
```bash
git pull origin main
```

If you get an error about local changes:
```bash
git stash save "Local changes before pull"
git pull origin main
```

### 4. Run the Safe Update Script
```bash
chmod +x VPS_SAFE_FRONTEND_UPDATE.sh
bash VPS_SAFE_FRONTEND_UPDATE.sh
```

This script will:
- ✅ Pull latest code
- ✅ Clean frontend build cache
- ✅ Rebuild frontend
- ✅ Restart frontend services
- ✅ NOT touch backend or database

### 5. Clear Browser Cache
After the update, in your browser:
- Press `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Or: Open DevTools (F12) → Right-click refresh → "Empty Cache and Hard Reload"

## Alternative: Manual Update

If you prefer to do it manually:

```bash
cd /opt/petrodealhub

# Pull latest code
git pull origin main

# Clean build cache
rm -rf dist node_modules/.vite .vite .cache
rm -f .npmrc

# Rebuild
npm run build

# Restart services (if using nginx directly)
sudo systemctl reload nginx

# OR if using port 3000
pm2 restart petrodealhub-app
sudo systemctl reload nginx
```

## Verify Update

After updating, check:
1. The website loads correctly
2. New features/changes are visible
3. No console errors in browser DevTools

## Troubleshooting

### If git pull fails with local changes:
```bash
git stash save "Local changes"
git pull origin main
```

### If build fails:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### If updates don't show:
1. Clear browser cache completely
2. Try incognito/private window
3. Check browser DevTools → Network tab → Disable cache
