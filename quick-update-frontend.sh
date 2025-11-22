#!/bin/bash

# Quick script to update frontend on VPS
# Usage: ./quick-update-frontend.sh

set -e

echo "🚀 Starting frontend update..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Find project directory
if [ -d "/opt/petrodealhub" ]; then
    PROJECT_DIR="/opt/petrodealhub"
elif [ -d "/opt/aivessel-trade-flow" ]; then
    PROJECT_DIR="/opt/aivessel-trade-flow"
elif [ -d "$HOME/aivessel-trade-flow-main" ]; then
    PROJECT_DIR="$HOME/aivessel-trade-flow-main"
else
    echo -e "${RED}❌ Project directory not found!${NC}"
    echo "Please run this script from your project directory or set PROJECT_DIR manually"
    exit 1
fi

echo -e "${YELLOW}📁 Project directory: $PROJECT_DIR${NC}"
cd "$PROJECT_DIR"

# Step 1: Pull latest code
echo -e "${YELLOW}📥 Pulling latest code from git...${NC}"
git pull origin main || git pull origin master || {
    echo -e "${RED}❌ Git pull failed!${NC}"
    exit 1
}

# Step 2: Install dependencies (only if package.json changed)
echo -e "${YELLOW}📦 Checking dependencies...${NC}"
if [ package.json -nt node_modules/.package-lock.json ] 2>/dev/null || [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing/updating dependencies...${NC}"
    npm install
else
    echo -e "${GREEN}✅ Dependencies are up to date${NC}"
fi

# Step 3: Build frontend
echo -e "${YELLOW}🔨 Building frontend...${NC}"
npm run build || {
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
}

# Step 4: Restart service
echo -e "${YELLOW}🔄 Restarting frontend service...${NC}"

# Try PM2 first
if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "petrodealhub-app\|react-app"; then
        pm2 restart petrodealhub-app || pm2 restart react-app || pm2 restart all
        echo -e "${GREEN}✅ Restarted via PM2${NC}"
    else
        echo -e "${YELLOW}⚠️  PM2 service not found, trying systemd...${NC}"
    fi
fi

# Try systemd
if systemctl is-active --quiet react-app 2>/dev/null; then
    sudo systemctl restart react-app
    echo -e "${GREEN}✅ Restarted via systemd${NC}"
elif systemctl is-active --quiet petrodealhub-app 2>/dev/null; then
    sudo systemctl restart petrodealhub-app
    echo -e "${GREEN}✅ Restarted via systemd${NC}"
fi

# Step 5: Verify
echo -e "${YELLOW}🔍 Verifying service...${NC}"
sleep 2

if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is running on port 3000!${NC}"
else
    echo -e "${YELLOW}⚠️  Could not verify frontend. Please check manually.${NC}"
fi

echo -e "${GREEN}🎉 Frontend update complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Clear your browser cache (Ctrl+Shift+R)"
echo "2. Visit your website to see the changes"
echo "3. Test the lock/unlock functionality in VesselDocumentGenerator"

