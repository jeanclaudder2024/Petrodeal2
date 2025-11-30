# Fix Port 3000 Server Serving Old Files

## Problem
Nginx is proxying to `http://127.0.0.1:3000` instead of serving static files. The server on port 3000 is serving old cached files.

## Solution Options

### Option 1: Check What's Running on Port 3000

```bash
# Check what process is using port 3000
sudo lsof -i :3000
# OR
sudo netstat -tlnp | grep 3000
# OR
sudo ss -tlnp | grep 3000

# Check if PM2 is running the frontend
pm2 list

# Check if it's a Node.js dev server
ps aux | grep node | grep 3000
```

### Option 2: Restart the Server on Port 3000

If it's PM2:
```bash
pm2 restart all
pm2 logs --lines 50
```

If it's a Node.js process:
```bash
# Find and kill it
sudo kill $(sudo lsof -t -i:3000)
# Then restart it (you'll need to know how you start it)
```

### Option 3: Change Nginx to Serve Static Files Directly

Instead of proxying, serve from `dist` folder:

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name petrodealhub.com www.petrodealhub.com;

    ssl_certificate /etc/letsencrypt/live/petrodealhub.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/petrodealhub.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Root directory - point to dist folder
    root /opt/petrodealhub/dist;
    index index.html;

    # Disable cache for HTML/JS/CSS
    location ~* \.(html|js|css)$ {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy (if you have backend API)
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

Then reload nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```





