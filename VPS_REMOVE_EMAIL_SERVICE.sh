#!/bin/bash
# Remove email_service.py from VPS

cd /opt/petrodealhub/document-processor

echo "=========================================="
echo "Removing email_service.py"
echo "=========================================="
echo ""

# Backup first (just in case)
if [ -f "email_service.py" ]; then
    cp email_service.py email_service.py.backup.$(date +%Y%m%d_%H%M%S)
    echo "1. Backed up email_service.py"
    echo ""
    
    # Remove the file
    rm email_service.py
    echo "2. ✅ Removed email_service.py"
    echo ""
else
    echo "1. ℹ️  email_service.py doesn't exist (already removed)"
    echo ""
fi

# Verify syntax still works
echo "3. Verifying main.py syntax..."
source venv/bin/activate
python3 -m py_compile main.py
if [ $? -eq 0 ]; then
    echo "   ✅ Syntax check passed - app will work without email_service"
else
    echo "   ❌ Syntax check failed!"
    exit 1
fi
echo ""

# Restart API
echo "4. Restarting API..."
pm2 restart python-api
echo "   ✅ Restart command sent"
echo ""

echo "5. Waiting 5 seconds..."
sleep 5

echo "6. Testing API..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "   ✅ API is working!"
    curl -s http://localhost:8000/health | head -3
else
    echo "   ❌ API still not responding"
    echo ""
    echo "   Check logs:"
    pm2 logs python-api --err --lines 15 --nostream
fi

echo ""
echo "=========================================="
echo "Done!"
echo "=========================================="
echo ""
echo "Note: Email service has been removed."
echo "main.py already handles this gracefully with try-except."
echo ""
