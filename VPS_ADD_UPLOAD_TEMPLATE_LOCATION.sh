#!/bin/bash
# Add missing /upload-template location block to nginx

set -e

NGINX_CONFIG="/etc/nginx/sites-available/control"

echo "=========================================="
echo "ADD /upload-template LOCATION BLOCK"
echo "=========================================="
echo ""

# 1. Backup
BACKUP_FILE="${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$NGINX_CONFIG" "$BACKUP_FILE"
echo "1. ✅ Backed up to: $BACKUP_FILE"
echo ""

# 2. Check if location already exists
echo "2. Checking if /upload-template location exists..."
if grep -q "location.*upload-template" "$NGINX_CONFIG"; then
    echo "   ✅ Location block already exists"
    grep -A 10 "location.*upload-template" "$NGINX_CONFIG" | head -11
    echo ""
    echo "   ✅ No changes needed"
    exit 0
else
    echo "   ❌ Location block not found - will add it"
fi
echo ""

# 3. Find the server block for control.petrodealhub.com
echo "3. Finding server block for control.petrodealhub.com..."
if grep -q "server_name.*control.petrodealhub.com" "$NGINX_CONFIG"; then
    echo "   ✅ Found server block"
else
    echo "   ❌ Server block not found"
    exit 1
fi
echo ""

# 4. Add location block using Python
echo "4. Adding /upload-template location block..."
python3 << 'PYTHON_FIX'
import re

with open('/etc/nginx/sites-available/control', 'r') as f:
    content = f.read()

# Check if location already exists
if 'location /upload-template' in content or 'location ~ /upload-template' in content:
    print("   ℹ️  Location block already exists")
else:
    # Find where to insert - before location = / or before closing brace
    # Look for existing /templates location or /api/ location as reference
    
    # Pattern 1: Add after /templates location if it exists
    templates_pattern = r'(location\s+[^{]*templates[^{]*\{[^}]*\})'
    if re.search(templates_pattern, content):
        # Insert after /templates location
        location_block = """
    # Upload template endpoint
    location /upload-template {
        proxy_pass http://localhost:8000/upload-template;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 50M;
        
        # CORS headers
        add_header Access-Control-Allow-Origin $http_origin always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
        add_header Access-Control-Allow-Credentials true always;
        
        # Handle OPTIONS preflight
        if ($request_method = OPTIONS) {
            add_header Access-Control-Allow-Origin $http_origin always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
            add_header Access-Control-Allow-Credentials true always;
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
    }"""
        
        # Find last } of templates location and insert after it
        match = list(re.finditer(templates_pattern, content))[-1]
        insert_pos = match.end()
        
        # Find the next line after the closing brace
        while insert_pos < len(content) and content[insert_pos] in ' \t\n':
            insert_pos += 1
        
        content = content[:insert_pos] + location_block + '\n' + content[insert_pos:]
        print("   ✅ Added after /templates location block")
    
    # Pattern 2: Add before location = / block
    elif 'location = /' in content or 'location / {' in content:
        location_block = """
    # Upload template endpoint
    location /upload-template {
        proxy_pass http://localhost:8000/upload-template;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 50M;
        
        # CORS headers
        add_header Access-Control-Allow-Origin $http_origin always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
        add_header Access-Control-Allow-Credentials true always;
        
        # Handle OPTIONS preflight
        if ($request_method = OPTIONS) {
            add_header Access-Control-Allow-Origin $http_origin always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
            add_header Access-Control-Allow-Credentials true always;
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
    }"""
        
        # Insert before location = / or location / {
        pattern = r'(location\s*=\s*/|location\s+/\s*\{)'
        match = re.search(pattern, content)
        if match:
            insert_pos = match.start()
            # Find start of line
            while insert_pos > 0 and content[insert_pos - 1] != '\n':
                insert_pos -= 1
            content = content[:insert_pos] + location_block + '\n    ' + content[insert_pos:]
            print("   ✅ Added before location = / block")
        else:
            # Pattern 3: Add before closing brace of server block
            lines = content.split('\n')
            for i in range(len(lines) - 1, -1, -1):
                if re.match(r'\s*\}\s*$', lines[i]) and i > 0:
                    # Check if it's the server block (not too indented)
                    indent = len(lines[i]) - len(lines[i].lstrip())
                    if indent <= 4:
                        # Insert before closing brace
                        lines.insert(i, location_block)
                        content = '\n'.join(lines)
                        print("   ✅ Added before server block closing brace")
                        break
    
    # Save the file
    with open('/etc/nginx/sites-available/control', 'w') as f:
        f.write(content)
    print("   ✅ Configuration updated")

