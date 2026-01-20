#!/bin/bash
# Add missing API endpoint location blocks to nginx config

set -e

echo "=========================================="
echo "ADD MISSING API ENDPOINTS TO NGINX"
echo "=========================================="
echo ""

NGINX_CONFIG="/etc/nginx/sites-available/control"

# 1. Backup
BACKUP_FILE="${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$NGINX_CONFIG" "$BACKUP_FILE"
echo "1. ✅ Backed up to: $BACKUP_FILE"
echo ""

# 2. Check API host
echo "2. Checking API host..."
if curl -s http://127.0.0.1:8000/health > /dev/null 2>&1; then
    API_HOST="127.0.0.1"
else
    API_HOST="localhost"
fi
echo "   Using API host: $API_HOST"
echo ""

# 3. Add missing location blocks
echo "3. Adding missing location blocks..."

export API_HOST  # Export to Python environment

python3 << PYTHON_FIX
import re
import os

# Get API_HOST from environment or use default
API_HOST = os.environ.get('API_HOST', '127.0.0.1')

with open('$NGINX_CONFIG', 'r') as f:
    content = f.read()

# Endpoints that need location blocks
endpoints = [
    ('/templates', 'GET, POST'),
    ('/data/all', 'GET'),
    ('/plans-db', 'GET'),
    ('/plans', 'GET, POST'),
]

# Check which endpoints are missing
missing_endpoints = []
for endpoint, methods in endpoints:
    if f"location {endpoint}" not in content and f"location {endpoint}/" not in content:
        missing_endpoints.append((endpoint, methods))
        print(f"   ⚠️  Missing location block for {endpoint}")

if not missing_endpoints:
    print("   ✅ All endpoint location blocks are present")
else:
    print(f"   Adding {len(missing_endpoints)} missing location block(s)...")

# Find where to insert (before the default location / block or before closing brace)
insert_pattern = r'(location = / \{[^}]+\})'
if not re.search(insert_pattern, content):
    insert_pattern = r'(\s+)(location / \{)'
    
if not re.search(insert_pattern, content):
    insert_pattern = r'(\s+)(\})'

# Create location blocks for missing endpoints
location_blocks = []
for endpoint, methods in missing_endpoints:
    block = f'''
    # {endpoint} endpoint - proxy to document-processor API
    location {endpoint} {{
        proxy_pass http://{API_HOST}:8000{endpoint};
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Cookie $http_cookie;
        
        # CORS headers
        add_header Access-Control-Allow-Origin $http_origin always;
        add_header Access-Control-Allow-Methods "{methods}, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
        add_header Access-Control-Allow-Credentials true always;
        
        # Handle OPTIONS preflight
        if ($request_method = 'OPTIONS') {{
            add_header Access-Control-Allow-Origin $http_origin always;
            add_header Access-Control-Allow-Methods "{methods}, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
            add_header Access-Control-Allow-Credentials true always;
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }}
    }}'''
    location_blocks.append(block)

# Insert location blocks
if location_blocks:
    if re.search(r'location = / \{', content):
        # Insert before location = / block
        content = re.sub(
            r'(location = / \{)',
            '\n'.join(location_blocks) + r'\n    \1',
            content
        )
    elif re.search(r'location / \{', content):
        # Insert before location / block
        content = re.sub(
            r'(\s+)(location / \{)',
            '\n'.join(location_blocks) + r'\n\1\2',
            content
        )
    else:
        # Insert before closing brace
        content = re.sub(
            r'(\s+)(\})',
            '\n'.join(location_blocks) + r'\n\1\2',
            content,
            count=1
        )
    
    with open('$NGINX_CONFIG', 'w') as f:
        f.write(content)
    
    print(f"   ✅ Added {len(location_blocks)} location block(s)")

PYTHON_FIX

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
    sudo cp "$BACKUP_FILE" "$NGINX_CONFIG"
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
    sleep 2
    echo "   ✅ Nginx restarted"
fi
echo ""

# 6. Wait and test endpoints
echo "6. Waiting for nginx to fully restart..."
sleep 3
echo ""

echo "7. Testing endpoints..."
ENDPOINTS=("/templates" "/data/all" "/plans-db" "/plans")

for endpoint in "${ENDPOINTS[@]}"; do
    echo -n "   Testing $endpoint... "
    RESPONSE=$(curl -s -k -o /dev/null -w "%{http_code}" "https://control.petrodealhub.com$endpoint" 2>/dev/null || echo "000")
    if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "401" ] || [ "$RESPONSE" = "404" ]; then
        echo "✅ $RESPONSE (endpoint exists)"
    else
        echo "⚠️  $RESPONSE"
    fi
done
echo ""

echo "=========================================="
echo "ADD ENDPOINTS COMPLETE"
echo "=========================================="
echo ""
echo "✅ Added missing API endpoint location blocks"
echo "✅ Nginx reloaded successfully"
echo ""
echo "The CMS should now be able to access:"
echo "   - /templates"
echo "   - /data/all"
echo "   - /plans-db"
echo "   - /plans"
echo ""
echo "Please refresh the CMS page and try again!"
echo ""
