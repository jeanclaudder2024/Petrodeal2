# Frontend Restart Commands

## Check what's running:

### Option 1: Check PM2 processes
```bash
pm2 list
pm2 restart all
# OR restart specific app
pm2 restart <app-name>
```

### Option 2: Check systemd services
```bash
# List all services
sudo systemctl list-units --type=service | grep -i frontend
sudo systemctl list-units --type=service | grep -i next
sudo systemctl list-units --type=service | grep -i vite
sudo systemctl list-units --type=service | grep -i react

# If you find a service, restart it:
sudo systemctl restart <service-name>
```

### Option 3: Check if running via nginx
```bash
# Check nginx status
sudo systemctl status nginx

# If using nginx, you might need to:
# 1. Restart nginx
sudo systemctl restart nginx

# 2. Or check if frontend is served as static files
# The build output is in dist/ folder
# Nginx might be serving from there
```

### Option 4: Manual restart (if using PM2)
```bash
# Stop all PM2 processes
pm2 stop all

# Start your frontend (adjust path and command as needed)
cd /opt/petrodealhub
pm2 start npm --name "frontend" -- start
# OR if using a built version:
pm2 serve dist 3000 --name "frontend" --spa
```

## Quick Restart (Most Common):

```bash
# If using PM2:
pm2 restart all

# If using systemd, find the service first:
sudo systemctl list-units --type=service | grep -E "(frontend|next|vite|react|petro)"

# Then restart it:
sudo systemctl restart <service-name>

# If using nginx to serve static files:
sudo systemctl restart nginx
```

## Verify it's working:

```bash
# Check if frontend is accessible
curl http://localhost:3000
# OR
curl http://localhost:5173
# OR check your domain
curl https://petrodealhub.com
```

