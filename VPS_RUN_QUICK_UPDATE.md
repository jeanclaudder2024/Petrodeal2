# How to Run VPS_QUICK_UPDATE.sh on Your VPS

## Method 1: Script Already Exists on VPS (Recommended)

If you've already pushed the script to GitHub, it should be in your project directory:

```bash
# 1. SSH into your VPS
ssh root@control.petrodealhub.com

# 2. Navigate to project directory
cd /opt/petrodealhub

# 3. Pull latest code (to get the script if not already there)
git pull origin main

# 4. Make script executable
chmod +x VPS_QUICK_UPDATE.sh

# 5. Run the script
bash VPS_QUICK_UPDATE.sh
```

## Method 2: Create Script Directly on VPS

If the script doesn't exist on VPS, create it:

```bash
# 1. SSH into your VPS
ssh root@control.petrodealhub.com

# 2. Navigate to project directory
cd /opt/petrodealhub

# 3. Create the script file
nano VPS_QUICK_UPDATE.sh

# 4. Paste the script content (copy from your local file)
# Press Ctrl+X, then Y, then Enter to save

# 5. Make it executable
chmod +x VPS_QUICK_UPDATE.sh

# 6. Run it
bash VPS_QUICK_UPDATE.sh
```

## Method 3: Copy Script from Local to VPS

From your local machine (Windows):

```bash
# Using SCP (if you have SSH access configured)
scp VPS_QUICK_UPDATE.sh root@control.petrodealhub.com:/opt/petrodealhub/

# Then SSH and run:
ssh root@control.petrodealhub.com
cd /opt/petrodealhub
chmod +x VPS_QUICK_UPDATE.sh
bash VPS_QUICK_UPDATE.sh
```

## What the Script Does

1. ✅ Pulls latest code from GitHub
2. ✅ Stops any running services (PM2 or processes on port 3000)
3. ✅ Cleans build cache and node_modules
4. ✅ Reinstalls dependencies
5. ✅ Builds the React app
6. ✅ Restarts services (nginx or PM2)

## Important Notes

⚠️ **This script is for FRONTEND only** (React app)

For **BACKEND** (document-processor), you need to run separately:

```bash
cd /opt/petrodealhub/document-processor
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart document-processor
sudo systemctl reload nginx
```

## Troubleshooting

### If script fails with "Permission denied":
```bash
chmod +x VPS_QUICK_UPDATE.sh
```

### If script fails with "command not found":
```bash
# Make sure you're in the right directory
cd /opt/petrodealhub

# Check if script exists
ls -la VPS_QUICK_UPDATE.sh
```

### If git pull fails:
```bash
# Check your git status
git status

# If there are local changes, stash them first
git stash
git pull origin main
```

### If npm install fails:
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Quick One-Liner (After Script is on VPS)

```bash
cd /opt/petrodealhub && chmod +x VPS_QUICK_UPDATE.sh && bash VPS_QUICK_UPDATE.sh
```

