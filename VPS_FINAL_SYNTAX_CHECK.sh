#!/bin/bash
# Final syntax check and fix

set -e

cd /opt/petrodealhub/document-processor
source venv/bin/activate

echo "=========================================="
echo "FINAL SYNTAX CHECK AND FIX"
echo "=========================================="
echo ""

# 1. Test Python syntax
echo "1. Testing Python syntax..."
SYNTAX_OUTPUT=$(python3 -m py_compile main.py 2>&1)
SYNTAX_EXIT=$?

if [ $SYNTAX_EXIT -eq 0 ]; then
    echo "   ✅ Python syntax is 100% correct!"
else
    echo "   ❌ Syntax errors found:"
    echo "$SYNTAX_OUTPUT"
    echo ""
    
    # Try to fix common issues
    echo "   Attempting to fix issues..."
    
    # Check if plan_tiers is referenced but not defined
    if grep -n "plan_tiers" main.py | grep -v "def\|class\|import\|#" > /dev/null; then
        PLAN_TIERS_LINE=$(grep -n "plan_tiers" main.py | grep -v "def\|class\|import\|#" | head -1 | cut -d: -f1)
        if [ ! -z "$PLAN_TIERS_LINE" ]; then
            # Check if plan_tiers is defined before use
            PLAN_TIERS_DEF=$(grep -n "plan_tiers\s*=" main.py | head -1 | cut -d: -f1)
            if [ -z "$PLAN_TIERS_DEF" ] || [ "$PLAN_TIERS_DEF" -gt "$PLAN_TIERS_LINE" ]; then
                echo "   Found undefined plan_tiers reference at line $PLAN_TIERS_LINE"
                echo "   Fixing: replacing plan_tiers with plan_ids"
                sed -i 's/plan_tiers if plan_tiers else plan_ids/plan_ids/g' main.py
                echo "   ✅ Fixed plan_tiers reference"
            fi
        fi
    fi
    
    # Test again
    python3 -m py_compile main.py 2>&1
    if [ $? -eq 0 ]; then
        echo "   ✅ Syntax fixed!"
    else
        echo "   ❌ Still has syntax errors"
        python3 -m py_compile main.py 2>&1 | head -10
        exit 1
    fi
fi
echo ""

# 2. Check for undefined variables
echo "2. Checking for undefined variables..."
if grep -n "plan_tiers" main.py | grep -v "def\|class\|import\|#\|plan_tiers\s*=" > /dev/null; then
    echo "   ⚠️  Found 'plan_tiers' usage - checking if defined..."
    PLAN_TIERS_LINES=$(grep -n "plan_tiers" main.py | grep -v "def\|class\|import\|#")
    while IFS= read -r line; do
        LINE_NUM=$(echo "$line" | cut -d: -f1)
        CONTENT=$(echo "$line" | cut -d: -f2-)
        echo "   Line $LINE_NUM: $CONTENT"
    done <<< "$PLAN_TIERS_LINES"
    
    # Check if plan_tiers is defined in the function
    if ! grep -n "plan_tiers\s*=" main.py > /dev/null; then
        echo "   ⚠️  'plan_tiers' is used but never defined - replacing with 'plan_ids'"
        sed -i 's/plan_tiers/plan_ids/g' main.py
        echo "   ✅ Fixed plan_tiers references"
    fi
fi
echo ""

# 3. Final syntax test
echo "3. Final syntax test..."
python3 -m py_compile main.py 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ Python syntax is 100% correct!"
else
    echo "   ❌ Syntax still has errors"
    python3 -m py_compile main.py 2>&1 | head -10
    exit 1
fi
echo ""

# 4. Verify imports
echo "4. Verifying critical imports..."
python3 << 'PYTHON_EOF'
try:
    from supabase import create_client
    from websockets.asyncio.client import ClientConnection
    print("✅ All imports OK")
except Exception as e:
    print(f"❌ Import error: {e}")
    import sys
    sys.exit(1)
PYTHON_EOF

if [ $? -ne 0 ]; then
    echo "   ❌ Import verification failed!"
    exit 1
fi
echo ""

# 5. Restart API
echo "5. Restarting API..."
pm2 delete python-api 2>/dev/null || true
sleep 2
cd /opt/petrodealhub/document-processor
pm2 start venv/bin/python --name python-api -- main.py
echo "   ✅ API restarted"
echo ""

# 6. Wait and verify
echo "6. Waiting 10 seconds for API to start..."
sleep 10
echo ""

# 7. Check status
echo "7. Checking PM2 status..."
pm2 status python-api
echo ""

# 8. Check for errors
echo "8. Checking for startup errors..."
ERROR_COUNT=$(pm2 logs python-api --err --lines 15 --nostream 2>/dev/null | grep -c "IndentationError\|SyntaxError\|NameError.*plan_tiers" || echo "0")
if [ "$ERROR_COUNT" -eq "0" ]; then
    echo "   ✅ No errors in API logs!"
else
    echo "   ⚠️  Found errors:"
    pm2 logs python-api --err --lines 20 --nostream | tail -15
fi
echo ""

# 9. Test API
echo "9. Testing API..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "   ✅ API is responding!"
    echo ""
    echo "   Health check response:"
    curl -s http://localhost:8000/health | head -3
else
    echo "   ❌ API is not responding yet"
    echo "   Check: pm2 logs python-api --err --lines 30"
fi
echo ""

echo "=========================================="
echo "FINAL CHECK COMPLETE"
echo "=========================================="
echo ""
