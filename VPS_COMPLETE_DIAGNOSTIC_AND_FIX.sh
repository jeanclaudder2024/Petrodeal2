#!/bin/bash
# VPS: Complete Diagnostic and Fix Script for React Build Updates
# This script diagnoses and fixes all common issues preventing updates from appearing

set -e  # Exit on error

echo "=========================================="
echo "VPS BUILD UPDATE DIAGNOSTIC & FIX SCRIPT"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Change to project directory
cd /opt/petrodealhub || { echo -e "${RED}ERROR: /opt/petrodealhub not found!${NC}"; exit 1; }

echo -e "${YELLOW}=== STEP 1: Checking Git Status ===${NC}"
echo "Current directory: $(pwd)"
echo "Current branch: $(git branch --show-current)"
echo ""

# Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}WARNING: You have uncommitted changes${NC}"
    git status --short
    echo ""
    read -p "Do you want to stash changes and pull latest? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git stash
    fi
fi

# Fetch and pull latest code
echo "Fetching latest code from GitHub..."
git fetch origin
echo "Pulling latest changes..."
git pull origin main || git pull origin master

# Show last commit
echo ""
echo "Last commit:"
git log -1 --oneline
echo ""

echo -e "${YELLOW}=== STEP 2: Checking Source Files ===${NC}"
# Check if we can find a recent change marker (adjust this to your actual component)
if [ -f "src/components/VesselDocumentGenerator.tsx" ]; then
    echo "Checking VesselDocumentGenerator.tsx..."
    if grep -q "v3.1-FORCE-REBUILD\|v3.0-FORCE-RELOAD" src/components/VesselDocumentGenerator.tsx 2>/dev/null; then
        echo -e "${GREEN}✅ Source file has version markers${NC}"
        grep -o "v3\.[0-9]-[A-Z-]*" src/components/VesselDocumentGenerator.tsx | head -1
    else
        echo -e "${YELLOW}⚠️  No version markers found (this is OK if you're not using them)${NC}"
    fi
fi
echo ""

echo -e "${YELLOW}=== STEP 3: Stopping Services ===${NC}"
# Stop PM2 processes if running
if command -v pm2 &> /dev/null; then
    echo "Stopping PM2 processes..."
    pm2 stop all 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
fi

# Stop any process on port 3000
echo "Checking for processes on port 3000..."
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "Killing process on port 3000..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    sleep 2
fi
echo ""

echo -e "${YELLOW}=== STEP 4: Complete Cache Cleanup ===${NC}"
echo "Removing all build artifacts and caches..."

# Remove build outputs
rm -rf dist
rm -rf build
rm -rf .next

# Remove Vite cache
rm -rf node_modules/.vite
rm -rf .vite
rm -rf .cache

# Remove .npmrc (can cause install issues)
if [ -f ".npmrc" ]; then
    echo "Removing .npmrc file (may cause install issues)..."
    rm -f .npmrc
    echo -e "${GREEN}✅ .npmrc removed${NC}"
fi

# Remove npm cache
echo "Clearing npm cache..."
npm cache clean --force 2>/dev/null || true
rm -rf ~/.npm/_cacache 2>/dev/null || true

# Remove any other cache directories
rm -rf .parcel-cache 2>/dev/null || true
rm -rf .turbo 2>/dev/null || true

echo -e "${GREEN}✅ Cache cleanup complete${NC}"
echo ""

echo -e "${YELLOW}=== STEP 5: Verifying Dependencies ===${NC}"
# Since we removed .npmrc, reinstall dependencies to ensure clean install
echo "Reinstalling dependencies (clean install after .npmrc removal)..."
rm -rf node_modules package-lock.json
npm install
echo -e "${GREEN}✅ Dependencies reinstalled${NC}"
echo ""

echo -e "${YELLOW}=== STEP 6: Building Application ===${NC}"
echo "Running: npm run build"
echo ""

