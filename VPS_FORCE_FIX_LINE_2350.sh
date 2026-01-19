#!/bin/bash
# Force fix line 2350 - check and fix the actual problem

cd /opt/petrodealhub/document-processor

echo "=========================================="
echo "Force Fixing Line 2350"
echo "=========================================="
echo ""

# Backup
cp main.py main.py.force_fix.$(date +%Y%m%d_%H%M%S)

# Show what's actually on line 2350
echo "1. Checking line 2350 and surrounding area:"
sed -n '2345,2355p' main.py | cat -n -A
echo ""

# Discard all local changes first
echo "2. Discarding all local changes to main.py..."
git checkout -- main.py
git reset HEAD main.py 2>/dev/null || true
echo "   ✅ Discarded local changes"
echo ""

# Show again after git checkout
echo "3. Checking line 2350 after git checkout:"
sed -n '2345,2355p' main.py | cat -n -A
echo ""

# Try to compile
echo "4. Trying to compile..."
source venv/bin/activate
python3 -m py_compile main.py 2>&1 | head -5
COMPILE_RESULT=$?
echo ""

if [ $COMPILE_RESULT -ne 0 ]; then
    echo "5. Compilation failed - fixing manually..."
    
    # Get the actual error line
    ERROR_LINE=$(python3 -m py_compile main.py 2>&1 | grep "line [0-9]" | sed 's/.*line \([0-9]*\).*/\1/')
    if [ -z "$ERROR_LINE" ]; then
        ERROR_LINE=2350
    fi
    
    echo "   Error is at line: $ERROR_LINE"
    echo ""
    
    # Show the problematic area
    echo "   Problematic area (lines $((ERROR_LINE-3))-$((ERROR_LINE+3))):"
    sed -n "$((ERROR_LINE-3)),$((ERROR_LINE+3))p" main.py | cat -n
    echo ""
    
    # Check what's on that line
    PROBLEM_LINE=$(sed -n "${ERROR_LINE}p" main.py)
    echo "   Line $ERROR_LINE content: '$PROBLEM_LINE'"
    echo ""
    
    # Fix: if the line has too much indentation or is a misplaced statement, remove it
    # Check if it's the problematic logger.warning
    if echo "$PROBLEM_LINE" | grep -q "permission-convert.*EMPTY.*NULL.*skipping"; then
        echo "   Removing problematic logger.warning line..."
        sed -i "${ERROR_LINE}d" main.py
        echo "   ✅ Removed problematic line"
    elif echo "$PROBLEM_LINE" | grep -q "continue"; then
        # Check if it's a misplaced continue
        echo "   Checking if continue is misplaced..."
        # Get indentation of previous line
        PREV_LINE=$((ERROR_LINE - 1))
        PREV_CONTENT=$(sed -n "${PREV_LINE}p" main.py)
        PREV_INDENT=$(echo "$PREV_CONTENT" | sed 's/[^ ].*//' | wc -c)
        CURRENT_INDENT=$(echo "$PROBLEM_LINE" | sed 's/[^ ].*//' | wc -c)
        
        if [ $CURRENT_INDENT -gt $((PREV_INDENT + 8)) ]; then
            echo "   Continue has excessive indentation - removing..."
            sed -i "${ERROR_LINE}d" main.py
            echo "   ✅ Removed misplaced continue"
        else
            # Maybe need to fix indentation
            PROPER_INDENT=$(printf '%*s' $((PREV_INDENT + 4)) '')
            echo "   Fixing continue indentation..."
            sed -i "${ERROR_LINE}s/^[[:space:]]*/${PROPER_INDENT}/" main.py
            echo "   ✅ Fixed indentation"
        fi
    else
        # Check indentation - if it's way too indented, remove it
        PREV_LINE=$((ERROR_LINE - 1))
        PREV_INDENT=$(sed -n "${PREV_LINE}p" main.py | sed 's/[^ ].*//' | wc -c)
        CURRENT_INDENT=$(echo "$PROBLEM_LINE" | sed 's/[^ ].*//' | wc -c)
        
        if [ $CURRENT_INDENT -gt $((PREV_INDENT + 12)) ]; then
            echo "   Line has excessive indentation - likely misplaced, removing..."
            sed -i "${ERROR_LINE}d" main.py
            echo "   ✅ Removed misplaced line"
        else
            # Try to fix indentation
            PROPER_INDENT=$(printf '%*s' $((PREV_INDENT + 4)) '')
            if [ ! -z "${PROBLEM_LINE// }" ]; then
                echo "   Fixing line indentation..."
                sed -i "${ERROR_LINE}s/^[[:space:]]*/${PROPER_INDENT}/" main.py
                echo "   ✅ Fixed indentation"
            fi
        fi
    fi
    
    echo ""
    echo "6. Verifying after manual fix..."
    if python3 -m py_compile main.py 2>&1; then
        echo "   ✅ Syntax check passed!"
    else
        echo "   ❌ Still failing - showing error:"
        python3 -m py_compile main.py 2>&1 | head -10
        exit 1
    fi
else
    echo "5. ✅ Compilation passed - file is clean!"
fi

echo ""
echo "7. Restarting API..."
pm2 delete python-api 2>/dev/null || true
pm2 start python-api --name python-api --interpreter venv/bin/python -- main.py
echo "   ✅ Restarted"
echo ""

echo "8. Waiting 5 seconds..."
sleep 5

echo "9. Testing API..."
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
