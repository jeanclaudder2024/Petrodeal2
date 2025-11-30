# 🚀 VPS Deployment Guide - Security Updates & Sitemap

## ✅ Changes Pushed to GitHub
- ✅ Removed all console logs for security
- ✅ Removed hardcoded API keys
- ✅ Added sitemap.xml for SEO
- ✅ Added Google Analytics script
- ✅ Updated robots.txt

## 📋 Quick Deployment Steps

### Step 1: SSH into Your VPS

```bash
ssh your-username@your-vps-ip
# Example: ssh root@123.456.789.0
```

### Step 2: Navigate to Project Directory

```bash
cd /opt/petrodealhub
# OR wherever your project is located
# Common locations: /var/www/aivessel-trade-flow-main or /home/user/aivessel-trade-flow-main
```

### Step 3: Pull Latest Changes from GitHub

```bash
# Pull main repository
git pull origin main

# Update submodule (if using document-processor)
git submodule update --init --recursive
cd document-processor
git pull origin master
cd ..
```

### Step 4: Install/Update Dependencies

```bash
# Frontend dependencies
npm install

# Backend dependencies (if needed)
cd document-processor
source venv/bin/activate  # or: python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cd ..
```

### Step 5: Rebuild Frontend

```bash
# Build React app for production
npm run build

# The build output will be in the 'dist' directory
```

### Step 6: Restart Services

#### Option A: Using PM2 (Recommended)

```bash
# Restart all PM2 processes
pm2 restart all

# OR restart specific apps
pm2 restart petrodealhub-app
pm2 restart petrodealhub-api

# Save PM2 configuration
pm2 save

# Check status
pm2 status
```

#### Option B: Using Systemd

```bash
# Restart frontend service (if using systemd)
sudo systemctl restart petrodealhub-frontend

# Restart backend service
sudo systemctl restart document-processor

# Check status
sudo systemctl status petrodealhub-frontend
sudo systemctl status document-processor
```

#### Option C: Manual Restart

```bash
# Stop existing processes
pm2 stop all
# OR
pkill -f "node.*serve"
pkill -f "python.*main.py"

# Start frontend (if using serve)
cd dist
serve -s . -l 3000 &

# Start backend
cd ../document-processor
source venv/bin/activate
python main.py &
# OR with uvicorn:
uvicorn main:app --host 0.0.0.0 --port 8000 &
```

### Step 7: Restart Nginx (if using)

```bash
# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
# OR
sudo systemctl restart nginx

# Check Nginx status
sudo systemctl status nginx
```

### Step 8: Verify Deployment

```bash
# Check if frontend is running
curl http://localhost:3000

# Check if backend is running
curl http://localhost:8000/health

# Check if sitemap is accessible
curl http://localhost:3000/sitemap.xml

# Check PM2 logs
pm2 logs

# Check systemd logs (if using)
sudo journalctl -u document-processor -f
sudo journalctl -u petrodealhub-frontend -f
```

## 🔍 Verification Checklist

- [ ] Git pull completed successfully
- [ ] Frontend dependencies installed
- [ ] Frontend built successfully (`npm run build`)
- [ ] Services restarted (PM2 or systemd)
- [ ] Frontend accessible at http://your-domain.com
- [ ] Backend API accessible at http://your-domain.com/api/health
- [ ] Sitemap accessible at http://your-domain.com/sitemap.xml
- [ ] Google Analytics script loaded (check browser console - should be clean now!)
- [ ] No console errors in browser (security improvement)

## 🐛 Troubleshooting

### If git pull fails:

```bash
# Stash local changes
git stash

# Pull again
git pull origin main

# If still fails, reset (WARNING: This will lose local changes)
git fetch origin
git reset --hard origin/main
```

### If build fails:

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Try building again
npm run build
```

### If services won't start:

```bash
# Check PM2 logs
pm2 logs

# Check systemd logs
sudo journalctl -u document-processor -n 50
sudo journalctl -u petrodealhub-frontend -n 50

# Check if ports are in use
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :8000

# Kill processes on ports if needed
sudo fuser -k 3000/tcp
sudo fuser -k 8000/tcp
```

### If sitemap not accessible:

```bash
# Check if sitemap.xml exists in public folder
ls -la public/sitemap.xml

# Check nginx configuration for static files
sudo nginx -t
sudo systemctl reload nginx
```

## 📝 Quick One-Line Deployment

If you've done this before and just need to update:

```bash
cd /opt/petrodealhub && git pull origin main && npm install && npm run build && pm2 restart all && sudo systemctl reload nginx
```

## 🔐 Security Notes

After this update:
- ✅ No console logs will appear in browser (more secure)
- ✅ No hardcoded API keys in code
- ✅ All sensitive data removed from client-side code
- ✅ Sitemap.xml added for better SEO
- ✅ Google Analytics properly configured

## 📞 Need Help?

1. Check logs first: `pm2 logs` or `sudo journalctl -u service-name`
2. Verify services are running: `pm2 status` or `sudo systemctl status service-name`
3. Test endpoints: `curl http://localhost:3000` and `curl http://localhost:8000/health`
4. Check firewall: `sudo ufw status`

---

**Last Updated:** After security cleanup and sitemap addition
**Commit:** f454a49f - "Security: Remove console logs and hardcoded keys, Add sitemap.xml and Google Analytics"

