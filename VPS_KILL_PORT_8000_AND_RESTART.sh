#!/bin/bash
# Kill process on port 8000 and restart API properly

set -e

echo "🔧 Fixing port 8000 conflict and restarting API..."

# Step 1: Stop PM2 app to prevent restart loop
echo "📛 Stopping PM2 python-api..."
pm2 stop python-api 2>/dev/null || true
pm2 delete python-api 2>/dev/null || true
sleep 2

# Step 2: Find and kill process on port 8000
echo "🔍 Finding process on port 8000..."

# Try multiple methods to find the process
PID=$(sudo lsof -ti :8000 2>/dev/null || sudo fuser 8000/tcp 2>/dev/null | awk '{print $NF}' | head -1 || echo "")

if [ ! -z "$PID" ] && [ "$PID" != "" ]; then
    echo "🔪 Killing process $PID on port 8000..."
    sudo kill -9 $PID 2>/dev/null || true
    sleep 2
fi

# Also try fuser method
echo "🔪 Using fuser to kill any remaining processes..."
sudo fuser -k 8000/tcp 2>/dev/null || true
sleep 2

# Verify port is free
echo "🔍 Verifying port 8000 is free..."
if sudo lsof -i :8000 >/dev/null 2>&1; then
    echo "⚠️  Port 8000 still in use. Listing processes:"
    sudo lsof -i :8000
    echo ""
    echo "🔪 Force killing all processes on port 8000..."
    sudo lsof -ti :8000 | xargs sudo kill -9 2>/dev/null || true
    sleep 2
fi

# Final check
if sudo lsof -i :8000 >/dev/null 2>&1; then
    echo "❌ ERROR: Port 8000 is still in use after multiple kill attempts!"
    echo "   Please manually check: sudo lsof -i :8000"
    exit 1
fi

echo "✅ Port 8000 is now free"

# Step 3: Wait a moment to ensure port is released
sleep 2

# Step 4: Start API with PM2
echo "🚀 Starting python-api with PM2..."

cd /opt/petrodealhub

# Check if ecosystem config exists
if [ -f "ecosystem.config.cjs" ]; then
    pm2 start ecosystem.config.cjs --only python-api
elif [ -f "ecosystem.config.js" ]; then
    pm2 start ecosystem.config.js --only python-api
else
    # Manual start
    cd /opt/petrodealhub/document-processor
    if [ -f "venv/bin/python" ]; then
        pm2 start venv/bin/python --name python-api --interpreter none -- main.py
    else
        echo "❌ ERROR: venv/bin/python not found!"
        exit 1
    fi
fi

# Wait for startup
sleep 5

# Step 5: Verify it's running
echo "✅ Checking status..."
pm2 status python-api

# Check logs
echo "📋 Recent logs:"
pm2 logs python-api --lines 15 --nostream || true

# Test health endpoint
echo "🏥 Testing health endpoint..."
sleep 2
if curl -s http://localhost:8000/health >/dev/null 2>&1; then
    echo "✅ API is responding!"
    curl -s http://localhost:8000/health
    echo ""
else
    echo "⚠️  API health check failed. Check logs: pm2 logs python-api"
fi

# Save PM2 config
pm2 save

echo ""
echo "✅ Done! API should be running on port 8000"
echo "   Check status: pm2 status"
echo "   View logs: pm2 logs python-api"
