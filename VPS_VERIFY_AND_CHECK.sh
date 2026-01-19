#!/bin/bash
# Verify main.py syntax and check PM2 logs

cd /opt/petrodealhub/document-processor

# Activate venv first
source venv/bin/activate

# Verify syntax with python3 from venv
echo "Checking Python syntax..."
python -m py_compile main.py

if [ $? -eq 0 ]; then
    echo "✅ Syntax check passed!"
else
    echo "❌ Syntax check failed!"
    exit 1
fi

echo ""
echo "Checking PM2 logs for errors..."
pm2 logs python-api --err --lines 30 --nostream

echo ""
echo "Checking if API is actually running..."
ps aux | grep "[p]ython.*main.py"

echo ""
echo "Trying to start manually to see errors..."
echo "(Press Ctrl+C after a few seconds)"
timeout 5 python main.py || true
