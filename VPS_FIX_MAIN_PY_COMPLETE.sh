#!/bin/bash
# Complete fix for main.py indentation error on VPS
# This script will restore main.py from git, verify syntax, and restart the API

set -e  # Exit on error

echo "=========================================="
echo "Fixing main.py Indentation Error"
echo "=========================================="
echo ""

# Navigate to document-processor directory
cd /opt/petrodealhub/document-processor

# Backup current file with timestamp
BACKUP_FILE="main.py.broken.$(date +%Y%m%d_%H%M%S)"
echo "1. Backing up current main.py to: $BACKUP_FILE"
cp main.py "$BACKUP_FILE"
echo "   ✅ Backup created"
echo ""

# Restore from git
echo "2. Restoring main.py from git..."
git checkout HEAD -- main.py
echo "   ✅ File restored from git"
echo ""

# Activate venv
echo "3. Activating virtual environment..."
source venv/bin/activate
echo "   ✅ Virtual environment activated"
echo ""

# Verify syntax
echo "4. Verifying Python syntax..."
if python -m py_compile main.py; then
    echo "   ✅ Syntax check passed!"
else
    echo "   ❌ Syntax check failed!"
    echo "   Restoring backup..."
    cp "$BACKUP_FILE" main.py
    exit 1
fi
echo ""

# Check if PM2 is managing the API
echo "5. Checking PM2 processes..."
pm2 list | grep -q python-api || echo "   ⚠️  python-api not found in PM2"
echo ""

# Restart the API
echo "6. Restarting Python API with PM2..."
pm2 restart python-api || pm2 start python-api --name python-api --interpreter venv/bin/python -- main.py
echo "   ✅ API restart command sent"
echo ""

# Wait a moment for startup
echo "7. Waiting 3 seconds for API to start..."
sleep 3
echo ""

# Check PM2 status
echo "8. Checking PM2 status..."
pm2 status python-api
echo ""

# Test API health endpoint
echo "9. Testing API health endpoint..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "   ✅ API is responding on port 8000!"
    curl -s http://localhost:8000/health | head -20
else
    echo "   ❌ API is not responding on port 8000"
    echo ""
    echo "   Checking error logs..."
    pm2 logs python-api --err --lines 20 --nostream
    echo ""
    echo "   You may need to check the logs manually:"
    echo "   pm2 logs python-api --err --lines 50"
fi
echo ""

echo "=========================================="
echo "Fix Complete!"
echo "=========================================="
echo ""
echo "If the API is still not working, check logs with:"
echo "  pm2 logs python-api --err --lines 50"
echo ""
echo "Or try starting manually to see errors:"
echo "  cd /opt/petrodealhub/document-processor"
echo "  source venv/bin/activate"
echo "  python main.py"
echo ""
