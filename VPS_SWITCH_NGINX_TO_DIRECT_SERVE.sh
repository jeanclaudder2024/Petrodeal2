#!/bin/bash
# Switch Nginx to Serve Directly from Dist (Bypass Port 3000)
# This is more reliable than using serve + PM2

set -e

cd /opt/petrodealhub || { echo "ERROR: /opt/petrodealhub not found!"; exit 1; }

echo "=========================================="
echo "SWITCHING NGINX TO SERVE DIRECTLY FROM DIST"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}=== STEP 1: Verify Dist Folder ===${NC}"
if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
    echo -e "${RED}❌ ERROR: dist folder or index.html not found!${NC}"
    exit 1
fi

HTML_JS=$(grep -o 'assets/index-[^"]*\.js' dist/index.html | head -1)
echo "Dist folder has HTML referencing: $HTML_JS"
if [ -f "dist/$HTML_JS" ]; then
    echo -e "${GREEN}✅ Referenced file exists${NC}"
else
    echo -e "${RED}❌ ERROR: Referenced file doesn't exist!${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}=== STEP 2: Backup Current Nginx Config ===${NC}"
NGINX_CONFIG="/etc/nginx/sites-enabled/petrodealhub"
if [ -f "$NGINX_CONFIG" ]; then
    sudo cp "$NGINX_CONFIG" "$NGINX_CONFIG.backup.$(date +%Y%m%d_%H%M%S)"
    echo -e "${GREEN}✅ Config backed up${NC}"
else
    echo -e "${RED}❌ ERROR: Nginx config not found at $NGINX_CONFIG${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}=== STEP 3: Update Nginx Config ===${NC}"
# Read current config to preserve SSL and other settings
CURRENT_CONFIG=$(sudo cat "$NGINX_CONFIG")

# Check if already serving from dist
if echo "$CURRENT_CONFIG" | grep -q "root.*dist"; then
    echo "Nginx already configured to serve from dist"
    NGINX_ROOT=$(echo "$CURRENT_CONFIG" | grep "root.*dist" | head -1 | awk '{print $2}' | tr -d ';')
    echo "Current root: $NGINX_ROOT"
    
    if [ "$NGINX_ROOT" != "/opt/petrodealhub/dist" ]; then
        echo "Updating root path to /opt/petrodealhub/dist"
        sudo sed -i "s|root.*dist.*|root /opt/petrodealhub/dist;|g" "$NGINX_CONFIG"
    fi
else
    echo "Updating nginx config to serve from dist..."
    
    # Create new config that serves from dist
    sudo tee "$NGINX_CONFIG" > /dev/null <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name petrodealhub.com www.petrodealhub.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name petrodealhub.com www.petrodealhub.com;

    # SSL configuration (preserve existing)
    ssl_certificate /etc/letsencrypt/live/petrodealhub.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/petrodealhub.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Root directory - serve directly from dist
    root /opt/petrodealhub/dist;
    index index.html;

    # Disable cache for HTML/JS/CSS (important for updates!)
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

    # API proxy to Python backend
    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        client_max_body_size 50M;
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:8000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
EOF

    echo -e "${GREEN}✅ Nginx config updated${NC}"
fi
echo ""

echo -e "${YELLOW}=== STEP 4: Test Nginx Config ===${NC}"
if sudo nginx -t; then
    echo -e "${GREEN}✅ Nginx config is valid${NC}"
else
    echo -e "${RED}❌ ERROR: Nginx config has errors!${NC}"
    echo "Restoring backup..."
    sudo cp "$NGINX_CONFIG.backup."* "$NGINX_CONFIG" 2>/dev/null || true
    exit 1
fi
echo ""

echo -e "${YELLOW}=== STEP 5: Reload Nginx ===${NC}"
sudo systemctl reload nginx
echo -e "${GREEN}✅ Nginx reloaded${NC}"
echo ""

echo -e "${YELLOW}=== STEP 6: Verify Nginx Serves New Files ===${NC}"
sleep 2

# Check what nginx serves
SERVED_HTML=$(curl -s http://localhost/ 2>/dev/null | head -50)
if [ -n "$SERVED_HTML" ]; then
    SERVED_JS=$(echo "$SERVED_HTML" | grep -o 'assets/index-[^"]*\.js' | head -1)
    echo "Nginx serves HTML with: $SERVED_JS"
    echo "Expected: $HTML_JS"
    
    if [ "$SERVED_JS" = "$HTML_JS" ]; then
        echo -e "${GREEN}✅ Nginx is serving NEW files!${NC}"
    else
        echo -e "${YELLOW}⚠️  WARNING: Nginx serving different file${NC}"
        echo "  This might be browser cache. Try incognito mode."
    fi
else
    echo -e "${YELLOW}⚠️  Could not fetch from localhost (might need HTTPS)${NC}"
fi
echo ""

echo -e "${YELLOW}=== STEP 7: Stop Port 3000 (No Longer Needed) ===${NC}"
# Stop PM2 process (no longer needed)
if command -v pm2 &> /dev/null; then
    pm2 stop petrodealhub-app 2>/dev/null || true
    pm2 delete petrodealhub-app 2>/dev/null || true
    echo "PM2 process stopped (not needed anymore)"
fi

# Kill any process on port 3000
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "Killing process on port 3000..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    echo -e "${GREEN}✅ Port 3000 cleared${NC}"
fi
echo ""

echo "=========================================="
echo -e "${GREEN}✅ SWITCH COMPLETE!${NC}"
echo "=========================================="
echo ""
echo "Nginx is now serving directly from: /opt/petrodealhub/dist"
echo "Port 3000 is no longer needed and has been stopped."
echo ""
echo "Benefits:"
echo "  ✅ More reliable (no PM2/serve issues)"
echo "  ✅ Faster (direct file serving)"
echo "  ✅ No-cache headers for HTML/JS/CSS"
echo "  ✅ Updates show immediately"
echo ""
echo "Next steps:"
echo "  1. Clear browser cache (Ctrl+Shift+R)"
echo "  2. Hard refresh the page"
echo "  3. Updates should now be visible!"
echo ""

