# Check What's Running on Port 3000

## Commands to Run on VPS

### Step 1: Check ALL processes on port 3000
```bash
# Method 1: lsof
sudo lsof -i :3000

# Method 2: netstat
sudo netstat -tlnp | grep 3000

# Method 3: ss
sudo ss -tlnp | grep 3000

# Method 4: Check all Node processes
ps aux | grep node | grep -v grep
```

### Step 2: Check systemd services
```bash
# Check if there's a systemd service running on port 3000
sudo systemctl list-units | grep -E "node|vite|frontend|react|3000"

# Check all services
sudo systemctl list-units --type=service --state=running | grep -v systemd
```

### Step 3: Check if server is serving from correct location
```bash
# Check what dist folder the server might be using
find /opt -name "index-CWso2qzf.js" 2>/dev/null
find /opt -name "index-BlLrJfrv.js" 2>/dev/null

# Check if there's another build folder
ls -la /opt/petrodealhub/dist/assets/ | grep index
```

### Step 4: Test what nginx is actually proxying to
```bash
# Test if port 3000 responds
curl -I http://127.0.0.1:3000 2>&1 | head -10

# Test what JS file it's serving
curl http://127.0.0.1:3000/assets/index-*.js 2>&1 | head -5
```

### Step 5: The Real Fix - Change nginx to serve directly from dist

Since we don't know what's on port 3000, let's bypass it completely:

```bash
sudo nano /etc/nginx/sites-enabled/petrodealhub
```

Replace the `location /` block with:
```nginx
    # Serve directly from dist folder (bypass port 3000)
    root /opt/petrodealhub/dist;
    index index.html;
    
    # Disable cache for development
    location ~* \.(html|js|css)$ {
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
        add_header Pragma "no-cache" always;
        add_header Expires "0" always;
    }
    
    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy (if you have backend on different port)
    location /api/ {
        proxy_pass http://127.0.0.1:YOUR_API_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
```

Then:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

This will serve the new build directly from `/opt/petrodealhub/dist`!





