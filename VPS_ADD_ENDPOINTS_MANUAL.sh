#!/bin/bash
# Manually add missing API endpoint location blocks to nginx config

set -e

echo "=========================================="
echo "MANUALLY ADD MISSING API ENDPOINTS"
echo "=========================================="
echo ""

NGINX_CONFIG="/etc/nginx/sites-available/control"

# 1. Backup
BACKUP_FILE="${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$NGINX_CONFIG" "$BACKUP_FILE"
echo "1. ✅ Backed up to: $BACKUP_FILE"
echo ""

# 2. Check API host
if curl -s http://127.0.0.1:8000/health > /dev/null 2>&1; then
    API_HOST="127.0.0.1"
else
    API_HOST="localhost"
fi
echo "2. Using API host: $API_HOST"
echo ""

# 3. Check what's missing
echo "3. Checking which endpoints are missing..."
MISSING=()

if ! grep -q "location /templates" "$NGINX_CONFIG"; then
    MISSING+=("templates")
    echo "   ⚠️  /templates missing"
fi

if ! grep -q "location /data/all" "$NGINX_CONFIG"; then
    MISSING+=("data/all")
    echo "   ⚠️  /data/all missing"
fi

if ! grep -q "location /plans-db" "$NGINX_CONFIG"; then
    MISSING+=("plans-db")
    echo "   ⚠️  /plans-db missing"
fi

if ! grep -q "location /plans" "$NGINX_CONFIG"; then
    MISSING+=("plans")
    echo "   ⚠️  /plans missing"
fi

if [ ${#MISSING[@]} -eq 0 ]; then
    echo "   ✅ All endpoints are present!"
    echo ""
    echo "   Showing location blocks:"
    grep -n "location.*templates\|location.*data/all\|location.*plans" "$NGINX_CONFIG" | head -10
    echo ""
else
    echo "   Found ${#MISSING[@]} missing endpoint(s)"
    echo ""
fi

# 4. Add missing location blocks before "location = /" or "location /"
echo "4. Adding missing location blocks..."

# Find insertion point (before "location = /" or before "location /")
INSERT_LINE=$(grep -n "location = / \|location / {" "$NGINX_CONFIG" | head -1 | cut -d: -f1)

if [ -z "$INSERT_LINE" ]; then
    # Find closing brace of server block
    INSERT_LINE=$(grep -n "^}" "$NGINX_CONFIG" | tail -1 | cut -d: -f1)
fi

if [ -z "$INSERT_LINE" ]; then
    echo "   ❌ Could not find insertion point!"
    exit 1
fi

echo "   Inserting before line $INSERT_LINE"

# Create location blocks content
LOCATION_BLOCKS=""

for endpoint in "${MISSING[@]}"; do
    case $endpoint in
        "templates")
            LOCATION_BLOCKS+="
    # /templates endpoint - proxy to document-processor API
    location /templates {
        proxy_pass http://$API_HOST:8000/templates;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Cookie \$http_cookie;
        
        # CORS headers
        add_header Access-Control-Allow-Origin \$http_origin always;
        add_header Access-Control-Allow-Methods \"GET, POST, OPTIONS\" always;
        add_header Access-Control-Allow-Headers \"Content-Type, Authorization\" always;
        add_header Access-Control-Allow-Credentials true always;
        
        # Handle OPTIONS preflight
        if (\$request_method = 'OPTIONS') {
            return 204;
        }
    }"
            ;;
        "data/all")
            LOCATION_BLOCKS+="
    # /data/all endpoint - proxy to document-processor API
    location /data/all {
        proxy_pass http://$API_HOST:8000/data/all;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Cookie \$http_cookie;
        
        # CORS headers
        add_header Access-Control-Allow-Origin \$http_origin always;
        add_header Access-Control-Allow-Methods \"GET, OPTIONS\" always;
        add_header Access-Control-Allow-Headers \"Content-Type, Authorization\" always;
        add_header Access-Control-Allow-Credentials true always;
        
        # Handle OPTIONS preflight
        if (\$request_method = 'OPTIONS') {
            return 204;
        }
    }"
            ;;
        "plans-db")
            LOCATION_BLOCKS+="
    # /plans-db endpoint - proxy to document-processor API
    location /plans-db {
        proxy_pass http://$API_HOST:8000/plans-db;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Cookie \$http_cookie;
        
        # CORS headers
        add_header Access-Control-Allow-Origin \$http_origin always;
        add_header Access-Control-Allow-Methods \"GET, OPTIONS\" always;
        add_header Access-Control-Allow-Headers \"Content-Type, Authorization\" always;
        add_header Access-Control-Allow-Credentials true always;
        
        # Handle OPTIONS preflight
        if (\$request_method = 'OPTIONS') {
            return 204;
        }
    }"
            ;;
        "plans")
            LOCATION_BLOCKS+="
    # /plans endpoint - proxy to document-processor API
    location /plans {
        proxy_pass http://$API_HOST:8000/plans;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Cookie \$http_cookie;
        
        # CORS headers
        add_header Access-Control-Allow-Origin \$http_origin always;
        add_header Access-Control-Allow-Methods \"GET, POST, OPTIONS\" always;
        add_header Access-Control-Allow-Headers \"Content-Type, Authorization\" always;
        add_header Access-Control-Allow-Credentials true always;
        
        # Handle OPTIONS preflight
        if (\$request_method = 'OPTIONS') {
            return 204;
        }
    }"
            ;;
    esac
done

# Insert the location blocks
if [ -n "$LOCATION_BLOCKS" ]; then
    # Use sed to insert before the insertion line
    sed -i "${INSERT_LINE}i\\${LOCATION_BLOCKS}" "$NGINX_CONFIG"
    echo "   ✅ Added ${#MISSING[@]} location block(s)"
else
    echo "   ✅ No missing endpoints to add"
fi
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

# 7. Test endpoints
echo "7. Testing endpoints..."
sleep 2

ENDPOINTS=("/templates" "/data/all" "/plans-db" "/plans")

for endpoint in "${ENDPOINTS[@]}"; do
    echo -n "   Testing $endpoint... "
    RESPONSE=$(curl -s -k -o /dev/null -w "%{http_code}" "https://control.petrodealhub.com$endpoint" 2>/dev/null || echo "000")
    if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "401" ]; then
        echo "✅ $RESPONSE"
    elif [ "$RESPONSE" = "404" ]; then
        echo "❌ 404 (still not working)"
    else
        echo "⚠️  $RESPONSE"
    fi
done
echo ""

echo "=========================================="
echo "COMPLETE"
echo "=========================================="
echo ""
echo "If endpoints still return 404, check nginx config:"
echo "   sudo grep -n 'location.*templates\|location.*data/all\|location.*plans' $NGINX_CONFIG"
echo ""
