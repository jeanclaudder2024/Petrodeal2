# Find and Restart Server on Port 3000

## Keep nginx config as it was (proxying to port 3000)
The nginx config is correct. We just need to restart whatever is running on port 3000.

## Find What's Running on Port 3000

### Method 1: Check PM2
```bash
pm2 list
pm2 logs --lines 20
pm2 restart all
```

### Method 2: Check systemd services
```bash
sudo systemctl list-units | grep -i "3000\|node\|vite\|react\|frontend"
sudo systemctl status frontend 2>&1 | head -10
sudo systemctl status petrodealhub 2>&1 | head -10
sudo systemctl list-units --type=service --state=running | grep -v systemd
```

### Method 3: Check what process is using port 3000
```bash
sudo lsof -i :3000
sudo netstat -tlnp | grep 3000
sudo ss -tlnp | grep 3000
```

### Method 4: Check all Node processes
```bash
ps aux | grep node | grep -v grep
ps aux | grep vite | grep -v grep
ps aux | grep "3000" | grep -v grep
```

## Once Found, Restart It

If it's PM2:
```bash
pm2 restart all
pm2 logs --lines 20
```

If it's systemd:
```bash
sudo systemctl restart frontend
# OR whatever service name you found
```

If it's a manual process:
```bash
# Find the PID
PID=$(sudo lsof -t -i:3000)
echo "PID: $PID"

# Kill it
sudo kill $PID

# Restart it (adjust command based on what you found)
cd /opt/petrodealhub
npm run preview -- --port 3000 &
# OR
nohup npm run preview -- --port 3000 > /dev/null 2>&1 &
```

## Check What Files the Server on Port 3000 Is Serving

```bash
# Test what port 3000 is serving
curl -I http://127.0.0.1:3000/ 2>&1 | head -10
curl http://127.0.0.1:3000/assets/index-*.js 2>&1 | head -5 | grep -o "index-[^.]*\.js"
```

This will show if it's serving the old file or new file.

## Verify New Build Exists

```bash
cd /opt/petrodealhub
ls -la dist/assets/index-*.js | tail -1
grep "RED BUTTON TEST" dist/assets/index-*.js | head -1
```

If the new build exists, the server on port 3000 just needs to be restarted to serve it.





