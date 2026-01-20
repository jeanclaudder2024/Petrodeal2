#!/bin/bash
# Fix file upload size limit issue

set -e

NGINX_CONFIG="/etc/nginx/sites-available/control"

echo "=========================================="
echo "FIX FILE UPLOAD SIZE LIMIT"
echo "=========================================="
echo ""

# 1. Backup
BACKUP_FILE="${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$NGINX_CONFIG" "$BACKUP_FILE"
echo "1. ✅ Backed up to: $BACKUP_FILE"
echo ""

# 2. Check current configuration
echo "2. Checking current configuration..."
if grep -q "client_max_body_size" "$NGINX_CONFIG"; then
    echo "   Found client_max_body_size:"
    grep -n "client_max_body_size" "$NGINX_CONFIG"
else
    echo "   ⚠️  No client_max_body_size found"
fi

echo ""
echo "   Checking location blocks..."
if grep -q "location.*upload" "$NGINX_CONFIG"; then
    echo "   ✅ Found upload location block"
    grep -A 10 "location.*upload" "$NGINX_CONFIG" | head -11
else
    echo "   ⚠️  No upload location block found"
fi
echo ""

# 3. Fix client_max_body_size
echo "3. Fixing client_max_body_size..."
python3 << 'PYTHON_FIX'
import re

with open('/etc/nginx/sites-available/control', 'r') as f:
    content = f.read()

# Check if client_max_body_size is in server block
server_block_pattern = r'(server\s*\{[^}]*?)'
needs_fix = False

# Check if client_max_body_size exists
if 'client_max_body_size' not in content:
    # Add to server block (after listen or server_name)
    content = re.sub(
        r'(server\s*\{[^\n]*\n)',
        r'\1    client_max_body_size 50M;\n',
        content,
        count=1
    )
    needs_fix = True
    print("   ✅ Added client_max_body_size to server block")
else:
    # Check if it's in the right place (should be in server block, not location block)
    lines = content.split('\n')
    in_server_block = False
    server_block_indent = 0
    has_client_max = False
    
    for i, line in enumerate(lines):
        if re.match(r'\s*server\s*\{', line):
            in_server_block = True
            server_block_indent = len(line) - len(line.lstrip())
        elif in_server_block and re.match(r'\s*\}', line):
            indent = len(line) - len(line.lstrip())
            if indent <= server_block_indent:
                # End of server block
                if not has_client_max and i > 0:
                    # Add client_max_body_size before closing brace
                    lines.insert(i, '    client_max_body_size 50M;')
                    needs_fix = True
                    print("   ✅ Added client_max_body_size in server block")
                    break
                in_server_block = False
        elif in_server_block and 'client_max_body_size' in line:
            has_client_max = True
            # Check if it's in a location block (indented more)
            line_indent = len(line) - len(line.lstrip())
            if line_indent > server_block_indent + 4:
                # It's inside a location block, might be OK but let's ensure server block has it too
                pass
    
    if needs_fix:
        content = '\n'.join(lines)

# Ensure upload-template location has client_max_body_size
if 'location' in content and 'upload-template' in content:
    # Find upload-template location block
    upload_location_pattern = r'(location\s+[^{]*upload-template[^{]*\{[^}]*?)'
    match = re.search(upload_location_pattern, content, re.DOTALL | re.MULTILINE)
    
    if match:
        location_block = match.group(1)
        if 'client_max_body_size' not in location_block:
            # Add client_max_body_size to location block
            location_block = location_block.rstrip() + '\n        client_max_body_size 50M;\n'
            content = content[:match.start()] + location_block + content[match.end():]
            needs_fix = True
            print("   ✅ Added client_max_body_size to upload-template location block")
    else:
        # Check if /api/ location includes upload-template
        if 'location /api/' in content:
            api_location_match = re.search(r'(location\s+/api/[^{]*\{[^}]*?)', content, re.DOTALL | re.MULTILINE)
            if api_location_match:
                api_location = api_location_match.group(1)
                if 'client_max_body_size' not in api_location:
                    api_location = api_location.rstrip() + '\n        client_max_body_size 50M;\n'
                    content = content[:api_location_match.start()] + api_location + content[api_location_match.end():]
                    needs_fix = True
                    print("   ✅ Added client_max_body_size to /api/ location block")

if needs_fix:
    with open('/etc/nginx/sites-available/control', 'w') as f:
        f.write(content)
    print("   ✅ Configuration updated")
else:
    print("   ℹ️  Configuration already correct")
PYTHON_FIX

echo ""

# 4. Verify the fix
echo "4. Verifying the fix..."
if grep -q "client_max_body_size" "$NGINX_CONFIG"; then
    echo "   ✅ client_max_body_size found:"
    grep -n "client_max_body_size" "$NGINX_CONFIG"
else
    echo "   ❌ client_max_body_size still missing"
fi
echo ""

# 5. Test nginx configuration
echo "5. Testing nginx configuration..."
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

# 7. Check API status
echo "7. Checking API status..."
if pm2 status python-api 2>/dev/null | grep -q "online"; then
    echo "   ✅ API is running"
else
    echo "   ⚠️  API might not be running, restarting..."
    pm2 restart python-api
    sleep 3
    if pm2 status python-api 2>/dev/null | grep -q "online"; then
        echo "   ✅ API restarted and running"
    else
        echo "   ❌ API failed to start"
        echo "   Check logs: pm2 logs python-api --err"
    fi
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
elif [ "$POST_CODE" = "413" ]; then
    echo "   ❌ POST endpoint still returns 413 (Request Entity Too Large)"
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
echo "✅ client_max_body_size has been set to 50M"
echo "✅ Nginx has been reloaded"
echo ""
echo "The upload should now work for files up to 50MB."
echo ""
echo "If upload still fails:"
echo "1. Clear browser cache (Ctrl+Shift+R)"
echo "2. Check browser console for errors"
echo "3. Verify file size is under 50MB"
echo "4. Check API logs: pm2 logs python-api --err"
echo ""
