#!/bin/bash
# Fix 502 Error - Start Backend API

echo "🔧 Starting Backend API to Fix 502 Error..."
echo ""

# Check current directory
CURRENT_DIR=$(pwd)
echo "Current directory: $CURRENT_DIR"

# Try different possible paths
APP_DIRS=(
    "/opt/petrodealhub"
    "/opt/aivessel-trade-flow"
    "$HOME"
)

API_DIR=""
for dir in "${APP_DIRS[@]}"; do
    if [ -d "$dir/document-processor" ]; then
        API_DIR="$dir/document-processor"
        echo "✅ Found document-processor at: $API_DIR"
        break
    fi
done

if [ -z "$API_DIR" ]; then
    echo "❌ Could not find document-processor directory"
    echo "Please navigate to the document-processor directory manually"
    exit 1
fi

cd "$API_DIR" || exit 1

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found at $API_DIR/venv"
    echo "Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
else
    echo "✅ Virtual environment found"
fi

# Check if main.py exists
if [ ! -f "main.py" ]; then
    echo "❌ main.py not found in $API_DIR"
    exit 1
fi

echo ""
echo "📋 Checking PM2 processes..."
pm2 list

echo ""
echo "🔄 Starting API with PM2..."

# Check if ecosystem.config.js exists in current directory
if [ -f "ecosystem.config.js" ]; then
    echo "Using ecosystem.config.js from current directory"
    pm2 start ecosystem.config.js
elif [ -f "../ecosystem.config.js" ]; then
    echo "Using ecosystem.config.js from parent directory"
    pm2 start ../ecosystem.config.js
else
    # Start manually without ecosystem config
    echo "Starting API manually..."
    source venv/bin/activate
    pm2 start python --name python-api --interpreter venv/bin/python -- main.py --env FASTAPI_PORT=8000
fi

sleep 3

# Check if it started
echo ""
echo "📊 PM2 Status:"
pm2 list

# Test API
echo ""
echo "🧪 Testing API..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ API is running! Health check:"
    curl -s http://localhost:8000/health | head -3
else
    echo "❌ API health check failed"
    echo "📋 Checking PM2 logs..."
    pm2 logs python-api --lines 20 --nostream
fi

echo ""
echo "✅ Done! If API is running, try accessing CMS again."
echo "📋 To view logs: pm2 logs python-api"
