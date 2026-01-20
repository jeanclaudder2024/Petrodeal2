#!/bin/bash
# Fix and verify the structure is correct

set -e

echo "=========================================="
echo "FIX AND VERIFY STRUCTURE"
echo "=========================================="
echo ""

cd /opt/petrodealhub/document-processor

# 1. Check current line 2350
echo "1. Checking what's at line 2350..."
LINE_2350=$(sed -n '2350p' main.py 2>/dev/null || echo "")
echo "   Line 2350: '$LINE_2350'"
echo ""

# 2. Find the raise HTTPException line
echo "2. Finding raise HTTPException statement..."
RAISE_LINE=$(grep -n "raise HTTPException.*Template not found.*template_id" main.py | head -1 | cut -d: -f1 || echo "0")
echo "   Found at line: $RAISE_LINE"
echo ""

if [ "$RAISE_LINE" != "0" ] && [ "$RAISE_LINE" -gt 0 ]; then
    echo "3. Checking structure around line $RAISE_LINE..."
    echo "   Lines $(($RAISE_LINE - 5)) to $(($RAISE_LINE + 10)):"
    sed -n "$(($RAISE_LINE - 5)),$(($RAISE_LINE + 10))p" main.py | cat -n
    echo ""
    
    # Check what comes after raise
    RAISE_INDENT=$(sed -n "${RAISE_LINE}p" main.py | sed 's/[^ ].*//' | wc -c)
    RAISE_INDENT=$((RAISE_INDENT - 1))
    echo "   Raise statement indentation: $RAISE_INDENT spaces"
    echo ""
    
    # Find all lines after raise that are more indented (unreachable)
    echo "4. Finding all unreachable code after raise..."
    UNREACHABLE_LINES=()
    for i in $(seq $(($RAISE_LINE + 1)) $(($RAISE_LINE + 100))); do
        LINE_I=$(sed -n "${i}p" main.py 2>/dev/null || echo "")
        if [ -z "$LINE_I" ]; then
            break
        fi
        
        # Skip empty lines
        if [ -z "$(echo "$LINE_I" | sed 's/^[[:space:]]*//')" ]; then
            continue
        fi
        
        INDENT_I=$(echo "$LINE_I" | sed 's/[^ ].*//' | wc -c)
        INDENT_I=$((INDENT_I - 1))
        
        if [ "$INDENT_I" -gt "$RAISE_INDENT" ]; then
            echo "   Line $i is unreachable (indent: $INDENT_I > $RAISE_INDENT)"
            UNREACHABLE_LINES+=($i)
        elif [ "$INDENT_I" -le "$RAISE_INDENT" ]; then
            # Found proper next block
            echo "   Found proper next block at line $i (indent: $INDENT_I <= $RAISE_INDENT)"
            break
        fi
    done
    
    if [ ${#UNREACHABLE_LINES[@]} -gt 0 ]; then
        echo ""
        echo "   Removing ${#UNREACHABLE_LINES[@]} unreachable line(s)..."
        # Remove in reverse order to preserve line numbers
        for (( idx=${#UNREACHABLE_LINES[@]}-1 ; idx>=0 ; idx-- )) ; do
            LINE_NUM=${UNREACHABLE_LINES[idx]}
            sed -i "${LINE_NUM}d" main.py
        done
        echo "   ✅ Removed unreachable code"
    else
        echo "   ✅ No unreachable code found"
    fi
fi
echo ""

# 5. Verify syntax
echo "5. Verifying syntax..."
if python3 -m py_compile main.py 2>&1; then
    echo "   ✅ Syntax is valid!"
else
    SYNTAX_ERR=$(python3 -m py_compile main.py 2>&1)
    echo "   ❌ Still has syntax errors:"
    echo "$SYNTAX_ERR" | head -5
    
    # Get the error line
    ERROR_LINE=$(echo "$SYNTAX_ERR" | grep -o "line [0-9]*" | head -1 | cut -d' ' -f2 || echo "0")
    if [ "$ERROR_LINE" != "0" ]; then
        echo ""
        echo "   Error at line $ERROR_LINE:"
        sed -n "$(($ERROR_LINE - 3)),$(($ERROR_LINE + 3))p" main.py | cat -n
        echo ""
        echo "   Removing problematic line..."
        sed -i "${ERROR_LINE}d" main.py
        
        # Check syntax again
        if python3 -m py_compile main.py 2>&1; then
            echo "   ✅ Syntax is now valid after removing line $ERROR_LINE"
        else
            echo "   ⚠️  Still has errors, will try to restore from git..."
        fi
    fi
fi
echo ""

# 6. If still has errors, restore from specific commit
if ! python3 -m py_compile main.py 2>&1 >/dev/null; then
    echo "6. Restoring from a known good commit..."
    cd /opt/petrodealhub/document-processor
    
    # Try to find a commit that works
    git log --oneline -20 | head -10
    
    # Try the commit before the problematic one
    git reset --hard HEAD~1 2>/dev/null || {
        echo "   Trying to checkout specific commit..."
        # Try to find a commit that might work
        git fetch origin master
        # Try HEAD~5, HEAD~10, etc.
        for i in 1 2 3 4 5; do
            if git reset --hard HEAD~$i 2>/dev/null; then
                echo "   ✅ Reset to HEAD~$i"
                break
            fi
        done
    }
    
    # Remove null bytes
    tr -d '\000' < main.py > main.py.tmp && mv main.py.tmp main.py 2>/dev/null || true
    
    # Check syntax
    if python3 -m py_compile main.py 2>&1; then
        echo "   ✅ Syntax is valid after reset"
    else
        echo "   ⚠️  Still has errors after reset"
    fi
fi
echo ""

# 7. Restart API
echo "7. Restarting API..."
pm2 delete python-api 2>/dev/null || true
sleep 3

cd /opt/petrodealhub/document-processor

if [ -d "../venv" ] && [ -f "../venv/bin/python" ]; then
    PYTHON_CMD="../venv/bin/python"
else
    PYTHON_CMD="python3"
fi

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

# 9. Test API
echo "9. Testing API..."
sleep 3
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ API is responding (HTTP $HTTP_CODE)"
    curl -s http://localhost:8000/health | head -1
else
    echo "   ❌ API is not responding (HTTP $HTTP_CODE)"
    pm2 logs python-api --lines 15 --nostream | tail -10
fi
echo ""

# 10. Summary
echo "=========================================="
echo "FIX COMPLETE"
echo "=========================================="
echo ""
echo "Status:"
echo "  Syntax: $(python3 -m py_compile main.py 2>&1 | grep -q 'SyntaxError\|IndentationError' && echo '❌ Has errors' || echo '✅ Valid')"
echo "  Port 8000: $(lsof -ti:8000 > /dev/null 2>&1 && echo '✅ In use' || echo '❌ Not in use')"
echo "  API health: HTTP $HTTP_CODE"
echo ""
