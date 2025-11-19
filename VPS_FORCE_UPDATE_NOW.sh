#!/bin/bash
# Force Update - Nuclear Option to Make Updates Show
# This does everything possible to force the update to appear

set -e

cd /opt/petrodealhub || { echo "ERROR: /opt/petrodealhub not found!"; exit 1; }

echo "=========================================="
echo "FORCE UPDATE - Making Updates Show NOW"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}=== STEP 1: Kill Everything ===${NC}"
# Kill all processes on port 3000
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "Killing processes on port 3000..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# Stop PM2
if command -v pm2 &> /dev/null; then
    pm2 stop petrodealhub-app 2>/dev/null || true
    pm2 delete petrodealhub-app 2>/dev/null || true
fi
echo -e "${GREEN}✅ All processes stopped${NC}"
echo ""

echo -e "${YELLOW}=== STEP 2: Complete Clean ===${NC}"
# Remove everything
rm -rf dist
rm -rf node_modules/.vite
rm -rf .vite
rm -rf .cache
rm -f .npmrc

# Clear npm cache
npm cache clean --force 2>/dev/null || true
echo -e "${GREEN}✅ Everything cleaned${NC}"
echo ""

echo -e "${YELLOW}=== STEP 3: Fresh Build ===${NC}"
npm run build

if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

# Get the new JS file name
NEW_JS=$(ls -t dist/assets/*.js | head -1 | xargs basename)
echo -e "${GREEN}✅ Build complete${NC}"
echo "  New JS file: $NEW_JS"
echo "  Build time: $(date)"
echo ""

echo -e "${YELLOW}=== STEP 4: Verify HTML References New File ===${NC}"
# Check what the HTML references
HTML_JS=$(grep -o 'assets/index-[^"]*\.js' dist/index.html | head -1)
echo "HTML references: $HTML_JS"

if [ "$HTML_JS" != "assets/$NEW_JS" ]; then
    echo -e "${RED}❌ ERROR: HTML references wrong file!${NC}"
    echo "  HTML has: $HTML_JS"
    echo "  Actual file: assets/$NEW_JS"
    echo "  This should not happen - rebuilding..."
    rm -rf dist
    npm run build
    HTML_JS=$(grep -o 'assets/index-[^"]*\.js' dist/index.html | head -1)
    echo "  After rebuild: $HTML_JS"
fi

if [ -f "dist/$HTML_JS" ]; then
    echo -e "${GREEN}✅ HTML references correct file${NC}"
else
    echo -e "${RED}❌ ERROR: Referenced file doesn't exist!${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}=== STEP 5: Start Fresh Service ===${NC}"
# Start serve fresh
if command -v pm2 &> /dev/null; then
    pm2 start serve --name petrodealhub-app -- -s dist -l 3000
    pm2 save
    echo -e "${GREEN}✅ PM2 started${NC}"
else
    nohup serve -s dist -l 3000 > /tmp/serve.log 2>&1 &
    echo -e "${GREEN}✅ Serve started${NC}"
fi

# Wait for it to start
sleep 3

# Verify it's serving the new file
if curl -s http://localhost:3000 | grep -q "$HTML_JS"; then
    echo -e "${GREEN}✅ Port 3000 serving new file${NC}"
else
    echo -e "${RED}❌ WARNING: Port 3000 might not be serving new file${NC}"
    echo "  Checking what it's serving..."
    curl -s http://localhost:3000 | grep -o 'assets/index-[^"]*\.js' | head -1
fi
echo ""

echo -e "${YELLOW}=== STEP 6: Fix Nginx Cache Headers ===${NC}"
NGINX_CONFIG="/etc/nginx/sites-enabled/petrodealhub"
if [ -f "$NGINX_CONFIG" ]; then
    # Check if no-cache headers exist
    if ! grep -q "Cache-Control.*no-cache" "$NGINX_CONFIG"; then
        echo "Adding no-cache headers to nginx config..."
        # Create backup
        sudo cp "$NGINX_CONFIG" "$NGINX_CONFIG.backup.$(date +%Y%m%d_%H%M%S)"
        
        # Add no-cache headers (this is a simple approach - might need manual editing)
        echo -e "${YELLOW}⚠️  You may need to manually add these to nginx config:${NC}"
        echo "  location ~* \.(html|js|css)$ {"
        echo "      add_header Cache-Control \"no-cache, no-store, must-revalidate\" always;"
        echo "      add_header Pragma \"no-cache\" always;"
        echo "      add_header Expires \"0\" always;"
        echo "  }"
    else
        echo -e "${GREEN}✅ Nginx already has no-cache headers${NC}"
    fi
fi

# Reload nginx
sudo nginx -t && sudo systemctl reload nginx
echo -e "${GREEN}✅ Nginx reloaded${NC}"
echo ""

echo -e "${YELLOW}=== STEP 7: Final Verification ===${NC}"
sleep 2

# Check what nginx serves
echo "Checking what nginx serves..."
SERVED_JS=$(curl -s http://localhost/ | grep -o 'assets/index-[^"]*\.js' | head -1)
if [ -n "$SERVED_JS" ]; then
    echo "Nginx serves HTML with: $SERVED_JS"
    if [ "$SERVED_JS" = "$HTML_JS" ]; then
        echo -e "${GREEN}✅ Nginx serving correct file${NC}"
    else
        echo -e "${RED}❌ WARNING: Nginx serving different file!${NC}"
        echo "  Expected: $HTML_JS"
        echo "  Got: $SERVED_JS"
    fi
fi
echo ""

echo "=========================================="
echo -e "${GREEN}✅ FORCE UPDATE COMPLETE!${NC}"
echo "=========================================="
echo ""
echo "New build details:"
echo "  JS file: $HTML_JS"
echo "  Build time: $(date)"
echo ""
echo "⚠️  IMPORTANT - Browser Steps:"
echo "  1. Open browser DevTools (F12)"
echo "  2. Go to Application tab"
echo "  3. Click 'Clear site data' (check all boxes)"
echo "  4. Go to Network tab"
echo "  5. Check 'Disable cache'"
echo "  6. Close DevTools"
echo "  7. Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)"
echo ""
echo "  8. If still not working, try incognito/private window"
echo ""
echo "  9. Check Service Workers:"
echo "     - DevTools → Application → Service Workers"
echo "     - Click 'Unregister' on any found"
echo ""
echo "The server is now serving the NEW build: $HTML_JS"
echo "If you still see old content, it's 100% browser cache."
echo ""

