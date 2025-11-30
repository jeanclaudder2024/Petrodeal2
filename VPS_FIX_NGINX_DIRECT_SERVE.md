# Fix Nginx to Serve Directly from dist (Bypass Port 3000)

## Problem
Nginx is proxying to port 3000, which is serving old cached files. We need to bypass port 3000 and serve directly from `/opt/petrodealhub/dist`.

## Solution

### Step 1: Backup current nginx config
```bash
sudo cp /etc/nginx/sites-enabled/petrodealhub /etc/nginx/sites-enabled/petrodealhub.backup
```

### Step 2: Edit nginx config
```bash
sudo nano /etc/nginx/sites-enabled/petrodealhub
```

### Step 3: Find and Replace

Find this section (around line with `location /`):
```nginx
    # React App
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
```

Replace it with:
```nginx
    # React App - Serve directly from dist folder (bypass port 3000)
    root /opt/petrodealhub/dist;
    index index.html;
    
    # Disable cache for HTML/JS/CSS files
    location ~* \.(html|js|css)$ {
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
        add_header Pragma "no-cache" always;
        add_header Expires "0" always;
        add_header Last-Modified "";
    }
    
    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
    }
    
    # API proxy (if you have backend on different port - adjust port as needed)
    location /api/ {
        proxy_pass http://127.0.0.1:YOUR_API_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
```

### Step 4: Test and reload nginx
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Step 5: Verify it's working
```bash
# Check what file nginx will serve
ls -la /opt/petrodealhub/dist/index.html

# Check if new JS file exists
ls -la /opt/petrodealhub/dist/assets/index-*.js | tail -1

# Test locally (should show index.html)
curl -I http://127.0.0.1/ 2>&1 | head -5
```

### Step 6: Clear browser cache completely
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"
4. OR: `Ctrl+Shift+Delete` → Select "Cached images and files" → Clear

This will bypass port 3000 completely and serve the new build directly!





