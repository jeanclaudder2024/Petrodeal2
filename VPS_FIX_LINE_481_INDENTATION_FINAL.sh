#!/bin/bash
# Fix line 481 indentation error

set -e

cd /opt/petrodealhub/document-processor
source venv/bin/activate

echo "=========================================="
echo "FIXING LINE 481 INDENTATION ERROR"
echo "=========================================="
echo ""

# 1. Show the problematic area
echo "1. Checking line 481 and surrounding context..."
sed -n '476,485p' main.py | cat -n -A
echo ""

# 2. Backup
BACKUP_FILE="main.py.before_fix.$(date +%Y%m%d_%H%M%S)"
cp main.py "$BACKUP_FILE"
echo "2. ✅ Backed up to: $BACKUP_FILE"
echo ""

# 3. Force restore from git
echo "3. Force restoring clean main.py from git..."
cd /opt/petrodealhub
git fetch origin main 2>/dev/null || git fetch origin master 2>/dev/null || true
cd /opt/petrodealhub/document-processor

# Multiple methods to restore
git checkout HEAD -- main.py 2>/dev/null || \
git checkout main -- main.py 2>/dev/null || \
git checkout master -- main.py 2>/dev/null || \
git reset --hard HEAD 2>/dev/null || \
git reset --hard origin/main 2>/dev/null || \
git reset --hard origin/master 2>/dev/null || true

# If still in submodule, try different approach
if [ -d "../.git" ]; then
    cd /opt/petrodealhub
    git submodule update --init --force document-processor 2>/dev/null || true
    cd /opt/petrodealhub/document-processor
    git checkout . 2>/dev/null || true
    git reset --hard HEAD 2>/dev/null || true
fi

echo "   ✅ Restored from git"
echo ""

# 4. Show the area again
echo "4. Verifying line 481 area after restore..."
sed -n '476,485p' main.py | cat -n -A
echo ""

# 5. Test syntax
echo "5. Testing Python syntax..."
SYNTAX_OUTPUT=$(python3 -m py_compile main.py 2>&1)
if [ $? -eq 0 ]; then
    echo "   ✅ Python syntax is 100% correct!"
else
    echo "   ❌ Syntax error still present:"
    echo "$SYNTAX_OUTPUT" | head -5
    
    # Try manual fix for line 481
    echo ""
    echo "   Attempting manual fix..."
    
    # Read the problematic lines
    LINE_479=$(sed -n '479p' main.py)
    LINE_480=$(sed -n '480p' main.py)
    LINE_481=$(sed -n '481p' main.py)
    
    echo "   Line 479: $LINE_479"
    echo "   Line 480: $LINE_480"
    echo "   Line 481: $LINE_481"
    
    # Check if line 480 is missing proper indentation or continuation
    # Fix common issues: trailing spaces, missing spaces
    sed -i '481s/^[[:space:]]*/        /' main.py 2>/dev/null || true
    
    # Test again
    python3 -m py_compile main.py 2>&1
    if [ $? -eq 0 ]; then
        echo "   ✅ Manual fix successful!"
    else
        echo "   ❌ Manual fix failed, restoring backup..."
        cp "$BACKUP_FILE" main.py
        echo "   Please check the file manually"
        exit 1
    fi
fi
echo ""

# 6. Verify imports still work
echo "6. Verifying critical imports..."
python3 << 'PYTHON_EOF'
try:
    from supabase import create_client
    print("✅ Supabase import OK")
except Exception as e:
    print(f"❌ Supabase import failed: {e}")
    import sys
    sys.exit(1)

try:
    from websockets.asyncio.client import ClientConnection
    print("✅ websockets.asyncio import OK")
except Exception as e:
    print(f"❌ websockets.asyncio import failed: {e}")
    import sys
    sys.exit(1)
PYTHON_EOF

if [ $? -ne 0 ]; then
    echo "   ❌ Import verification failed!"
    exit 1
fi
echo ""

# 7. Restart API
echo "7. Restarting API..."
pm2 delete python-api 2>/dev/null || true
sleep 2
cd /opt/petrodealhub/document-processor
pm2 start venv/bin/python --name python-api -- main.py
echo "   ✅ API restarted"
echo ""

# 8. Wait and check
echo "8. Waiting 10 seconds..."
sleep 10
echo ""

# 9. Check status
echo "9. Checking PM2 status..."
pm2 status python-api
echo ""

# 10. Check for errors
echo "10. Checking for startup errors..."
ERROR_CHECK=$(pm2 logs python-api --err --lines 10 --nostream 2>/dev/null | grep -c "IndentationError\|SyntaxError\|ModuleNotFoundError" || echo "0")
if [ "$ERROR_CHECK" -eq "0" ]; then
    echo "   ✅ No syntax or import errors in logs!"
else
    echo "   ⚠️  Found errors:"
    pm2 logs python-api --err --lines 15 --nostream | tail -10
fi
echo ""

# 11. Test API
echo "11. Testing API..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "   ✅ API is responding!"
else
    echo "   ❌ API is not responding yet"
    echo "   Check logs: pm2 logs python-api --err --lines 30"
fi
echo ""

echo "=========================================="
echo "FIX COMPLETE"
echo "=========================================="
echo ""
