#!/bin/bash
# Completely clean and rebuild nginx config for control.petrodealhub.com

set -e

echo "=========================================="
echo "CLEAN AND REBUILD NGINX CONFIG"
echo "=========================================="
echo ""

NGINX_CONFIG="/etc/nginx/sites-available/control"

# 1. Backup
BACKUP_FILE="${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$NGINX_CONFIG" "$BACKUP_FILE"
echo "1. ✅ Backed up to: $BACKUP_FILE"
echo ""

# 2. Check if API is accessible from nginx's perspective
echo "2. Testing API accessibility..."
if curl -s http://127.0.0.1:8000/health > /dev/null 2>&1; then
    echo "   ✅ API is accessible at 127.0.0.1:8000"
elif curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "   ✅ API is accessible at localhost:8000"
    echo "   ⚠️  Will use localhost instead of 127.0.0.1"
    API_HOST="localhost"
else
    echo "   ❌ API is not accessible!"
    exit 1
fi

API_HOST="${API_HOST:-127.0.0.1}"
echo "   Using API host: $API_HOST"
echo ""

# 3. Create completely clean nginx config
echo "3. Creating clean nginx configuration..."

cat > /tmp/control_nginx_config.conf << 'EOF'
# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name control.petrodealhub.com;
    
    return 301 https://$server_name$request_uri;
}

# HTTPS server block for control.petrodealhub.com
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name control.petrodealhub.com;
    
    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/control.petrodealhub.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/control.petrodealhub.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # CMS - served from document-processor API
    location /cms {
        proxy_pass http://API_HOST_PLACEHOLDER:8000/cms;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Cookie $http_cookie;
    }
    
    # Auth endpoints - proxy to document-processor API
    location /auth/ {
        proxy_pass http://API_HOST_PLACEHOLDER:8000/auth/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Cookie $http_cookie;
        
        # CORS headers
        add_header Access-Control-Allow-Origin $http_origin always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
        add_header Access-Control-Allow-Credentials true always;
        
        # Handle OPTIONS preflight
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin $http_origin always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
            add_header Access-Control-Allow-Credentials true always;
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://API_HOST_PLACEHOLDER:8000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # API endpoints - proxy to document-processor API (remove /api prefix)
    location /api/ {
        proxy_pass http://API_HOST_PLACEHOLDER:8000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Cookie $http_cookie;
        client_max_body_size 50M;
    }
    
    # Root - redirect to CMS
    location = / {
        return 301 /cms;
    }
    
    # Default location - try to serve from CMS, otherwise 404
    location / {
        proxy_pass http://API_HOST_PLACEHOLDER:8000/cms;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Replace API_HOST_PLACEHOLDER with actual host
sed "s/API_HOST_PLACEHOLDER/$API_HOST/g" /tmp/control_nginx_config.conf > "$NGINX_CONFIG"
rm /tmp/control_nginx_config.conf

echo "   ✅ Created clean nginx configuration"
echo ""

# 4. Show the configuration
echo "4. Showing new configuration..."
echo "   Server blocks:"
grep -n "server_name.*control.petrodealhub.com" "$NGINX_CONFIG"
echo ""
echo "   Location blocks:"
grep -n "location.*auth\|location.*health\|location.*cms\|location /api" "$NGINX_CONFIG" | head -10
echo ""

# 5. Test nginx configuration
echo "5. Testing nginx configuration..."
if sudo nginx -t 2>&1 | grep -q "successful"; then
    echo "   ✅ Nginx configuration is valid"
    sudo nginx -t 2>&1 | tail -2
else
    echo "   ❌ Nginx configuration has errors:"
    sudo nginx -t 2>&1
    echo ""
    echo "   Restoring backup..."
    sudo cp "$BACKUP_FILE" "$NGINX_CONFIG"
    exit 1
fi
echo ""

# 6. Reload nginx
echo "6. Reloading nginx..."
if sudo systemctl reload nginx 2>/dev/null; then
    echo "   ✅ Nginx reloaded successfully"
else
    echo "   ⚠️  Could not reload nginx, trying restart..."
    sudo systemctl restart nginx
    sleep 2
    echo "   ✅ Nginx restarted"
fi
echo ""

# 7. Wait for nginx to fully restart
echo "7. Waiting for nginx to fully restart..."
sleep 3
echo ""

# 8. Test endpoints
echo "8. Testing endpoints..."
echo "   Testing https://control.petrodealhub.com/health..."
HEALTH_RESPONSE=$(curl -s -k -o /dev/null -w "%{http_code}" https://control.petrodealhub.com/health 2>/dev/null || echo "000")
if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo "   ✅ /health endpoint works (200)"
    echo "   Response:"
    curl -s -k https://control.petrodealhub.com/health | head -3
elif [ "$HEALTH_RESPONSE" = "404" ]; then
    echo "   ❌ /health still returns 404"
    echo "   Checking nginx error log..."
    sudo tail -5 /var/log/nginx/error.log | grep -i "health\|8000" || echo "   No relevant errors found"
else
    echo "   ⚠️  /health returned $HEALTH_RESPONSE"
fi

echo ""
echo "   Testing https://control.petrodealhub.com/auth/me..."
AUTH_RESPONSE=$(curl -s -k -o /dev/null -w "%{http_code}" https://control.petrodealhub.com/auth/me 2>/dev/null || echo "000")
if [ "$AUTH_RESPONSE" = "401" ] || [ "$AUTH_RESPONSE" = "200" ]; then
    echo "   ✅ /auth/me endpoint works ($AUTH_RESPONSE)"
elif [ "$AUTH_RESPONSE" = "404" ]; then
    echo "   ❌ /auth/me still returns 404"
    echo "   Checking nginx error log..."
    sudo tail -5 /var/log/nginx/error.log | grep -i "auth\|8000" || echo "   No relevant errors found"
else
    echo "   ⚠️  /auth/me returned $AUTH_RESPONSE"
fi
echo ""

# 9. Final summary
echo "=========================================="
echo "CLEAN CONFIG COMPLETE"
echo "=========================================="
echo ""

if [ "$HEALTH_RESPONSE" = "200" ] && ([ "$AUTH_RESPONSE" = "401" ] || [ "$AUTH_RESPONSE" = "200" ]); then
    echo "🎉 ALL ENDPOINTS ARE NOW WORKING!"
    echo ""
    echo "✅ /health: $HEALTH_RESPONSE"
    echo "✅ /auth/me: $AUTH_RESPONSE"
    echo ""
    echo "The CMS should now work correctly at:"
    echo "   https://control.petrodealhub.com/cms"
else
    echo "⚠️  Some endpoints may still have issues"
    echo "   /health: $HEALTH_RESPONSE (expected: 200)"
    echo "   /auth/me: $AUTH_RESPONSE (expected: 401 or 200)"
    echo ""
    echo "If endpoints still return 404, check:"
    echo "   1. API is running: pm2 status python-api"
    echo "   2. API is accessible: curl http://localhost:8000/health"
    echo "   3. Nginx error log: sudo tail -20 /var/log/nginx/error.log"
fi
echo ""
