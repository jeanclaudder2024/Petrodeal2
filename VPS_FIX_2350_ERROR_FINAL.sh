#!/bin/bash
# Final fix: Remove line 2350 error and restore clean main.py

cd /opt/petrodealhub/document-processor

echo "=========================================="
echo "Fixing Line 2350 Error - Final Fix"
echo "=========================================="
echo ""

# Backup current file
BACKUP_FILE="main.py.error_2350_backup.$(date +%Y%m%d_%H%M%S)"
echo "1. Creating backup: $BACKUP_FILE"
cp main.py "$BACKUP_FILE"
echo "   ✅ Backup created"
echo ""

# Check git status
echo "2. Checking git status..."
git status main.py --short
echo ""

# Restore from git - this removes the problematic line
echo "3. Restoring clean main.py from git..."
git checkout HEAD -- main.py
echo "   ✅ Restored from git"
echo ""

# Verify the problematic line is gone
echo "4. Verifying problematic line is removed..."
if grep -n "\[permission-convert\] Plan.*EMPTY.*NULL.*skipping" main.py; then
    echo "   ❌ Problematic line still exists! Removing manually..."
    # Remove the line manually
    sed -i '/\[permission-convert\] Plan.*EMPTY.*NULL.*skipping/d' main.py
    echo "   ✅ Removed manually"
else
    echo "   ✅ Problematic line not found (good!)"
fi
echo ""

# Check what's on line 2350 now
echo "5. Checking line 2350 area (lines 2348-2352):"
sed -n '2348,2352p' main.py | cat -n
echo ""

# Verify syntax
echo "6. Verifying Python syntax..."
source venv/bin/activate
if python3 -m py_compile main.py 2>&1; then
    echo "   ✅ Syntax check passed!"
else
    echo "   ❌ Syntax check failed!"
    python3 -m py_compile main.py 2>&1 | head -10
    echo ""
    echo "   Restoring backup and trying manual fix..."
    cp "$BACKUP_FILE" main.py
    
    # Manual fix: remove the problematic line
    echo "   Removing problematic line manually..."
    sed -i '/logger\.warning.*\[permission-convert\].*Plan.*EMPTY.*NULL.*skipping/d' main.py
    
    # Verify again
    python3 -m py_compile main.py 2>&1 || {
        echo "   ❌ Still failing after manual fix"
        exit 1
    }
    echo "   ✅ Fixed manually!"
fi
echo ""

# Restart PM2
echo "7. Restarting API with PM2..."
pm2 delete python-api 2>/dev/null || true
pm2 start python-api --name python-api --interpreter venv/bin/python -- main.py
echo "   ✅ Restart command sent"
echo ""

# Wait for startup
echo "8. Waiting 5 seconds for API to start..."
sleep 5
echo ""

# Check PM2 status
echo "9. Checking PM2 status..."
pm2 status python-api
echo ""

# Test API
echo "10. Testing API health endpoint..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "   ✅ API is responding!"
    curl -s http://localhost:8000/health | head -5
else
    echo "   ❌ API is still not responding"
    echo ""
    echo "   Checking error logs again..."
    pm2 logs python-api --err --lines 10 --nostream
fi
echo ""

echo "=========================================="
echo "Fix Complete!"
echo "=========================================="
echo ""
echo "If API is still not working, check:"
echo "  pm2 logs python-api --err --lines 50"
echo ""
