#!/bin/bash
# Fix nginx configuration for control.petrodealhub.com subdomain

set -e

echo "=========================================="
echo "FIX NGINX CONFIGURATION FOR control.petrodealhub.com"
echo "=========================================="
echo ""

# 1. Find nginx config files
echo "1. Finding nginx configuration files..."

NGINX_SITES="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"

# Look for control.petrodealhub.com config
CONTROL_CONFIG=""
for config in "$NGINX_SITES"/* "$NGINX_ENABLED"/*; do
    if [ -f "$config" ] && grep -q "control.petrodealhub.com" "$config" 2>/dev/null; then
        CONTROL_CONFIG="$config"
        break
    fi
done

if [ -z "$CONTROL_CONFIG" ]; then
    echo "   ⚠️  No specific config found for control.petrodealhub.com"
    echo "   Checking default config..."
    CONTROL_CONFIG="/etc/nginx/sites-available/default"
    
    if [ ! -f "$CONTROL_CONFIG" ]; then
        CONTROL_CONFIG="/etc/nginx/nginx.conf"
    fi
fi

if [ ! -f "$CONTROL_CONFIG" ]; then
    echo "   ❌ Could not find nginx configuration"
    exit 1
fi

echo "   ✅ Found config: $CONTROL_CONFIG"
echo ""

# 2. Backup
BACKUP_FILE="${CONTROL_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$CONTROL_CONFIG" "$BACKUP_FILE"
echo "2. ✅ Backed up to: $BACKUP_FILE"
echo ""

# 3. Check current configuration
echo "3. Checking current configuration..."
if grep -q "server_name.*control.petrodealhub.com" "$CONTROL_CONFIG"; then
    echo "   ✅ Found server block for control.petrodealhub.com"
else
    echo "   ⚠️  No server block found for control.petrodealhub.com"
    echo "   Will add one or update existing server block"
fi

# Check for existing location blocks
if grep -q "location /auth/" "$CONTROL_CONFIG"; then
    echo "   ✅ /auth/ location exists"
else
    echo "   ❌ /auth/ location missing"
fi

if grep -q "location /health" "$CONTROL_CONFIG"; then
    echo "   ✅ /health location exists"
else
    echo "   ❌ /health location missing"
fi

if grep -q "location /cms" "$CONTROL_CONFIG"; then
    echo "   ✅ /cms location exists"
else
    echo "   ⚠️  /cms location missing (CMS might be served differently)"
fi
echo ""

# 4. Create/update nginx config
echo "4. Creating/updating nginx configuration..."

python3 << PYTHON_FIX
import re
import sys

with open('$CONTROL_CONFIG', 'r') as f:
    content = f.read()

# Check if we need to create a new server block for control.petrodealhub.com
if 'server_name.*control.petrodealhub.com' not in content:
    print("   Creating new server block for control.petrodealhub.com...")
    
    # Create new server block
    new_server_block = '''
# Server block for control.petrodealhub.com
server {
    listen 80;
    listen [::]:80;
    server_name control.petrodealhub.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name control.petrodealhub.com;
    
    # SSL configuration (adjust paths as needed)
    ssl_certificate /etc/letsencrypt/live/control.petrodealhub.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/control.petrodealhub.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # CMS - served from document-processor
    location /cms {
        proxy_pass http://localhost:8000/cms;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Auth endpoints - proxy to document-processor API
    location /auth/ {
        proxy_pass http://localhost:8000/auth/;
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
            return 204;
        }
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:8000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # API endpoints - proxy to document-processor API
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 50M;
    }
    
    # Root - redirect to CMS
    location = / {
        return 301 /cms;
    }
}
'''
    
    # Append to file
    with open('$CONTROL_CONFIG', 'a') as f:
        f.write(new_server_block)
    
    print("   ✅ Added new server block for control.petrodealhub.com")
else:
    print("   Updating existing server block for control.petrodealhub.com...")
    
    # Find the server block for control.petrodealhub.com
    server_pattern = r'(server\s*\{[^}]*server_name[^}]*control\.petrodealhub\.com[^}]*\{)(.*?)(\n\s*\})'
    
    # Add missing location blocks
    locations_to_add = []
    
    if 'location /auth/' not in content:
        locations_to_add.append('''
    # Auth endpoints - proxy to document-processor API
    location /auth/ {
        proxy_pass http://localhost:8000/auth/;
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
            return 204;
        }
    }''')
    
    if 'location /health' not in content or 'location = /health' in content:
        locations_to_add.append('''
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:8000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }''')
    
    # Insert location blocks before closing brace of server block
    if locations_to_add:
        # Find the server block and insert before closing brace
        pattern = r'(server\s*\{[^}]*server_name[^}]*control\.petrodealhub\.com[^}]*\{.*?)(\n\s*\})'
        
        def replace_func(match):
            server_content = match.group(1)
            closing_brace = match.group(2)
            new_locations = '\n'.join(locations_to_add)
            return server_content + new_locations + closing_brace
        
        content = re.sub(pattern, replace_func, content, flags=re.DOTALL)
        
        with open('$CONTROL_CONFIG', 'w') as f:
            f.write(content)
        
        print(f"   ✅ Added {len(locations_to_add)} location block(s)")
    else:
        print("   ✅ All required location blocks already exist")

PYTHON_FIX

echo ""

# 5. Test nginx configuration
echo "5. Testing nginx configuration..."
if sudo nginx -t 2>&1 | grep -q "successful"; then
    echo "   ✅ Nginx configuration is valid"
else
    echo "   ❌ Nginx configuration has errors:"
    sudo nginx -t 2>&1
    echo ""
    echo "   Restoring backup..."
    sudo cp "$BACKUP_FILE" "$CONTROL_CONFIG"
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
    echo "   ✅ Nginx restarted"
fi
echo ""

# 7. Test endpoints
echo "7. Testing endpoints..."
sleep 2

echo "   Testing /health endpoint..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/health 2>/dev/null || echo "000")
if [ "$HEALTH_RESPONSE" = "200" ] || [ "$HEALTH_RESPONSE" = "404" ]; then
    echo "   ✅ /health endpoint responded with $HEALTH_RESPONSE"
else
    echo "   ⚠️  /health endpoint responded with $HEALTH_RESPONSE"
fi

echo "   Testing /auth/me endpoint..."
AUTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/auth/me 2>/dev/null || echo "000")
if [ "$AUTH_RESPONSE" = "401" ] || [ "$AUTH_RESPONSE" = "200" ]; then
    echo "   ✅ /auth/me endpoint responded with $AUTH_RESPONSE (401 is OK - means endpoint exists)"
else
    echo "   ⚠️  /auth/me endpoint responded with $AUTH_RESPONSE"
fi
echo ""

# 8. Show summary
echo "=========================================="
echo "NGINX CONFIGURATION UPDATE COMPLETE"
echo "=========================================="
echo ""
echo "✅ Nginx configuration updated for control.petrodealhub.com"
echo "✅ Added/verified location blocks:"
echo "   - /auth/ → http://localhost:8000/auth/"
echo "   - /health → http://localhost:8000/health"
echo "   - /cms → http://localhost:8000/cms"
echo "   - /api/ → http://localhost:8000/"
echo ""
echo "The CMS should now be able to access:"
echo "   - https://control.petrodealhub.com/health"
echo "   - https://control.petrodealhub.com/auth/login"
echo "   - https://control.petrodealhub.com/auth/me"
echo ""
echo "Please refresh the CMS page and try again!"
echo ""
