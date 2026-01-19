#!/bin/bash
# Install missing Python dependencies

cd /opt/petrodealhub/document-processor

echo "=========================================="
echo "Installing Missing Python Dependencies"
echo "=========================================="
echo ""

# Activate venv
echo "1. Activating virtual environment..."
source venv/bin/activate
echo "   ✅ Virtual environment activated"
echo ""

# Check if requirements.txt exists
echo "2. Checking for requirements.txt..."
if [ -f "requirements.txt" ]; then
    echo "   ✅ Found requirements.txt"
    echo ""
    echo "3. Installing all dependencies from requirements.txt..."
    pip install -r requirements.txt
    echo ""
else
    echo "   ⚠️  requirements.txt not found, installing known dependencies..."
    echo ""
    echo "3. Installing required packages..."
    
    # Install aiohttp (the missing one)
    echo "   Installing aiohttp..."
    pip install aiohttp
    
    # Install other common dependencies
    echo "   Installing other dependencies..."
    pip install fastapi uvicorn python-dotenv supabase python-docx PyMuPDF openai python-multipart
    echo ""
fi

# Verify aiohttp is installed
echo "4. Verifying aiohttp is installed..."
if python -c "import aiohttp" 2>/dev/null; then
    echo "   ✅ aiohttp is installed"
else
    echo "   ❌ aiohttp installation failed!"
    exit 1
fi
echo ""

# Test if main.py can import all modules
echo "5. Testing if main.py can import all modules..."
if python -c "import sys; sys.path.insert(0, '.'); import main" 2>&1 | grep -q "ModuleNotFoundError"; then
    echo "   ❌ Still missing some modules:"
    python -c "import sys; sys.path.insert(0, '.'); import main" 2>&1 | grep "ModuleNotFoundError"
    echo ""
    echo "   Installing missing modules..."
    pip install $(python -c "import sys; sys.path.insert(0, '.'); import main" 2>&1 | grep "ModuleNotFoundError" | sed "s/.*'\(.*\)'.*/\1/")
else
    echo "   ✅ All modules can be imported"
fi
echo ""

echo "6. Restarting API..."
pm2 restart python-api
echo "   ✅ Restart command sent"
echo ""

echo "7. Waiting 5 seconds..."
sleep 5

echo "8. Testing API..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "   ✅ API is working!"
    curl -s http://localhost:8000/health | head -3
else
    echo "   ❌ API still not responding"
    echo ""
    echo "   Check logs:"
    pm2 logs python-api --err --lines 10 --nostream
fi

echo ""
echo "=========================================="
echo "Done!"
echo "=========================================="