PYTHON_FIX

echo ""

# 5. Verify the location block was added
echo "5. Verifying location block was added..."
if grep -q "location.*upload-template" "$NGINX_CONFIG"; then
    echo "   ✅ Location block found:"
    grep -A 20 "location.*upload-template" "$NGINX_CONFIG" | head -21
else
    echo "   ❌ Location block not found after update"
    exit 1
fi
echo ""

# 6. Test nginx configuration
echo "6. Testing nginx configuration..."
NGINX_TEST=$(sudo nginx -t 2>&1)
if echo "$NGINX_TEST" | grep -q "successful"; then
    echo "   ✅ Nginx configuration is valid!"
    echo "$NGINX_TEST" | tail -1
else
    echo "   ❌ Nginx configuration has errors:"
    echo "$NGINX_TEST"
    exit 1
fi
echo ""

# 7. Reload nginx
echo "7. Reloading nginx..."
if sudo systemctl reload nginx 2>/dev/null; then
    echo "   ✅ Nginx reloaded successfully"
else
    echo "   ⚠️  Could not reload nginx, trying restart..."
    sudo systemctl restart nginx
    sleep 2
    echo "   ✅ Nginx restarted"
fi
echo ""

# 8. Test upload endpoint
echo "8. Testing upload endpoint..."
echo "   Testing OPTIONS (preflight)..."
OPTIONS_CODE=$(curl -s -k -X OPTIONS \
    -H "Origin: https://control.petrodealhub.com" \
    -H "Access-Control-Request-Method: POST" \
    -o /dev/null -w "%{http_code}" \
    "https://control.petrodealhub.com/upload-template" 2>/dev/null || echo "000")

if [ "$OPTIONS_CODE" = "200" ] || [ "$OPTIONS_CODE" = "204" ]; then
    echo "   ✅ OPTIONS request successful ($OPTIONS_CODE)"
else
    echo "   ⚠️  OPTIONS request returned $OPTIONS_CODE"
fi

echo "   Testing POST (actual upload endpoint)..."
POST_CODE=$(curl -s -k -X POST \
    -H "Origin: https://control.petrodealhub.com" \
    -H "Content-Type: multipart/form-data" \
    -o /dev/null -w "%{http_code}" \
    "https://control.petrodealhub.com/upload-template" 2>/dev/null || echo "000")

if [ "$POST_CODE" = "401" ] || [ "$POST_CODE" = "400" ]; then
    echo "   ✅ POST endpoint accessible ($POST_CODE - auth/validation error is expected)"
elif [ "$POST_CODE" = "404" ]; then
    echo "   ❌ POST endpoint still returns 404"
    echo "   ⚠️  Location block might not be working correctly"
elif [ "$POST_CODE" = "413" ]; then
    echo "   ❌ POST endpoint returns 413 (Request Entity Too Large)"
    echo "   ⚠️  File size limit might still be an issue"
else
    echo "   ℹ️  POST endpoint returned $POST_CODE"
fi
echo ""

# 9. Summary
echo "=========================================="
echo "FIX COMPLETE"
echo "=========================================="
echo ""
echo "✅ Added /upload-template location block to nginx"
echo "✅ Location block includes client_max_body_size 50M"
echo "✅ Location block includes CORS headers"
echo "✅ Nginx has been reloaded"
echo ""
echo "The upload should now work!"
echo ""
echo "Next steps:"
echo "1. Clear browser cache (Ctrl+Shift+R)"
echo "2. Try uploading a template again"
echo "3. Check browser console for any remaining errors"
echo ""
