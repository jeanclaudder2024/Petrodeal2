#!/bin/bash
# Check and Fix Port 3000 Not Responding

cd /opt/petrodealhub || { echo "ERROR: /opt/petrodealhub not found!"; exit 1; }

echo "=========================================="
echo "CHECKING PORT 3000 STATUS"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}=== Check PM2 Status ===${NC}"
pm2 list
echo ""

echo -e "${YELLOW}=== Check PM2 Logs (last 20 lines) ===${NC}"
pm2 logs petrodealhub-app --lines 20 --nostream
echo ""

echo -e "${YELLOW}=== Check if Port 3000 is Listening ===${NC}"
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "Port 3000 is in use by:"
    lsof -i:3000
else
    echo -e "${RED}❌ Port 3000 is NOT in use!${NC}"
fi
echo ""

echo -e "${YELLOW}=== Try to Connect to Port 3000 ===${NC}"
if curl -s -m 5 http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Port 3000 is responding!${NC}"
    SERVED_JS=$(curl -s http://localhost:3000 | grep -o 'assets/index-[^"]*\.js' | head -1)
    echo "Serving HTML with: $SERVED_JS"
else
    echo -e "${RED}❌ Port 3000 is NOT responding${NC}"
    echo ""
    echo -e "${YELLOW}=== Restarting PM2 Process ===${NC}"
    pm2 delete petrodealhub-app 2>/dev/null || true
    sleep 2
    
    # Try different serve command formats
    echo "Trying to start serve..."
    cd /opt/petrodealhub
    pm2 start serve --name petrodealhub-app -- -s dist -l 3000
    pm2 save
    
    echo "Waiting 5 seconds..."
    sleep 5
    
    if curl -s -m 5 http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Port 3000 is now responding!${NC}"
        SERVED_JS=$(curl -s http://localhost:3000 | grep -o 'assets/index-[^"]*\.js' | head -1)
        echo "Serving HTML with: $SERVED_JS"
    else
        echo -e "${RED}❌ Still not responding. Checking logs...${NC}"
        pm2 logs petrodealhub-app --lines 30 --nostream
    fi
fi
echo ""

echo -e "${YELLOW}=== Check Dist Folder ===${NC}"
echo "Dist folder exists: $([ -d "dist" ] && echo "Yes" || echo "No")"
echo "Index.html exists: $([ -f "dist/index.html" ] && echo "Yes" || echo "No")"
if [ -f "dist/index.html" ]; then
    HTML_JS=$(grep -o 'assets/index-[^"]*\.js' dist/index.html | head -1)
    echo "HTML references: $HTML_JS"
    if [ -f "dist/$HTML_JS" ]; then
        echo -e "${GREEN}✅ Referenced file exists${NC}"
    else
        echo -e "${RED}❌ Referenced file does NOT exist!${NC}"
    fi
fi
echo ""

echo "=========================================="
echo "DIAGNOSTIC COMPLETE"
echo "=========================================="

