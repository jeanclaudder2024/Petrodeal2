# Quick Guide: Restart Server & Deploy to VPS

## 🔄 How to Restart Server to Show Updates

### **Option 1: Restart Backend (Document Processor API)**

#### If using PM2 (Most Common):
```bash
# SSH into your VPS
ssh your-user@your-vps-ip

# Navigate to document-processor directory
cd /opt/petrodealhub/document-processor
# OR
cd ~/aivessel-trade-flow-main/document-processor

# Restart the backend
pm2 restart python-api
# OR
pm2 restart petrodealhub-api
# OR restart all
pm2 restart all

# Check status
pm2 status
pm2 logs python-api --lines 50
```

#### If using systemd:
```bash
# Restart the service
sudo systemctl restart document-processor
# OR
sudo systemctl restart petrodealhub-api

# Check status
sudo systemctl status document-processor
```

### **Option 2: Restart Frontend (React App)**

```bash
# Navigate to project root
cd /opt/petrodealhub
# OR
cd ~/aivessel-trade-flow-main

# If using PM2
pm2 restart petrodealhub-app

# If using systemd
sudo systemctl restart react-app

# If nginx is serving directly
sudo systemctl reload nginx
```

---

## 🚀 How to Push Updates to VPS

### **Method 1: Quick Update (Recommended)**

1. **Push to Git (from your local machine):**
```bash
# Make sure you're in the document-processor directory
cd document-processor

# Commit and push your changes
git add .
git commit -m "Your commit message"
git push origin master
```

2. **SSH into VPS and run quick update:**
```bash
# SSH into VPS
ssh your-user@your-vps-ip

# Navigate to project directory
cd /opt/petrodealhub
# OR
cd ~/aivessel-trade-flow-main

# Run the quick update script
bash VPS_QUICK_UPDATE.sh
```

### **Method 2: Manual Update (Step by Step)**

1. **SSH into VPS:**
```bash
ssh your-user@your-vps-ip
```

2. **Navigate to project directory:**
```bash
cd /opt/petrodealhub
# OR
cd ~/aivessel-trade-flow-main
```

3. **Pull latest code:**
```bash
# For main project
git pull origin main
# OR
git pull origin master

# For document-processor subdirectory
cd document-processor
git pull origin master
```

4. **Restart backend:**
```bash
# If using PM2
pm2 restart python-api

# If using systemd
sudo systemctl restart document-processor
```

5. **Restart frontend (if needed):**
```bash
cd /opt/petrodealhub
npm run build
sudo systemctl reload nginx
```

### **Method 3: Complete Deployment Script**

```bash
# SSH into VPS
ssh your-user@your-vps-ip

# Run the complete deployment script
cd /opt/petrodealhub
bash deploy-petrodealhub.sh
```

---

## 📋 Complete Update Process (Backend + Frontend)

### **Step 1: Push Changes to Git (Local Machine)**
```bash
# In document-processor directory
cd document-processor
git add .
git commit -m "Update: Fix AI random data generation"
git push origin master

# If you also updated frontend
cd ..
git add .
git commit -m "Update: Frontend changes"
git push origin main
```

### **Step 2: Update on VPS**

```bash
# SSH into VPS
ssh your-user@your-vps-ip

# Update backend
cd /opt/petrodealhub/document-processor
git pull origin master
pm2 restart python-api

# Update frontend
cd /opt/petrodealhub
git pull origin main
npm run build
sudo systemctl reload nginx
```

---

## 🔍 Verify Updates Are Live

### **Check Backend:**
```bash
# Test API health endpoint
curl http://localhost:8000/health
# OR
curl http://localhost:8000/api/health

# Check PM2 logs
pm2 logs python-api --lines 50
```

### **Check Frontend:**
```bash
# Test if frontend is serving
curl http://localhost:3000
# OR check in browser
# Clear browser cache (Ctrl+Shift+R) to see changes
```

---

## 🛠️ Troubleshooting

### **If backend won't restart:**
```bash
# Check what's running
pm2 list
ps aux | grep python

# Kill existing process
pm2 delete python-api
# OR
lsof -ti:8000 | xargs kill -9

# Start fresh
cd /opt/petrodealhub/document-processor
pm2 start "python main.py" --name python-api
pm2 save
```

### **If frontend won't update:**
```bash
# Clear build cache
rm -rf dist node_modules/.vite .vite .cache

# Rebuild
npm run build

# Restart nginx
sudo systemctl restart nginx
```

### **Check service status:**
```bash
# Backend
pm2 status
sudo systemctl status document-processor

# Frontend
sudo systemctl status nginx
sudo systemctl status react-app
```

---

## 📝 Quick Commands Reference

```bash
# Restart backend
pm2 restart python-api

# Restart frontend
pm2 restart petrodealhub-app

# Pull latest code
git pull origin master

# View logs
pm2 logs python-api
pm2 logs petrodealhub-app

# Check status
pm2 status
sudo systemctl status document-processor
```

---

## ⚡ One-Line Quick Restart (Backend Only)

```bash
cd /opt/petrodealhub/document-processor && git pull origin master && pm2 restart python-api && pm2 logs python-api --lines 20
```

---

## ⚡ One-Line Quick Update (Everything)

```bash
cd /opt/petrodealhub && git pull origin main && cd document-processor && git pull origin master && pm2 restart all && cd .. && npm run build && sudo systemctl reload nginx
```


