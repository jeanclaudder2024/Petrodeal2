# VPS Deployment Guide - CMS Plan Management Fix

## ✅ Changes Pushed to Git
- Fixed CMS plan management (separate broker membership from subscription plans)
- Fixed template permissions and download limits
- Updated document-processor submodule

## 🚀 Deploy to VPS - Step by Step

### Option 1: SSH into VPS and Pull Updates

```bash
# 1. SSH into your VPS
ssh your-user@your-vps-ip

# 2. Navigate to your project directory
cd /path/to/aivessel-trade-flow-main

# 3. Pull latest changes from git
git pull origin main

# 4. Update submodule (document-processor)
git submodule update --init --recursive
cd document-processor
git pull origin master
cd ..

# 5. Restart the document-processor service
# If using systemd:
sudo systemctl restart document-processor

# OR if using PM2:
pm2 restart document-processor

# OR if running manually, stop and restart:
# Find the process:
ps aux | grep "python.*main.py"
# Kill it:
kill <PID>
# Restart:
cd document-processor
python main.py &
# OR with uvicorn:
uvicorn main:app --host 0.0.0.0 --port 8000 &
```

### Option 2: Using Deployment Script

If you have a deployment script, you can create/update it:

```bash
#!/bin/bash
# deploy.sh

echo "🚀 Starting deployment..."

# Navigate to project
cd /path/to/aivessel-trade-flow-main

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Update submodule
echo "📦 Updating submodule..."
git submodule update --init --recursive
cd document-processor
git pull origin master
cd ..

# Restart services
echo "🔄 Restarting services..."
sudo systemctl restart document-processor
# OR
pm2 restart document-processor

echo "✅ Deployment complete!"
```

### Option 3: Manual File Update (if git pull doesn't work)

```bash
# 1. SSH into VPS
ssh your-user@your-vps-ip

# 2. Navigate to document-processor
cd /path/to/aivessel-trade-flow-main/document-processor

# 3. Pull changes
git pull origin master

# 4. Restart the service
sudo systemctl restart document-processor
```

## 🔍 Verify Deployment

### 1. Check if service is running:
```bash
# Check systemd service
sudo systemctl status document-processor

# OR check PM2
pm2 status

# OR check process
ps aux | grep "python.*main.py"
```

### 2. Check API is responding:
```bash
# Test health endpoint
curl http://localhost:8000/health

# OR from browser
http://your-vps-ip:8000/health
```

### 3. Test CMS:
```bash
# Access CMS
http://your-vps-ip:8000/cms/
```

## 🐛 Troubleshooting

### If service won't start:

1. **Check logs:**
```bash
# Systemd logs
sudo journalctl -u document-processor -f

# PM2 logs
pm2 logs document-processor

# Manual logs
tail -f document-processor/logs/app.log
```

2. **Check Python dependencies:**
```bash
cd document-processor
pip install -r requirements.txt
```

3. **Check port availability:**
```bash
netstat -tulpn | grep 8000
# OR
lsof -i :8000
```

4. **Check environment variables:**
```bash
# Make sure .env file exists and has correct values
cat document-processor/.env
```

### If CMS doesn't load:

1. **Check nginx configuration** (if using nginx):
```bash
sudo nginx -t
sudo systemctl reload nginx
```

2. **Check firewall:**
```bash
sudo ufw status
# Allow port 8000 if needed:
sudo ufw allow 8000/tcp
```

## 📝 Quick Commands Reference

```bash
# Pull updates
git pull && git submodule update --init --recursive

# Restart service (systemd)
sudo systemctl restart document-processor

# Restart service (PM2)
pm2 restart document-processor

# View logs
sudo journalctl -u document-processor -f
# OR
pm2 logs document-processor

# Check status
sudo systemctl status document-processor
# OR
pm2 status
```

## ✅ Post-Deployment Checklist

- [ ] Git pull completed successfully
- [ ] Submodule updated
- [ ] Service restarted
- [ ] API health check passes
- [ ] CMS accessible
- [ ] Plan management works in CMS
- [ ] Template permissions can be edited
- [ ] Download limits can be set

## 🎯 What Was Fixed

1. **Broker Membership Separation**: Broker is now correctly treated as a membership (not a subscription plan)
2. **CMS Plan Management**: Fixed template permissions editing
3. **Download Limits**: Fixed max_downloads_per_month saving and display
4. **Template Matching**: Improved template name matching in plan editor

---

**Need Help?** Check the logs first, then verify all services are running correctly.

