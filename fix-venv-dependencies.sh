#!/bin/bash
# Fix Virtual Environment and Dependencies for Python API

set -e

echo "=========================================="
echo "Fixing Virtual Environment and Dependencies"
echo "=========================================="
echo ""

# Step 1: Stop and delete all python-api instances
echo "1. Stopping and deleting all python-api PM2 instances..."
pm2 stop python-api 2>/dev/null || true
pm2 delete python-api 2>/dev/null || true
echo "   ✅ Cleaned up PM2 instances"
echo ""

# Step 2: Navigate to document-processor directory
cd /opt/petrodealhub/document-processor
echo "2. Current directory: $(pwd)"
echo ""

# Step 3: Check if venv exists
echo "3. Checking virtual environment..."
if [ ! -d "venv" ]; then
    echo "   ⚠️  Virtual environment not found, creating new one..."
    python3 -m venv venv
    echo "   ✅ Created new virtual environment"
else
    echo "   ✅ Virtual environment exists"
fi
echo ""

# Step 4: Activate venv and install dependencies
echo "4. Activating virtual environment and installing dependencies..."
source venv/bin/activate

# Upgrade pip
echo "   Upgrading pip..."
pip install --upgrade pip --quiet

# Install dependencies
echo "   Installing dependencies from requirements.txt..."
pip install -r requirements.txt

# Verify FastAPI is installed
if python -c "import fastapi" 2>/dev/null; then
    echo "   ✅ FastAPI is installed"
else
    echo "   ❌ FastAPI installation failed!"
    exit 1
fi

# Show installed packages
echo "   Installed packages:"
pip list | grep -E "(fastapi|uvicorn|python-docx|supabase)" || true
echo ""

# Step 5: Verify main.py can be imported
echo "5. Verifying main.py can be imported..."
if python -c "import sys; sys.path.insert(0, '.'); import main" 2>/dev/null; then
    echo "   ✅ main.py imports successfully"
else
    echo "   ⚠️  Warning: main.py import check failed (this is OK if it's just missing env vars)"
fi
echo ""

# Step 6: Restart PM2 with correct configuration
echo "6. Starting PM2 with correct configuration..."
cd /opt/petrodealhub

# Check if ecosystem.config.cjs exists
if [ -f "ecosystem.config.cjs" ]; then
    echo "   Using ecosystem.config.cjs..."
    pm2 start ecosystem.config.cjs --only python-api
else
    echo "   Starting manually with correct interpreter path..."
    cd /opt/petrodealhub/document-processor
    pm2 start python \
        --name python-api \
        --interpreter /opt/petrodealhub/document-processor/venv/bin/python \
        --cwd /opt/petrodealhub/document-processor \
        -- main.py
fi

pm2 save
echo "   ✅ PM2 started"
echo ""

# Step 7: Wait a moment and check status
echo "7. Waiting 3 seconds for API to start..."
sleep 3
echo ""

# Step 8: Check PM2 status
echo "8. PM2 Status:"
pm2 status python-api
echo ""

# Step 9: Check logs for errors
echo "9. Checking recent logs (last 10 lines)..."
pm2 logs python-api --lines 10 --nostream 2>&1 | tail -10
echo ""

# Step 10: Test API health endpoint
echo "10. Testing API health endpoint..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "   ✅ API is responding!"
    curl -s http://localhost:8000/health | head -5
else
    echo "   ⚠️  API not responding yet (may need more time to start)"
    echo "   Check logs with: pm2 logs python-api"
fi
echo ""

echo "=========================================="
echo "Fix Complete!"
echo "=========================================="
echo ""
echo "If API is still not working, check logs:"
echo "  pm2 logs python-api --lines 50"
echo ""
