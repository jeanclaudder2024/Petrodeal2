# 🚀 Quick Update: Deploy VesselDocumentGenerator to VPS

## Simple Steps to Update Frontend

### Step 1: Connect to Your VPS
```bash
ssh root@your-vps-ip
# or
ssh your-username@your-vps-ip
```

### Step 2: Navigate to Project Directory
```bash
cd /opt/petrodealhub
# or wherever your project is located
# Common locations: /opt/aivessel-trade-flow or /root/aivessel-trade-flow
```

### Step 3: Pull Latest Code
```bash
git pull origin main
# or
git pull origin master
```

### Step 4: Install Dependencies (if needed)
```bash
# Only if package.json changed
npm install
```

### Step 5: Build Frontend
```bash
npm run build
```

This will create/update the `dist/` folder with the new build.

### Step 6: Restart Frontend Service

**If using PM2:**
```bash
pm2 restart petrodealhub-app
# or
pm2 restart all
```

**If using systemd:**
```bash
sudo systemctl restart react-app
# or whatever your service name is
```

**If using serve directly:**
```bash
# Stop current process
pkill -f "serve -s"

# Start again
cd /opt/petrodealhub
serve -s dist -l 3000 &
```

### Step 7: Verify It's Working
```bash
# Check if frontend is running
curl http://localhost:3000

# Check PM2 status
pm2 status

# Check systemd status
sudo systemctl status react-app
```

## 🎯 One-Line Quick Update

If you're already in the project directory:
```bash
git pull && npm run build && pm2 restart petrodealhub-app
```

## 🔍 Troubleshooting

### If build fails:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### If service won't restart:
```bash
# Check logs
pm2 logs petrodealhub-app
# or
sudo journalctl -u react-app -f
```

### If changes don't show:
```bash
# Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
# Or hard refresh the page

# Also check Nginx cache if using reverse proxy
sudo systemctl reload nginx
```

## ✅ Done!

After these steps, your updated VesselDocumentGenerator with lock/unlock functionality will be live on your VPS!

