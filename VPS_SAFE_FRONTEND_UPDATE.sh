#!/bin/bash
# VPS: Safe Frontend Update Only - No Backend/Database Changes
# This script ONLY fixes frontend update issues without touching anything else

set -e

echo "=========================================="
echo "SAFE FRONTEND UPDATE - NO OTHER CHANGES"
echo "=========================================="
echo ""
echo "⚠️  This script will ONLY:"
echo "   ✅ Update frontend code from Git"
echo "   ✅ Clean frontend build cache"
echo "   ✅ Rebuild frontend"
echo "   ✅ Restart frontend services"
echo ""
echo "⚠️  This script will NOT touch:"
echo "   ❌ Backend/Python API (port 8000)"
echo "   ❌ Database"
echo "   ❌ Nginx configuration"
echo "   ❌ SSL certificates"
echo "   ❌ System files"
echo "   ❌ Other services"
echo ""

cd /opt/petrodealhub || { echo "ERROR: /opt/petrodealhub not found!"; exit 1; }

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}=== STEP 1: Pull Latest Frontend Code ===${NC}"
# Only stash frontend-related changes
if [ -n "$(git status --porcelain src/ dist/ package.json package-lock.json 2>/dev/null)" ]; then
    echo "Stashing frontend changes..."
    git stash push -m "Frontend changes before update" src/ dist/ package.json package-lock.json 2>/dev/null || true
fi

git pull origin main
echo -e "${GREEN}✅ Code updated${NC}"
echo ""

echo -e "${YELLOW}=== STEP 2: Clean Frontend Build Cache Only ===${NC}"
# ONLY remove frontend build artifacts - nothing else
rm -rf dist
rm -rf node_modules/.vite
rm -rf .vite
rm -rf .cache
rm -f .npmrc  # Remove .npmrc that might cause issues

# Clear npm cache (safe, doesn't affect installed packages)
npm cache clean --force 2>/dev/null || true

echo -e "${GREEN}✅ Frontend cache cleaned${NC}"
echo ""

echo -e "${YELLOW}=== STEP 3: Reinstall Frontend Dependencies ===${NC}"
# Only reinstall if needed (safe operation)
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    echo "Reinstalling frontend dependencies..."
    rm -rf node_modules package-lock.json
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo "Dependencies up to date, skipping reinstall"
fi
echo ""

echo -e "${YELLOW}=== STEP 4: Build Frontend ===${NC}"
npm run build

if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
    echo "❌ ERROR: Build failed! dist folder not created properly"
    exit 1
fi

echo -e "${GREEN}✅ Frontend built successfully${NC}"
echo "Build timestamp: $(stat -c %y dist/index.html 2>/dev/null || stat -f %Sm dist/index.html 2>/dev/null)"
echo ""

echo -e "${YELLOW}=== STEP 5: Restart Frontend Services Only ===${NC}"
# Check how frontend is served
NGINX_CONFIG="/etc/nginx/sites-enabled/petrodealhub"

if grep -q "root.*dist" "$NGINX_CONFIG" 2>/dev/null; then
    # Nginx serving directly from dist - just reload nginx (safe)
    echo "Nginx serving from dist - reloading nginx..."
    sudo nginx -t && sudo systemctl reload nginx
    echo -e "${GREEN}✅ Nginx reloaded${NC}"
else
    # Using port 3000 - restart only the frontend service
    echo "Restarting frontend service on port 3000..."
    
    # Kill only processes on port 3000 (frontend)
    if lsof -ti:3000 > /dev/null 2>&1; then
        lsof -ti:3000 | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
    
    # Start frontend only (using PM2 if available, otherwise serve)
    if command -v pm2 &> /dev/null; then
        pm2 restart petrodealhub-app 2>/dev/null || pm2 start serve --name petrodealhub-app -- -s dist -l 3000
        pm2 save
        echo -e "${GREEN}✅ PM2 frontend service restarted${NC}"
    else
        nohup serve -s dist -l 3000 > /tmp/serve.log 2>&1 &
        echo -e "${GREEN}✅ Frontend service started${NC}"
    fi
    
    # Reload nginx (safe, doesn't restart backend)
    sudo nginx -t && sudo systemctl reload nginx
    echo -e "${GREEN}✅ Nginx reloaded${NC}"
fi
echo ""

echo -e "${YELLOW}=== STEP 6: Verify Frontend is Running ===${NC}"
sleep 2

# Check frontend only
if grep -q "proxy_pass.*3000" "$NGINX_CONFIG" 2>/dev/null; then
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend on port 3000 is responding${NC}"
    else
        echo "⚠️  Warning: Port 3000 not responding, but nginx might serve from dist"
    fi
fi

if sudo systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx is running${NC}"
else
    echo "❌ ERROR: Nginx is not running"
    exit 1
fi

echo ""
echo "=========================================="
echo -e "${GREEN}✅ FRONTEND UPDATE COMPLETE!${NC}"
echo "=========================================="
echo ""
echo "Summary:"
echo "  ✅ Frontend code updated"
echo "  ✅ Frontend cache cleaned"
echo "  ✅ Frontend rebuilt"
echo "  ✅ Frontend services restarted"
echo ""
echo "⚠️  Backend, database, and other services were NOT touched"
echo ""
echo "Next steps:"
echo "  1. Clear browser cache (Ctrl+Shift+R)"
echo "  2. Hard refresh the page"
echo "  3. Check if updates are visible"
echo ""
echo "If updates still don't show:"
echo "  - Check browser DevTools → Network tab → Disable cache"
echo "  - Check browser DevTools → Application → Clear storage"
echo ""