# Build with timestamp
BUILD_START=$(date +%s)
npm run build
BUILD_END=$(date +%s)
BUILD_TIME=$((BUILD_END - BUILD_START))

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ ERROR: Build failed! dist folder not created${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Build completed in ${BUILD_TIME} seconds${NC}"
echo ""

echo -e "${YELLOW}=== STEP 7: Verifying Build Output ===${NC}"
# Check build output
if [ -f "dist/index.html" ]; then
    echo -e "${GREEN}✅ dist/index.html exists${NC}"
    echo "Build timestamp: $(stat -c %y dist/index.html 2>/dev/null || stat -f %Sm dist/index.html 2>/dev/null)"
else
    echo -e "${RED}❌ ERROR: dist/index.html not found!${NC}"
    exit 1
fi

# Check for JS files
JS_COUNT=$(find dist/assets -name "*.js" 2>/dev/null | wc -l)
if [ "$JS_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Found $JS_COUNT JavaScript file(s) in dist/assets/${NC}"
    echo "Latest JS file:"
    ls -lt dist/assets/*.js 2>/dev/null | head -1 | awk '{print $9, $6, $7, $8}'
else
    echo -e "${RED}❌ ERROR: No JavaScript files found in dist/assets/${NC}"
    exit 1
fi

# Check for version markers if they exist in source
if [ -f "src/components/VesselDocumentGenerator.tsx" ]; then
    if grep -q "v3.1-FORCE-REBUILD\|v3.0-FORCE-RELOAD" src/components/VesselDocumentGenerator.tsx 2>/dev/null; then
        VERSION_MARKER=$(grep -o "v3\.[0-9]-[A-Z-]*" src/components/VesselDocumentGenerator.tsx | head -1)
        if grep -q "$VERSION_MARKER" dist/assets/*.js 2>/dev/null; then
            echo -e "${GREEN}✅ Version marker '$VERSION_MARKER' found in build${NC}"
        else
            echo -e "${YELLOW}⚠️  WARNING: Version marker not found in build (might be minified differently)${NC}"
        fi
    fi
fi
echo ""

echo -e "${YELLOW}=== STEP 8: Checking Nginx Configuration ===${NC}"
# Check nginx config
NGINX_CONFIG="/etc/nginx/sites-enabled/petrodealhub"
if [ -f "$NGINX_CONFIG" ]; then
    echo "Checking nginx configuration..."
    
    # Check if nginx is serving from dist or proxying to port 3000
    if grep -q "root.*dist" "$NGINX_CONFIG"; then
        NGINX_ROOT=$(grep "root.*dist" "$NGINX_CONFIG" | head -1 | awk '{print $2}' | tr -d ';')
        echo -e "${GREEN}✅ Nginx is configured to serve from: $NGINX_ROOT${NC}"
        
        # Check if the path matches
        if [ "$NGINX_ROOT" = "/opt/petrodealhub/dist" ] || [ "$NGINX_ROOT" = "$(pwd)/dist" ]; then
            echo -e "${GREEN}✅ Nginx root path is correct${NC}"
        else
            echo -e "${YELLOW}⚠️  WARNING: Nginx root path might not match current dist location${NC}"
        fi
    elif grep -q "proxy_pass.*3000" "$NGINX_CONFIG"; then
        echo -e "${YELLOW}⚠️  Nginx is proxying to port 3000 (will need to restart serve process)${NC}"
    else
        echo -e "${YELLOW}⚠️  Could not determine nginx configuration${NC}"
    fi
    
    # Check cache headers
    if grep -q "Cache-Control.*no-cache" "$NGINX_CONFIG"; then
        echo -e "${GREEN}✅ Nginx has no-cache headers configured${NC}"
    else
        echo -e "${YELLOW}⚠️  WARNING: Nginx might be caching files. Consider adding no-cache headers.${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Nginx config not found at $NGINX_CONFIG${NC}"
fi
echo ""

echo -e "${YELLOW}=== STEP 9: Starting Services ===${NC}"
# Determine how to serve the app
if grep -q "root.*dist" "$NGINX_CONFIG" 2>/dev/null; then
    echo "Nginx is serving directly from dist - no need to start port 3000"
    echo "Reloading nginx..."
    sudo nginx -t && sudo systemctl reload nginx
    echo -e "${GREEN}✅ Nginx reloaded${NC}"
else
    echo "Starting serve on port 3000..."
    # Install serve if not available
    if ! command -v serve &> /dev/null; then
        echo "Installing serve..."
        npm install -g serve
    fi
    
    # Start serve in background
    nohup serve -s dist -l 3000 > /tmp/serve.log 2>&1 &
    SERVE_PID=$!
    sleep 3
    
    # Check if serve started
    if ps -p $SERVE_PID > /dev/null; then
        echo -e "${GREEN}✅ Serve started on port 3000 (PID: $SERVE_PID)${NC}"
    else
        echo -e "${RED}❌ ERROR: Failed to start serve${NC}"
        cat /tmp/serve.log
        exit 1
    fi
    
    # Or use PM2 if available
    if command -v pm2 &> /dev/null; then
        echo "Using PM2 to manage serve process..."
        pm2 delete petrodealhub-app 2>/dev/null || true
        pm2 start serve --name petrodealhub-app -- -s dist -l 3000
        pm2 save
        echo -e "${GREEN}✅ PM2 process started${NC}"
    fi
    
    # Reload nginx
    sudo nginx -t && sudo systemctl reload nginx
    echo -e "${GREEN}✅ Nginx reloaded${NC}"
fi
echo ""

echo -e "${YELLOW}=== STEP 10: Final Verification ===${NC}"
# Wait a moment for services to start
sleep 2

# Check if port 3000 is accessible (if using proxy)
if grep -q "proxy_pass.*3000" "$NGINX_CONFIG" 2>/dev/null; then
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Port 3000 is responding${NC}"
    else
        echo -e "${RED}❌ ERROR: Port 3000 is not responding${NC}"
    fi
fi

# Check nginx
if sudo systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx is running${NC}"
else
    echo -e "${RED}❌ ERROR: Nginx is not running${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}✅ DIAGNOSTIC AND FIX COMPLETE!${NC}"
echo "=========================================="
echo ""
echo "Summary:"
echo "  - Git: Latest code pulled"
echo "  - Build: Completed successfully"
echo "  - Services: Started/Reloaded"
echo ""
echo "Next steps:"
echo "  1. Clear your browser cache (Ctrl+Shift+Delete)"
echo "  2. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)"
echo "  3. Check browser DevTools → Network tab → Disable cache"
echo "  4. If still seeing old version, check:"
echo "     - Browser DevTools → Application → Clear storage"
echo "     - Service Workers (if any)"
echo ""
echo "To verify the build is new, check:"
echo "  - File timestamps: ls -lt dist/assets/*.js"
echo "  - File sizes: ls -lh dist/assets/*.js"
echo "  - Content: grep 'your-unique-string' dist/assets/*.js"
echo ""

