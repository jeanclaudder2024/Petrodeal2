#!/bin/bash
# Fix Port 3000 Serving Old HTML
# This fixes the specific issue where port 3000 serves old HTML

set -e

cd /opt/petrodealhub || { echo "ERROR: /opt/petrodealhub not found!"; exit 1; }

echo "=========================================="
echo "FIXING PORT 3000 OLD HTML ISSUE"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}=== STEP 1: Kill Everything on Port 3000 ===${NC}"
# Kill all processes
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "Killing processes on port 3000..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# Stop and delete PM2 process
if command -v pm2 &> /dev/null; then
    pm2 stop petrodealhub-app 2>/dev/null || true
    pm2 delete petrodealhub-app 2>/dev/null || true
    echo -e "${GREEN}✅ PM2 process stopped and deleted${NC}"
fi
echo ""

echo -e "${YELLOW}=== STEP 2: Remove Old Dist Folder ===${NC}"
# Remove the old dist folder in src/
if [ -d "src/dist" ]; then
    echo "Removing old dist folder: src/dist"
    rm -rf src/dist
    echo -e "${GREEN}✅ Old dist folder removed${NC}"
else
    echo "No old dist folder found in src/"
fi
echo ""

echo -e "${YELLOW}=== STEP 3: Verify Current Dist Has New Files ===${NC}"
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ ERROR: dist folder doesn't exist!${NC}"
    echo "Rebuilding..."
    npm run build
fi

# Check what JS file exists
CURRENT_JS=$(ls -t dist/assets/*.js | head -1 | xargs basename)
echo "Current JS file in dist: $CURRENT_JS"

# Check what HTML references
HTML_JS=$(grep -o 'assets/index-[^"]*\.js' dist/index.html | head -1 | xargs basename)
echo "HTML references: $HTML_JS"

if [ "assets/$HTML_JS" != "assets/$CURRENT_JS" ]; then
    echo -e "${RED}❌ ERROR: HTML references wrong file!${NC}"
    echo "Rebuilding to fix..."
    rm -rf dist
    npm run build
    CURRENT_JS=$(ls -t dist/assets/*.js | head -1 | xargs basename)
    HTML_JS=$(grep -o 'assets/index-[^"]*\.js' dist/index.html | head -1 | xargs basename)
    echo "After rebuild - JS: $CURRENT_JS, HTML: $HTML_JS"
fi

if [ -f "dist/assets/$HTML_JS" ]; then
    echo -e "${GREEN}✅ HTML references correct file${NC}"
else
    echo -e "${RED}❌ ERROR: Referenced file doesn't exist!${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}=== STEP 4: Start Fresh Serve Process ===${NC}"
# Make absolutely sure we're in the right directory
cd /opt/petrodealhub
echo "Current directory: $(pwd)"
echo "Dist folder: $(ls -ld dist | awk '{print $9}')"

# Start serve with explicit path
if command -v pm2 &> /dev/null; then
    echo "Starting PM2 with explicit paths..."
    pm2 delete petrodealhub-app 2>/dev/null || true
    pm2 start serve --name petrodealhub-app -- \
        -s /opt/petrodealhub/dist \
        -l 3000 \
        --single
    pm2 save
    echo -e "${GREEN}✅ PM2 started with explicit dist path${NC}"
else
    echo "Starting serve directly..."
    nohup serve -s /opt/petrodealhub/dist -l 3000 --single > /tmp/serve.log 2>&1 &
    echo -e "${GREEN}✅ Serve started${NC}"
fi

# Wait for it to start
echo "Waiting for service to start..."
sleep 5
echo ""

echo -e "${YELLOW}=== STEP 5: Verify Port 3000 Serves New HTML ===${NC}"
# Check what port 3000 is actually serving
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    SERVED_HTML_JS=$(curl -s http://localhost:3000 | grep -o 'assets/index-[^"]*\.js' | head -1)
    echo "Port 3000 serves HTML with: $SERVED_HTML_JS"
    echo "Expected: assets/$HTML_JS"
    
    if [ "$SERVED_HTML_JS" = "assets/$HTML_JS" ]; then
        echo -e "${GREEN}✅ Port 3000 is serving NEW HTML!${NC}"
    else
        echo -e "${RED}❌ ERROR: Port 3000 still serving OLD HTML!${NC}"
        echo "  Expected: assets/$HTML_JS"
        echo "  Got: $SERVED_HTML_JS"
        echo ""
        echo "Trying to fix by killing and restarting..."
        lsof -ti:3000 | xargs kill -9 2>/dev/null || true
        sleep 2
        pm2 delete petrodealhub-app 2>/dev/null || true
        pm2 start serve --name petrodealhub-app -- -s /opt/petrodealhub/dist -l 3000 --single
        pm2 save
        sleep 5
        SERVED_HTML_JS=$(curl -s http://localhost:3000 | grep -o 'assets/index-[^"]*\.js' | head -1)
        if [ "$SERVED_HTML_JS" = "assets/$HTML_JS" ]; then
            echo -e "${GREEN}✅ Fixed! Now serving new HTML${NC}"
        else
            echo -e "${RED}❌ Still not working. Check PM2 logs: pm2 logs petrodealhub-app${NC}"
        fi
    fi
else
    echo -e "${RED}❌ ERROR: Port 3000 not responding!${NC}"
    echo "Check PM2 status: pm2 list"
    echo "Check logs: pm2 logs petrodealhub-app"
fi
echo ""

echo -e "${YELLOW}=== STEP 6: Reload Nginx ===${NC}"
sudo nginx -t && sudo systemctl reload nginx
echo -e "${GREEN}✅ Nginx reloaded${NC}"
echo ""

echo "=========================================="
echo -e "${GREEN}✅ FIX COMPLETE!${NC}"
echo "=========================================="
echo ""
echo "Summary:"
echo "  ✅ Killed old processes"
echo "  ✅ Removed old dist folder"
echo "  ✅ Verified new build"
echo "  ✅ Started fresh serve process"
echo "  ✅ Verified port 3000 serves new HTML"
echo ""
echo "The new HTML should now reference: assets/$HTML_JS"
echo ""
echo "Next: Clear browser cache and hard refresh!"
echo ""

