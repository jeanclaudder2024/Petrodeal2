#!/bin/bash
# Directly fix line 2350 indentation error

set -e

echo "=========================================="
echo "FIX LINE 2350 DIRECTLY"
echo "=========================================="
echo ""

cd /opt/petrodealhub/document-processor

# 1. Backup
echo "1. Backing up main.py..."
cp main.py main.py.backup.direct_fix_$(date +%Y%m%d_%H%M%S)
echo "   ✅ Backup created"
echo ""

# 2. Check what's actually around line 2350
echo "2. Checking lines 2345-2355..."
sed -n '2345,2355p' main.py | cat -n
echo ""

# 3. Check if line 2350 is the EMPTY/NULL line
LINE_2350=$(sed -n '2350p' main.py)
echo "   Line 2350: '$LINE_2350'"

if echo "$LINE_2350" | grep -q "EMPTY/NULL, skipping"; then
    echo "   ❌ Line 2350 has the EMPTY/NULL warning - this is wrong!"
    echo ""
    echo "3. Fixing line 2350..."
    
    # Check what should be at line 2350 (should be plan_uuid_test line)
    # Check line 2349 and 2351 to understand context
    LINE_2349=$(sed -n '2349p' main.py)
    LINE_2351=$(sed -n '2351p' main.py)
    
    echo "   Line 2349: '$LINE_2349'"
    echo "   Line 2351: '$LINE_2351'"
    
    # If line 2349 is "try:" or has "# First, check", then 2350 should be plan_uuid_test
    if echo "$LINE_2349" | grep -q "try:\|First, check"; then
        echo "   Line 2350 should be 'plan_uuid_test = uuid.UUID(...)'"
        echo "   Removing misplaced line and adding correct one..."
        
        # Calculate correct indentation (should be 4 spaces more than the try: line)
        TRY_INDENT=$(echo "$LINE_2349" | sed 's/[^ ].*//' | wc -c)
        CORRECT_INDENT=$(printf "%*s" $((TRY_INDENT + 4)) "")
        
        # Replace line 2350 with correct content
        sed -i '2350c\                                    plan_uuid_test = uuid.UUID(str(plan_identifier))' main.py
        
        echo "   ✅ Fixed line 2350"
    else
        # Just remove the problematic line
        echo "   Removing problematic line 2350..."
        sed -i '2350d' main.py
        echo "   ✅ Removed problematic line"
    fi
else
    echo "   ✅ Line 2350 looks correct"
fi
echo ""

# 4. Verify syntax
echo "4. Verifying syntax..."
if python3 -m py_compile main.py 2>&1; then
    echo "   ✅ Syntax is valid!"
else
    SYNTAX_ERR=$(python3 -m py_compile main.py 2>&1)
    echo "   ❌ Still has syntax errors:"
    echo "$SYNTAX_ERR" | head -5
    echo ""
    
    # Check what line has the error now
    ERROR_LINE=$(echo "$SYNTAX_ERR" | grep -o "line [0-9]*" | head -1 | cut -d' ' -f2)
    if [ -n "$ERROR_LINE" ]; then
        echo "   Error is now at line $ERROR_LINE"
        echo "   Checking context around line $ERROR_LINE:"
        START_LINE=$((ERROR_LINE - 5))
        END_LINE=$((ERROR_LINE + 5))
        sed -n "${START_LINE},${END_LINE}p" main.py | cat -n
    fi
    
    # Try to pull fresh from submodule
    echo ""
    echo "   Pulling fresh version from submodule..."
    cd /opt/petrodealhub
    git submodule update --init --recursive document-processor
    cd document-processor
    git fetch origin master
    git reset --hard origin/master || git reset --hard origin/main
    
    # Remove null bytes
    tr -d '\000' < main.py > main.py.tmp && mv main.py.tmp main.py 2>/dev/null || true
    
    # Check syntax again
    if python3 -m py_compile main.py 2>&1; then
        echo "   ✅ Syntax is now valid after fresh pull"
    else
        echo "   ⚠️  Still has syntax errors after fresh pull"
        python3 -m py_compile main.py 2>&1 | head -5
    fi
fi
echo ""

# 5. Delete all python-api and restart
echo "5. Restarting API..."
pm2 delete python-api 2>/dev/null || true
sleep 3

cd /opt/petrodealhub/document-processor

# Find Python
if [ -d "../venv" ] && [ -f "../venv/bin/python" ]; then
    PYTHON_CMD="../venv/bin/python"
else
    PYTHON_CMD="python3"
fi

# Start API
pm2 start "$PYTHON_CMD" main.py \
    --name python-api \
    --interpreter python3 \
    --cwd /opt/petrodealhub/document-processor \
    --watch false \
    --instances 1

sleep 6
echo ""

# 6. Check status
echo "6. Checking API status..."
pm2 status python-api
echo ""

# 7. Check for errors
echo "7. Checking for errors..."
ERRORS=$(pm2 logs python-api --lines 15 --nostream 2>&1 | grep -i "error\|exception" | tail -3 || true)
if [ -n "$ERRORS" ]; then
    echo "   Found errors:"
    echo "$ERRORS"
else
    echo "   ✅ No errors"
fi
echo ""

# 8. Test API
echo "8. Testing API..."
sleep 3
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ API is responding (HTTP $HTTP_CODE)"
    curl -s http://localhost:8000/health | head -1
else
    echo "   ❌ API is not responding (HTTP $HTTP_CODE)"
fi
echo ""

# 9. Check port 8000
echo "9. Checking port 8000..."
if lsof -ti:8000 > /dev/null 2>&1; then
    echo "   ✅ Port 8000 is in use"
else
    echo "   ❌ Port 8000 is NOT in use"
fi
echo ""

# 10. Save PM2
echo "10. Saving PM2..."
pm2 save || true
echo ""

# 11. Summary
echo "=========================================="
echo "FIX COMPLETE"
echo "=========================================="
echo ""
echo "Status:"
echo "  Syntax: $(python3 -m py_compile main.py 2>&1 | grep -q 'SyntaxError\|IndentationError' && echo '❌ Has errors' || echo '✅ Valid')"
echo "  Port 8000: $(lsof -ti:8000 > /dev/null 2>&1 && echo '✅ In use' || echo '❌ Not in use')"
echo "  API health: HTTP $HTTP_CODE"
echo ""
