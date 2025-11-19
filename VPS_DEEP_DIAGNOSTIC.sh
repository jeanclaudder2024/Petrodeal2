#!/bin/bash
# Deep Diagnostic - Find why updates aren't showing
# This checks everything that could prevent updates from appearing

cd /opt/petrodealhub || { echo "ERROR: /opt/petrodealhub not found!"; exit 1; }

echo "=========================================="
echo "DEEP DIAGNOSTIC - Why Updates Not Showing"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}=== 1. Check What's Actually in the Build ===${NC}"
echo "Latest JS file:"
LATEST_JS=$(ls -t dist/assets/*.js | head -1)
echo "  File: $LATEST_JS"
echo "  Size: $(ls -lh $LATEST_JS | awk '{print $5}')"
echo "  Date: $(ls -l $LATEST_JS | awk '{print $6, $7, $8}')"
echo ""

# Check if we can find any version markers or recent changes
echo "Searching for version markers in build..."
if grep -q "v3.1-FORCE-REBUILD\|v3.0-FORCE-RELOAD\|FORCE-REBUILD" "$LATEST_JS" 2>/dev/null; then
    echo -e "${GREEN}✅ Found version markers in build${NC}"
    grep -o "v3\.[0-9]-[A-Z-]*\|FORCE-REBUILD" "$LATEST_JS" | head -3
else
    echo -e "${YELLOW}⚠️  No version markers found (might be minified)${NC}"
fi
echo ""

echo -e "${YELLOW}=== 2. Check Source Files Have Changes ===${NC}"
if [ -f "src/components/VesselDocumentGenerator.tsx" ]; then
    echo "Checking VesselDocumentGenerator.tsx..."
    if grep -q "v3.1-FORCE-REBUILD\|v3.0-FORCE-RELOAD" src/components/VesselDocumentGenerator.tsx 2>/dev/null; then
        echo -e "${GREEN}✅ Source file has version markers${NC}"
        grep -o "v3\.[0-9]-[A-Z-]*" src/components/VesselDocumentGenerator.tsx | head -1
    else
        echo -e "${YELLOW}⚠️  No version markers in source (this is OK if you're not using them)${NC}"
    fi
fi
echo ""

echo -e "${YELLOW}=== 3. Check What Port 3000 is Actually Serving ===${NC}"
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "Port 3000 is responding"
    # Get the actual HTML being served
    HTML_CONTENT=$(curl -s http://localhost:3000 | head -50)
    # Extract JS file name from HTML
    JS_FILE=$(echo "$HTML_CONTENT" | grep -o 'assets/index-[^"]*\.js' | head -1)
    if [ -n "$JS_FILE" ]; then
        echo "  HTML references: $JS_FILE"
        # Check if this file exists
        if [ -f "dist/$JS_FILE" ]; then
            echo -e "${GREEN}✅ Referenced file exists in dist${NC}"
            echo "  File date: $(ls -l dist/$JS_FILE | awk '{print $6, $7, $8}')"
        else
            echo -e "${RED}❌ ERROR: HTML references file that doesn't exist!${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  Port 3000 not responding (nginx might serve directly from dist)${NC}"
fi
echo ""

echo -e "${YELLOW}=== 4. Check Nginx Configuration ===${NC}"
NGINX_CONFIG="/etc/nginx/sites-enabled/petrodealhub"
if [ -f "$NGINX_CONFIG" ]; then
    echo "Nginx config:"
    if grep -q "root.*dist" "$NGINX_CONFIG"; then
        NGINX_ROOT=$(grep "root.*dist" "$NGINX_CONFIG" | head -1 | awk '{print $2}' | tr -d ';')
        echo -e "${GREEN}✅ Nginx serving from: $NGINX_ROOT${NC}"
        
        # Check cache headers
        if grep -q "Cache-Control.*no-cache" "$NGINX_CONFIG"; then
            echo -e "${GREEN}✅ Nginx has no-cache headers${NC}"
        else
            echo -e "${RED}❌ WARNING: Nginx might be caching files!${NC}"
            echo "   Add no-cache headers to prevent caching"
        fi
    elif grep -q "proxy_pass.*3000" "$NGINX_CONFIG"; then
        echo "Nginx proxying to port 3000"
    fi
fi
echo ""

echo -e "${YELLOW}=== 5. Check What Nginx is Actually Serving ===${NC}"
# Try to get what nginx serves
if curl -s -I http://localhost/ | head -5; then
    echo ""
    # Get the actual response
    RESPONSE=$(curl -s http://localhost/ | head -50)
    JS_FILE=$(echo "$RESPONSE" | grep -o 'assets/index-[^"]*\.js' | head -1)
    if [ -n "$JS_FILE" ]; then
        echo "Nginx serves HTML that references: $JS_FILE"
        if [ -f "dist/$JS_FILE" ]; then
            echo -e "${GREEN}✅ File exists${NC}"
            echo "  File: dist/$JS_FILE"
            echo "  Date: $(ls -l dist/$JS_FILE | awk '{print $6, $7, $8}')"
        fi
    fi
fi
echo ""

echo -e "${YELLOW}=== 6. Check for Multiple Dist Folders ===${NC}"
echo "Searching for other dist folders..."
find /opt -name "dist" -type d 2>/dev/null | grep -v node_modules | while read dir; do
    if [ -f "$dir/index.html" ]; then
        echo "  Found: $dir"
        echo "    Date: $(ls -ld "$dir" | awk '{print $6, $7, $8}')"
        if [ "$dir" != "/opt/petrodealhub/dist" ]; then
            echo -e "    ${RED}⚠️  WARNING: This might be an old dist folder!${NC}"
        fi
    fi
done
echo ""

echo -e "${YELLOW}=== 7. Check PM2 Process ===${NC}"
if command -v pm2 &> /dev/null; then
    pm2 list | grep petrodealhub-app
    echo ""
    echo "PM2 process details:"
    pm2 describe petrodealhub-app 2>/dev/null | grep -E "script|cwd|status" || echo "Process not found"
fi
echo ""

echo -e "${YELLOW}=== 8. Check for Service Worker (Browser Side) ===${NC}"
echo "⚠️  This needs to be checked in browser DevTools:"
echo "   1. Open DevTools (F12)"
echo "   2. Go to Application tab"
echo "   3. Check 'Service Workers' section"
echo "   4. If any are registered, click 'Unregister'"
echo ""

echo -e "${YELLOW}=== 9. Force Clear Nginx Cache ===${NC}"
echo "Reloading nginx to clear any internal cache..."
sudo systemctl reload nginx
echo -e "${GREEN}✅ Nginx reloaded${NC}"
echo ""

echo -e "${YELLOW}=== 10. Check File Permissions ===${NC}"
echo "Dist folder permissions:"
ls -ld dist/
echo "JS file permissions:"
ls -l "$LATEST_JS" | head -1
echo ""

echo "=========================================="
echo "DIAGNOSTIC COMPLETE"
echo "=========================================="
echo ""
echo "Next steps based on findings:"
echo ""
echo "If HTML references old JS file:"
echo "  1. Restart PM2: pm2 restart petrodealhub-app"
echo "  2. Or kill port 3000: lsof -ti:3000 | xargs kill -9"
echo "  3. Rebuild: rm -rf dist && npm run build"
echo ""
echo "If nginx is caching:"
echo "  1. Add no-cache headers to nginx config"
echo "  2. Reload nginx: sudo systemctl reload nginx"
echo ""
echo "If browser still shows old files:"
echo "  1. Check Service Workers in DevTools"
echo "  2. Clear all site data"
echo "  3. Try incognito/private window"
echo ""

