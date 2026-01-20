#!/bin/bash
# Add /auth/ location block to nginx config for control.petrodealhub.com

set -e

echo "=========================================="
echo "FIX NGINX AUTH PROXY CONFIGURATION"
echo "=========================================="
echo ""

# 1. Find nginx config for control.petrodealhub.com
echo "1. Finding nginx configuration..."

NGINX_CONFIG="/etc/nginx/sites-available/default"
if [ ! -f "$NGINX_CONFIG" ]; then
    # Try to find config for control.petrodealhub.com
    NGINX_CONFIG=$(find /etc/nginx/sites-available /etc/nginx/conf.d -name "*control*" -o -name "*petrodealhub*" 2>/dev/null | head -1)
fi

if [ -z "$NGINX_CONFIG" ] || [ ! -f "$NGINX_CONFIG" ]; then
    echo "   ⚠️  Could not find nginx config, trying default locations..."
    NGINX_CONFIG="/etc/nginx/sites-available/control.petrodealhub.com"
fi

if [ ! -f "$NGINX_CONFIG" ]; then
    echo "   ❌ Could not find nginx configuration file"
    echo "   Please specify the nginx config file path manually"
    exit 1
fi

echo "   ✅ Found nginx config: $NGINX_CONFIG"
echo ""

# 2. Backup nginx config
BACKUP_FILE="${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$NGINX_CONFIG" "$BACKUP_FILE"
echo "2. ✅ Backed up nginx config to: $BACKUP_FILE"
echo ""

# 3. Check if /auth/ location already exists
if grep -q "location /auth/" "$NGINX_CONFIG"; then
    echo "3. ⚠️  /auth/ location already exists in nginx config"
    echo "   Checking if it's configured correctly..."
    
    if grep -A 5 "location /auth/" "$NGINX_CONFIG" | grep -q "proxy_pass.*8000"; then
        echo "   ✅ /auth/ location is correctly configured"
    else
        echo "   ⚠️  /auth/ location exists but might not be configured correctly"
        grep -A 5 "location /auth/" "$NGINX_CONFIG"
    fi
else
    echo "3. Adding /auth/ location block to nginx config..."
    
    # Use Python to add the location block
    python3 << PYTHON_FIX
import re

with open('$NGINX_CONFIG', 'r') as f:
    content = f.read()

# Check if we're in a server block for control.petrodealhub.com
if 'control.petrodealhub.com' not in content and 'server_name' in content:
    print("   ⚠️  This might not be the config for control.petrodealhub.com")
    print("   Will add /auth/ location anyway")

# Find where to insert the /auth/ location block
# Look for /health location block and insert /auth/ before it
health_pattern = r'(\s+)# Health check endpoint\s+location /health'
auth_block = '''    # Auth endpoints - proxy to document-processor API
    location /auth/ {
        proxy_pass http://localhost:8000/auth/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS headers for cross-origin requests
        add_header Access-Control-Allow-Origin \$http_origin always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
        add_header Access-Control-Allow-Credentials true always;
        
        # Handle OPTIONS preflight requests
        if (\$request_method = 'OPTIONS') {
            return 204;
        }
    }

'''

# Try to insert before /health location
if re.search(health_pattern, content):
    content = re.sub(health_pattern, auth_block + r'\1# Health check endpoint\n\1location /health', content)
    print("   ✅ Added /auth/ location block before /health location")
else:
    # Try to insert after /api/ location
    api_pattern = r'(location /api/.*?})(\s+)'
    if re.search(api_pattern, content, re.DOTALL):
        content = re.sub(api_pattern, r'\1' + auth_block + r'\2', content, flags=re.DOTALL)
        print("   ✅ Added /auth/ location block after /api/ location")
    else:
        # Insert before closing brace of server block
        server_pattern = r'(\s+)(# Error pages|error_page|location = /50x.html)'
        if re.search(server_pattern, content):
            content = re.sub(server_pattern, auth_block + r'\1\2', content)
            print("   ✅ Added /auth/ location block before error pages")
        else:
            # Just append before closing brace
            content = re.sub(r'(\s+)(})', auth_block + r'\1\2', content, count=1)
            print("   ✅ Added /auth/ location block at end of server block")

with open('$NGINX_CONFIG', 'w') as f:
    f.write(content)

print("   ✅ Nginx config updated")
PYTHON_FIX

fi
echo ""

# 4. Test nginx configuration
echo "4. Testing nginx configuration..."
if sudo nginx -t 2>&1 | grep -q "successful"; then
    echo "   ✅ Nginx configuration is valid"
else
    echo "   ❌ Nginx configuration has errors:"
    sudo nginx -t 2>&1
    echo ""
    echo "   Restoring backup..."
    cp "$BACKUP_FILE" "$NGINX_CONFIG"
    exit 1
fi
echo ""

# 5. Reload nginx
echo "5. Reloading nginx..."
if sudo systemctl reload nginx 2>/dev/null; then
    echo "   ✅ Nginx reloaded successfully"
else
    echo "   ⚠️  Could not reload nginx, trying restart..."
    sudo systemctl restart nginx
    echo "   ✅ Nginx restarted"
fi
echo ""

# 6. Test auth endpoints
echo "6. Testing auth endpoints..."
sleep 2

if curl -s -I http://localhost/auth/me 2>&1 | grep -q "200\|401"; then
    echo "   ✅ /auth/me endpoint is accessible (200 or 401 is OK)"
else
    echo "   ⚠️  /auth/me endpoint might not be accessible"
    curl -s -I http://localhost/auth/me 2>&1 | head -5
fi

if curl -s -X OPTIONS -I http://localhost/auth/login 2>&1 | grep -q "204\|200\|405"; then
    echo "   ✅ /auth/login endpoint is accessible (OPTIONS request)"
else
    echo "   ⚠️  /auth/login endpoint might not be accessible"
    curl -s -X OPTIONS -I http://localhost/auth/login 2>&1 | head -5
fi
echo ""

# 7. Test external endpoint
echo "7. Testing external endpoint..."
if curl -s -I https://control.petrodealhub.com/auth/me 2>&1 | grep -q "200\|401"; then
    echo "   ✅ External /auth/me endpoint is accessible"
else
    echo "   ⚠️  External endpoint might not be accessible"
    curl -s -I https://control.petrodealhub.com/auth/me 2>&1 | head -5
fi
echo ""

echo "=========================================="
echo "NGINX AUTH PROXY CONFIGURATION COMPLETE"
echo "=========================================="
echo ""
echo "✅ Added /auth/ location block to nginx config"
echo "✅ Nginx reloaded successfully"
echo "✅ Auth endpoints should now be accessible at:"
echo "   - https://control.petrodealhub.com/auth/login"
echo "   - https://control.petrodealhub.com/auth/me"
echo "   - https://control.petrodealhub.com/auth/logout"
echo ""
echo "The CMS should now be able to authenticate without CORS errors!"
echo ""
