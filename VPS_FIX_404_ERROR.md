# Fix 404 Error - Nginx Can't Find Files

## Problem
Getting 404 Not Found after changing nginx to serve from dist folder.

## Solution

### Step 1: Check if dist folder exists and has correct permissions
```bash
cd /opt/petrodealhub
ls -la dist/
ls -la dist/index.html
ls -la dist/assets/ | head -5
```

### Step 2: Check nginx user and permissions
```bash
# Check who nginx runs as
ps aux | grep nginx | grep -v grep | head -2

# Check if nginx user can read the files
sudo -u www-data ls -la /opt/petrodealhub/dist/ 2>&1
# OR if nginx user is 'nginx':
sudo -u nginx ls -la /opt/petrodealhub/dist/ 2>&1
```

### Step 3: Fix permissions if needed
```bash
# Make sure dist folder is readable
sudo chmod -R 755 /opt/petrodealhub/dist
sudo chown -R $USER:www-data /opt/petrodealhub/dist
# OR if nginx user is 'nginx':
sudo chown -R $USER:nginx /opt/petrodealhub/dist
```

### Step 4: Verify nginx config is correct
```bash
sudo nginx -t
```

If there's an error, the issue might be:
1. Nested location blocks (some nginx versions don't support this well)
2. Wrong root path

### Step 5: Use correct nginx config (no nested locations)

Edit nginx config:
```bash
sudo nano /etc/nginx/sites-enabled/petrodealhub
```

Use this structure (regex location FIRST, then root location):
```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name petrodealhub.com www.petrodealhub.com;

    # SSL config...
    ssl_certificate /etc/letsencrypt/live/petrodealhub.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/petrodealhub.com/privkey.pem;
    # ... other SSL settings ...

    # Root directory
    root /opt/petrodealhub/dist;
    index index.html;

    # Disable cache for HTML/JS/CSS (must come before location /)
    location ~* \.(html|js|css)$ {
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
        add_header Pragma "no-cache" always;
        add_header Expires "0" always;
        try_files $uri =404;
    }

    # Serve all other files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy if you have backend (adjust port as needed)
    location /api/ {
        proxy_pass http://127.0.0.1:YOUR_API_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Step 6: Test and reload
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Step 7: Test directly
```bash
# Test if nginx can read the files
curl -I http://127.0.0.1/ 2>&1 | head -5

# Test if file exists
curl -I http://127.0.0.1/index.html 2>&1 | head -5

# Check nginx error log
sudo tail -20 /var/log/nginx/error.log
```





