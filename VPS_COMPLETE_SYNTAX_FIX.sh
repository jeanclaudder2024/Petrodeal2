#!/bin/bash
# Complete syntax fix - remove all unreachable code and verify structure

set -e

echo "=========================================="
echo "COMPLETE SYNTAX FIX"
echo "=========================================="
echo ""

cd /opt/petrodealhub/document-processor

# 1. Backup
echo "1. Backing up main.py..."
cp main.py main.py.backup.complete_fix_$(date +%Y%m%d_%H%M%S)
echo "   ✅ Backup created"
echo ""

# 2. Check current syntax error
echo "2. Checking current syntax error..."
SYNTAX_ERR=$(python3 -m py_compile main.py 2>&1 || echo "ERROR")
ERROR_LINE=$(echo "$SYNTAX_ERR" | grep -o "line [0-9]*" | head -1 | cut -d' ' -f2 || echo "0")
echo "   Error at line: $ERROR_LINE"
echo "   Error message:"
echo "$SYNTAX_ERR" | head -3
echo ""

if [ "$ERROR_LINE" != "0" ]; then
    echo "3. Checking context around line $ERROR_LINE..."
    echo "   Lines $(($ERROR_LINE - 5)) to $(($ERROR_LINE + 5)):"
    sed -n "$(($ERROR_LINE - 5)),$(($ERROR_LINE + 5))p" main.py | cat -n
    echo ""
    
    # Check what's at the error line
    LINE_CONTENT=$(sed -n "${ERROR_LINE}p" main.py)
    echo "   Line $ERROR_LINE: '$LINE_CONTENT'"
    
    # Check indentation
    LINE_INDENT=$(echo "$LINE_CONTENT" | sed 's/[^ ].*//' | wc -c)
    LINE_INDENT=$((LINE_INDENT - 1))
    echo "   Indentation: $LINE_INDENT spaces"
    echo ""
    
    # Check previous line
    PREV_LINE=$(sed -n "$(($ERROR_LINE - 1))p" main.py)
    PREV_INDENT=$(echo "$PREV_LINE" | sed 's/[^ ].*//' | wc -c)
    PREV_INDENT=$((PREV_INDENT - 1))
    echo "   Previous line ($(($ERROR_LINE - 1))): '$PREV_LINE'"
    echo "   Previous indent: $PREV_INDENT spaces"
    echo ""
    
    # If previous line is raise HTTPException, this line should not exist
    if echo "$PREV_LINE" | grep -q "raise HTTPException"; then
        echo "   ❌ Previous line is raise HTTPException - this line should not exist!"
        echo "   Removing line $ERROR_LINE..."
        sed -i "${ERROR_LINE}d" main.py
        echo "   ✅ Removed line"
        
        # Check if there are more unreachable lines
        echo ""
        echo "   Checking for more unreachable lines..."
        # Find next line with same or less indentation than raise
        RAISE_INDENT=$PREV_INDENT
        for i in $(seq $ERROR_LINE $((ERROR_LINE + 20))); do
            LINE_I=$(sed -n "${i}p" main.py 2>/dev/null || echo "")
            if [ -z "$LINE_I" ]; then
                break
            fi
            INDENT_I=$(echo "$LINE_I" | sed 's/[^ ].*//' | wc -c)
            INDENT_I=$((INDENT_I - 1))
            
            if [ "$INDENT_I" -gt "$RAISE_INDENT" ]; then
                echo "   Line $i is unreachable (indent: $INDENT_I > $RAISE_INDENT)"
                sed -i "${i}d" main.py
                # Adjust counter since we deleted a line
                i=$((i - 1))
            elif [ "$INDENT_I" -le "$RAISE_INDENT" ] && [ -n "$(echo "$LINE_I" | sed 's/^[[:space:]]*//')" ]; then
                # Found proper next block
                break
            fi
        done
    fi
fi
echo ""

# 4. Pull completely fresh from submodule (nuclear option)
echo "4. Pulling completely fresh version from submodule..."
cd /opt/petrodealhub

# Deinit and remove submodule
echo "   Removing submodule..."
git submodule deinit -f document-processor 2>/dev/null || true
rm -rf document-processor

# Re-init and pull
echo "   Re-initializing submodule..."
git submodule update --init --recursive document-processor

cd document-processor
git fetch origin master
git reset --hard origin/master || git reset --hard origin/main || {
    echo "   ⚠️  Could not reset to master, trying main..."
    git checkout main 2>/dev/null || git checkout master
    git pull origin main 2>/dev/null || git pull origin master
}

echo "   ✅ Submodule reset to latest"
echo ""

# 5. Remove null bytes
echo "5. Removing null bytes..."
cd /opt/petrodealhub/document-processor
tr -d '\000' < main.py > main.py.tmp && mv main.py.tmp main.py 2>/dev/null || true
echo "   ✅ Null bytes removed"
echo ""

# 6. Verify syntax
echo "6. Verifying syntax..."
if python3 -m py_compile main.py 2>&1; then
    echo "   ✅ Syntax is valid!"
else
    SYNTAX_ERR=$(python3 -m py_compile main.py 2>&1)
    echo "   ❌ Still has syntax errors:"
    echo "$SYNTAX_ERR" | head -5
    
    # Try one more time - check what's wrong
    ERROR_LINE=$(echo "$SYNTAX_ERR" | grep -o "line [0-9]*" | head -1 | cut -d' ' -f2 || echo "0")
    if [ "$ERROR_LINE" != "0" ]; then
        echo ""
        echo "   Error is at line $ERROR_LINE:"
        sed -n "$(($ERROR_LINE - 3)),$(($ERROR_LINE + 3))p" main.py | cat -n
    fi
fi
echo ""

# 7. Clean PM2 and restart
echo "7. Cleaning PM2 and restarting API..."
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

# 8. Check status
echo "8. Checking API status..."
pm2 status python-api
echo ""

# 9. Check for errors
echo "9. Checking for errors..."
ERRORS=$(pm2 logs python-api --lines 10 --nostream 2>&1 | grep -i "error\|exception" | tail -3 || true)
if [ -n "$ERRORS" ]; then
    echo "   Found errors:"
    echo "$ERRORS"
else
    echo "   ✅ No errors in recent logs"
fi
echo ""

# 10. Test API
echo "10. Testing API..."
sleep 3
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ API is responding (HTTP $HTTP_CODE)"
    curl -s http://localhost:8000/health | head -1
else
    echo "   ❌ API is not responding (HTTP $HTTP_CODE)"
    echo "   Checking logs..."
    pm2 logs python-api --lines 20 --nostream | tail -15
fi
echo ""

# 11. Check port 8000
echo "11. Checking port 8000..."
if lsof -ti:8000 > /dev/null 2>&1; then
    echo "   ✅ Port 8000 is in use"
else
    echo "   ❌ Port 8000 is NOT in use"
fi
echo ""

# 12. Save PM2
echo "12. Saving PM2..."
pm2 save || true
echo ""

# 13. Summary
echo "=========================================="
echo "FIX COMPLETE"
echo "=========================================="
echo ""
echo "Status:"
echo "  Syntax: $(python3 -m py_compile main.py 2>&1 | grep -q 'SyntaxError\|IndentationError' && echo '❌ Has errors' || echo '✅ Valid')"
echo "  Port 8000: $(lsof -ti:8000 > /dev/null 2>&1 && echo '✅ In use' || echo '❌ Not in use')"
echo "  API health: HTTP $HTTP_CODE"
echo ""
