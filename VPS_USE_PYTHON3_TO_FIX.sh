#!/bin/bash
# Fix main.py using Python 3 directly to ensure proper syntax check

cd /opt/petrodealhub/document-processor

echo "=========================================="
echo "Fixing main.py with Python 3"
echo "=========================================="
echo ""

# Backup
cp main.py main.py.py3_fix.$(date +%Y%m%d_%H%M%S)

# Restore from git
echo "1. Restoring from git..."
git checkout HEAD -- main.py
echo "   ✅ Restored"
echo ""

# Check what Python version we have
echo "2. Checking Python versions..."
which python3 && python3 --version || echo "python3 not found"
which python && python --version || echo "python not found"
echo ""

# Activate venv
echo "3. Activating venv..."
source venv/bin/activate
PYTHON_CMD=$(which python3 || which python)
echo "   Using: $PYTHON_CMD"
echo ""

# Verify with python3
echo "4. Verifying syntax with $PYTHON_CMD..."
if $PYTHON_CMD -m py_compile main.py; then
    echo "   ✅ Syntax check passed!"
else
    echo "   ❌ Syntax check failed!"
    echo ""
    echo "   Showing the error:"
    $PYTHON_CMD -m py_compile main.py 2>&1
    echo ""
    echo "   Checking what's on line 2350:"
    sed -n '2345,2355p' main.py | cat -n
    exit 1
fi
echo ""

# Restart API
echo "5. Restarting API..."
pm2 restart python-api || pm2 start python-api --name python-api --interpreter venv/bin/python -- main.py
sleep 3
echo ""

# Test
echo "6. Testing API..."
curl http://localhost:8000/health || echo "❌ API not responding - check logs: pm2 logs python-api --err --lines 50"
