#!/bin/bash
# Quick Update Script - Fastest way to update React app on VPS
# Usage: bash VPS_QUICK_UPDATE.sh

set -e

cd /opt/petrodealhub || cd ~/aivessel-trade-flow-main || { echo "ERROR: Project directory not found!"; exit 1; }

echo "🚀 Quick Update Starting..."
echo ""

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main || git pull origin master

# Stop services
echo "🛑 Stopping services..."
pm2 stop all 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Clean build
echo "🧹 Cleaning..."
rm -rf dist node_modules/.vite .vite .cache
rm -f .npmrc  # Remove .npmrc that might cause install issues
npm cache clean --force 2>/dev/null || true

# Reinstall dependencies (clean install)
echo "📦 Reinstalling dependencies..."
rm -rf node_modules package-lock.json
npm install

# Build
echo "🔨 Building..."
npm run build

# Restart services
echo "▶️  Starting services..."
if grep -q "root.*dist" /etc/nginx/sites-enabled/petrodealhub 2>/dev/null; then
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded (serving from dist)"
else
    pm2 start serve --name petrodealhub-app -- -s dist -l 3000 2>/dev/null || serve -s dist -l 3000 &
    pm2 save 2>/dev/null || true
    sudo systemctl reload nginx
    echo "✅ Services restarted"
fi

echo ""
echo "✅ Update complete!"
echo "💡 Clear browser cache (Ctrl+Shift+R) to see changes"
