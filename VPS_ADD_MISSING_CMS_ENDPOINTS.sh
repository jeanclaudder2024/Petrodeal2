#!/bin/bash
# Add missing location blocks for CMS endpoints

set -e

NGINX_CONFIG="/etc/nginx/sites-available/control"

echo "=========================================="
echo "ADD MISSING CMS ENDPOINT LOCATION BLOCKS"
echo "=========================================="
echo ""

# 1. Backup
BACKUP_FILE="${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$NGINX_CONFIG" "$BACKUP_FILE"
echo "1. ✅ Backed up to: $BACKUP_FILE"
echo ""

# 2. List of endpoints that need location blocks
ENDPOINTS=(
    "/placeholder-settings"
    "/templates"
    "/data/all"
    "/csv-files"
    "/database-tables"
    "/upload-csv"
)

echo "2. Checking which endpoints need location blocks..."
MISSING_ENDPOINTS=()

for endpoint in "${ENDPOINTS[@]}"; do
    if grep -q "location.*${endpoint}" "$NGINX_CONFIG"; then
        echo "   ✅ $endpoint - already has location block"
    else
        echo "   ❌ $endpoint - missing location block"
        MISSING_ENDPOINTS+=("$endpoint")
    fi
done
echo ""

if [ ${#MISSING_ENDPOINTS[@]} -eq 0 ]; then
    echo "   ✅ All endpoints already have location blocks!"
    exit 0
fi

echo "   Found ${#MISSING_ENDPOINTS[@]} missing endpoint(s): ${MISSING_ENDPOINTS[*]}"
echo ""

# 3. Add missing location blocks
echo "3. Adding missing location blocks..."

# Create temporary Python script
TEMP_SCRIPT=$(mktemp)
cat > "$TEMP_SCRIPT" << 'PYTHON_SCRIPT'
import re
import sys

endpoints_to_add = sys.argv[1].split(',') if len(sys.argv) > 1 else []

with open('/etc/nginx/sites-available/control', 'r') as f:
    content = f.read()

# Function to create location block
def create_location_block(endpoint):
    # Special handling for endpoints with wildcards or patterns
    if endpoint == "/templates":
        location_pattern = "/templates"
        location_match = "/templates"
    else:
        location_pattern = endpoint
        location_match = endpoint
    
    # Check if it should have client_max_body_size (for upload endpoints)
    needs_body_size = endpoint in ["/upload-template", "/upload-csv"]
    body_size_line = "        client_max_body_size 50M;\n" if needs_body_size else ""
    
    block = f'''
    # {endpoint} endpoint - proxy to document-processor API
    location {location_pattern} {{
        proxy_pass http://localhost:8000{location_match};
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Cookie $http_cookie;
{body_size_line}
        # CORS headers
        add_header Access-Control-Allow-Origin $http_origin always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
        add_header Access-Control-Allow-Credentials true always;
        
        # Handle OPTIONS preflight
        if ($request_method = OPTIONS) {{
            add_header Access-Control-Allow-Origin $http_origin always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
            add_header Access-Control-Allow-Credentials true always;
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }}
    }}'''
    return block

# Find insertion point (before location = / or before closing brace)
insert_pos = None

# Try to find a good insertion point - after /upload-template if it exists
if 'location /upload-template' in content:
    match = re.search(r'(location\s+/upload-template[^{]*\{[^}]*\})', content, re.DOTALL)
    if match:
        insert_pos = match.end()
        print(f"   ✅ Found insertion point after /upload-template")
elif 'location /templates' in content:
    match = re.search(r'(location\s+/templates[^{]*\{[^}]*\})', content, re.DOTALL)
    if match:
        insert_pos = match.end()
        print(f"   ✅ Found insertion point after /templates")
elif 'location /health' in content:
    match = re.search(r'(location\s+/health[^{]*\{[^}]*\})', content, re.DOTALL)
    if match:
        insert_pos = match.end()
        print(f"   ✅ Found insertion point after /health")
else:
    # Find before location = / or before closing brace
    match = re.search(r'(location\s*=\s*/|location\s+/\s*\{)', content)
    if match:
        insert_pos = match.start()
        # Find start of line
        while insert_pos > 0 and content[insert_pos - 1] != '\n':
            insert_pos -= 1
        print(f"   ✅ Found insertion point before location = /")

if insert_pos is None:
    # Last resort: before closing brace of server block
    lines = content.split('\n')
    for i in range(len(lines) - 1, -1, -1):
        if re.match(r'\s*\}\s*$', lines[i]) and i > 0:
            indent = len(lines[i]) - len(lines[i].lstrip())
            if indent <= 4:
                insert_pos = sum(len(line) + 1 for line in lines[:i])
                break

if insert_pos is None:
    print("   ❌ Could not find insertion point")
    sys.exit(1)

# Add all missing endpoints
location_blocks = ""
for endpoint in endpoints_to_add:
    block = create_location_block(endpoint)
    location_blocks += block
    print(f"   ✅ Added location block for {endpoint}")

# Insert all blocks at once
content = content[:insert_pos] + location_blocks + '\n' + content[insert_pos:]

# Save
with open('/etc/nginx/sites-available/control', 'w') as f:
    f.write(content)

print(f"   ✅ Added {len(endpoints_to_add)} location block(s)")
PYTHON_SCRIPT

# Pass endpoints as comma-separated list
ENDPOINTS_STR=$(IFS=','; echo "${MISSING_ENDPOINTS[*]}")
python3 "$TEMP_SCRIPT" "$ENDPOINTS_STR"

# Clean up
rm -f "$TEMP_SCRIPT"

echo ""

# 4. Verify location blocks were added
echo "4. Verifying location blocks were added..."
for endpoint in "${MISSING_ENDPOINTS[@]}"; do
    if grep -q "location.*${endpoint}" "$NGINX_CONFIG"; then
        echo "   ✅ $endpoint - location block found"
    else
        echo "   ❌ $endpoint - location block still missing"
    fi
done
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

# 7. Test endpoints
echo "7. Testing endpoints..."
for endpoint in "${MISSING_ENDPOINTS[@]}"; do
    echo -n "   Testing $endpoint... "
    HTTP_CODE=$(curl -s -k -o /dev/null -w "%{http_code}" "https://control.petrodealhub.com$endpoint" 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "400" ]; then
        echo "✅ $HTTP_CODE"
    elif [ "$HTTP_CODE" = "404" ]; then
        echo "❌ 404"
    else
        echo "⚠️  $HTTP_CODE"
    fi
done
echo ""

# 8. Summary
echo "=========================================="
echo "FIX COMPLETE"
echo "=========================================="
echo ""
echo "✅ Added location blocks for ${#MISSING_ENDPOINTS[@]} endpoint(s)"
echo "✅ Nginx configuration is valid"
echo "✅ Nginx has been reloaded"
echo ""
echo "The CMS endpoints should now be accessible!"
echo ""
echo "Next steps:"
echo "1. Clear browser cache (Ctrl+Shift+R)"
echo "2. Try using the template editor again"
echo "3. Check browser console for any remaining errors"
echo ""
