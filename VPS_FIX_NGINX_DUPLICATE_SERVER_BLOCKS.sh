#!/bin/bash
# Fix duplicate server blocks and ensure correct nginx configuration

set -e

echo "=========================================="
echo "FIX NGINX DUPLICATE SERVER BLOCKS"
echo "=========================================="
echo ""

NGINX_CONFIG="/etc/nginx/sites-available/control"

# 1. Backup
BACKUP_FILE="${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$NGINX_CONFIG" "$BACKUP_FILE"
echo "1. ✅ Backed up to: $BACKUP_FILE"
echo ""

# 2. Show current server blocks
echo "2. Current server blocks for control.petrodealhub.com:"
grep -n "server_name.*control.petrodealhub.com" "$NGINX_CONFIG" || echo "   None found"
echo ""

# 3. Use Python to clean up and fix the configuration
echo "3. Cleaning up duplicate server blocks and fixing configuration..."

python3 << 'PYTHON_FIX'
import re

with open('/etc/nginx/sites-available/control', 'r') as f:
    content = f.read()

# Count server blocks for control.petrodealhub.com
server_blocks = re.findall(r'server\s*\{[^}]*server_name[^}]*control\.petrodealhub\.com[^}]*\{', content, re.DOTALL)
print(f"   Found {len(server_blocks)} server block(s) for control.petrodealhub.com")

# Extract all server blocks
all_server_blocks = re.findall(r'(server\s*\{.*?\n\s*\})', content, re.DOTALL)

# Find the control.petrodealhub.com server blocks
control_blocks = []
other_blocks = []

for block in all_server_blocks:
    if 'control.petrodealhub.com' in block:
        control_blocks.append(block)
    else:
        other_blocks.append(block)

print(f"   Found {len(control_blocks)} control.petrodealhub.com block(s)")
print(f"   Found {len(other_blocks)} other server block(s)")

# Keep only the first control.petrodealhub.com server block and ensure it has all location blocks
if control_blocks:
    # Use the first one (should be the original)
    main_block = control_blocks[0]
    
    # Check what location blocks it has
    has_auth = 'location /auth/' in main_block
    has_health = 'location /health' in main_block
    has_cms = 'location /cms' in main_block
    
    print(f"   Main block has:")
    print(f"      /auth/: {has_auth}")
    print(f"      /health: {has_health}")
    print(f"      /cms: {has_cms}")
    
    # If missing location blocks, add them before the closing brace
    if not has_auth or not has_health:
        # Find the closing brace
        closing_brace_pos = main_block.rfind('}')
        
        location_blocks = []
        
        if not has_auth:
            location_blocks.append('''
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
        
        if not has_health:
            location_blocks.append('''
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:8000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }''')
        
        if location_blocks:
            # Insert before closing brace
            new_block = main_block[:closing_brace_pos] + '\n'.join(location_blocks) + '\n    }'
            main_block = new_block
            print(f"   ✅ Added {len(location_blocks)} missing location block(s)")
    
    # Check if it's HTTPS or HTTP
    is_https = 'listen 443' in main_block or 'ssl' in main_block
    is_http = 'listen 80' in main_block and not is_https
    
    if is_http:
        print("   ⚠️  Main block is HTTP (port 80) - will create proper HTTPS block")
        # Create proper HTTPS server block
        https_block = main_block.replace('listen 80', 'listen 443 ssl http2').replace('listen [::]:80', 'listen [::]:443 ssl http2')
        
        # Add SSL config if not present
        if 'ssl_certificate' not in https_block:
            # Insert SSL config after listen directives
            ssl_config = '''
    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/control.petrodealhub.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/control.petrodealhub.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
'''
            https_block = re.sub(r'(listen.*?\n)', r'\1' + ssl_config, https_block, count=2)
        
        main_block = https_block
        print("   ✅ Converted to HTTPS server block")
    
    # Rebuild the config file
    # Remove all control.petrodealhub.com blocks
    pattern = r'server\s*\{[^}]*server_name[^}]*control\.petrodealhub\.com[^}]*\{.*?\n\s*\}'
    content = re.sub(pattern, '', content, flags=re.DOTALL)
    
    # Add the fixed main block at the end
    content = content.rstrip() + '\n\n' + main_block + '\n'
    
    with open('/etc/nginx/sites-available/control', 'w') as f:
        f.write(content)
    
    print("   ✅ Removed duplicate server blocks")
    print("   ✅ Added fixed server block with all location blocks")
else:
    print("   ❌ No control.petrodealhub.com server block found - this shouldn't happen")
    sys.exit(1)

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

# 5. Show the fixed configuration
echo "5. Showing fixed configuration..."
echo "   Server blocks:"
grep -n "server_name.*control.petrodealhub.com" "$NGINX_CONFIG"
echo ""
echo "   Location blocks:"
grep -n "location.*auth\|location.*health\|location.*cms" "$NGINX_CONFIG" | head -15
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
echo "7. Testing endpoints after fix..."
sleep 2

echo "   Testing https://control.petrodealhub.com/health..."
HEALTH_RESPONSE=$(curl -s -k -o /dev/null -w "%{http_code}" https://control.petrodealhub.com/health 2>/dev/null || echo "000")
if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo "   ✅ /health endpoint works (200)"
elif [ "$HEALTH_RESPONSE" = "404" ]; then
    echo "   ❌ /health still returns 404"
else
    echo "   ⚠️  /health returned $HEALTH_RESPONSE"
fi

echo "   Testing https://control.petrodealhub.com/auth/me..."
AUTH_RESPONSE=$(curl -s -k -o /dev/null -w "%{http_code}" https://control.petrodealhub.com/auth/me 2>/dev/null || echo "000")
if [ "$AUTH_RESPONSE" = "401" ] || [ "$AUTH_RESPONSE" = "200" ]; then
    echo "   ✅ /auth/me endpoint works ($AUTH_RESPONSE)"
elif [ "$AUTH_RESPONSE" = "404" ]; then
    echo "   ❌ /auth/me still returns 404"
else
    echo "   ⚠️  /auth/me returned $AUTH_RESPONSE"
fi
echo ""

echo "=========================================="
echo "FIX COMPLETE"
echo "=========================================="
echo ""

if [ "$HEALTH_RESPONSE" = "200" ] && ([ "$AUTH_RESPONSE" = "401" ] || [ "$AUTH_RESPONSE" = "200" ]); then
    echo "🎉 ALL ENDPOINTS ARE NOW WORKING!"
    echo ""
    echo "✅ /health: $HEALTH_RESPONSE"
    echo "✅ /auth/me: $AUTH_RESPONSE"
    echo ""
    echo "The CMS should now work correctly!"
else
    echo "⚠️  Some endpoints may still have issues"
    echo "   /health: $HEALTH_RESPONSE (expected: 200)"
    echo "   /auth/me: $AUTH_RESPONSE (expected: 401 or 200)"
fi
echo ""
