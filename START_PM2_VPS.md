# 🚀 Start PM2 on VPS

## Problem
PM2 shows "No process found" - the app isn't running.

## Solution: Start PM2 Process

### Step 1: Check if PM2 is installed
```bash
pm2 --version
```

### Step 2: Start the application

If you have a PM2 ecosystem file:
```bash
pm2 start ecosystem.config.js
```

Or start directly:
```bash
cd /opt/petrodealhub
pm2 start npm --name "petrodealhub" -- run preview
```

Or if you're serving the built files with a server:
```bash
# If using serve
pm2 start serve --name "petrodealhub" -- -s dist -l 3000

# If using nginx to serve static files, you might not need PM2
# Just make sure nginx is configured and running
```

### Step 3: Save PM2 configuration
```bash
pm2 save
pm2 startup
```

### Step 4: Check status
```bash
pm2 status
pm2 logs petrodealhub
```

## Common PM2 Commands

```bash
# List all processes
pm2 list

# Start a process
pm2 start <app_name>

# Stop a process
pm2 stop <app_name>

# Restart a process
pm2 restart <app_name>

# Delete a process
pm2 delete <app_name>

# View logs
pm2 logs

# Monitor
pm2 monit
```

## If Using Nginx (Static Files)

If you're serving the built `dist` folder with Nginx, you might not need PM2. Just:

```bash
# Make sure nginx is running
sudo systemctl status nginx
sudo systemctl restart nginx
```

---

**Run the commands above to start your app with PM2!**

