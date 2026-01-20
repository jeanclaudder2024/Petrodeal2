#!/bin/bash
# Remove unreachable code after raise HTTPException

set -e

echo "=========================================="
echo "REMOVE UNREACHABLE CODE AFTER raise HTTPException"
echo "=========================================="
echo ""

cd /opt/petrodealhub/document-processor

# 1. Backup
echo "1. Backing up main.py..."
cp main.py main.py.backup.unreachable_fix_$(date +%Y%m%d_%H%M%S)
echo "   ✅ Backup created"
echo ""

# 2. Find the raise HTTPException line
echo "2. Finding raise HTTPException around line 2349..."
RAISE_LINE=$(grep -n "raise HTTPException.*Template not found.*template_id" main.py | head -1 | cut -d: -f1 || echo "0")
echo "   Found at line: $RAISE_LINE"
echo ""

if [ "$RAISE_LINE" != "0" ] && [ "$RAISE_LINE" -gt 0 ]; then
    echo "3. Checking context around line $RAISE_LINE..."
    echo "   Lines $(($RAISE_LINE - 2)) to $(($RAISE_LINE + 5)):"
    sed -n "$(($RAISE_LINE - 2)),$(($RAISE_LINE + 5))p" main.py | cat -n
    echo ""
    
    # Check what comes after the raise
    LINE_AFTER_RAISE=$(sed -n "$(($RAISE_LINE + 1))p" main.py)
    echo "   Line after raise: '$LINE_AFTER_RAISE'"
    
    # Check if there's unreachable code (indented code after raise in same block)
    if echo "$LINE_AFTER_RAISE" | grep -q "logger\|continue\|EMPTY"; then
        echo "   ❌ Found unreachable code after raise statement"
        echo ""
        
        echo "4. Finding all unreachable code after raise..."
        # Find where the proper next block starts (less indented or empty line then new statement)
        RAISE_INDENT=$(sed -n "${RAISE_LINE}p" main.py | sed 's/[^ ].*//' | wc -c)
        RAISE_INDENT=$((RAISE_INDENT - 1))
        
        echo "   Raise statement indentation: $RAISE_INDENT spaces"
        
        # Find the next line with same or less indentation that's not empty
        # Start checking from line after raise
        START_REMOVE=$(($RAISE_LINE + 1))
        END_REMOVE=$START_REMOVE
        
        # Find all lines that are more indented than the raise (unreachable code)
        # until we find a line with same or less indentation (proper next block)
        for i in $(seq $(($RAISE_LINE + 1)) $((RAISE_LINE + 50))); do
            LINE_CONTENT=$(sed -n "${i}p" main.py)
            if [ -z "$LINE_CONTENT" ]; then
                # Empty line - check next
                continue
            fi
            
            LINE_INDENT=$(echo "$LINE_CONTENT" | sed 's/[^ ].*//' | wc -c)
            LINE_INDENT=$((LINE_INDENT - 1))
            
            # If line has more indentation than raise, it's unreachable
            if [ "$LINE_INDENT" -gt "$RAISE_INDENT" ]; then
                echo "   Line $i is unreachable (indent: $LINE_INDENT > $RAISE_INDENT): ${LINE_CONTENT:0:60}..."
                END_REMOVE=$i
            elif [ "$LINE_INDENT" -le "$RAISE_INDENT" ]; then
                # Found proper next block
                break
            fi
        done
        
        if [ "$END_REMOVE" -gt "$START_REMOVE" ]; then
            echo ""
            echo "   Removing lines $START_REMOVE to $END_REMOVE (unreachable code)..."
            
            # Use Python to remove these lines safely
            python3 << PYTHON_REMOVE
with open('/opt/petrodealhub/document-processor/main.py', 'r') as f:
    lines = f.readlines()

# Lines are 0-indexed, but we have 1-indexed line numbers
# Remove lines from START_REMOVE-1 to END_REMOVE (inclusive, 1-indexed becomes 0-indexed)
start_idx = $START_REMOVE - 1  # Convert to 0-indexed
end_idx = $END_REMOVE  # Keep as-is, then we'll exclude

print(f"Removing lines {start_idx+1} to {end_idx} (0-indexed: {start_idx} to {end_idx-1})")

# Show what we're removing
print("Lines to remove:")
for i in range(start_idx, min(end_idx, len(lines))):
    print(f"  {i+1}: {lines[i].rstrip()}")

# Remove the lines (from end to start to preserve indices)
for i in range(end_idx - 1, start_idx - 1, -1):
    if i < len(lines):
        lines.pop(i)

# Write back
with open('/opt/petrodealhub/document-processor/main.py', 'w') as f:
    f.writelines(lines)

print(f"✅ Removed {end_idx - start_idx} unreachable line(s)")
PYTHON_REMOVE
            
            echo "   ✅ Unreachable code removed"
        else
            echo "   No unreachable code found to remove"
        fi
    else
        echo "   ✅ No unreachable code found after raise statement"
    fi
else
    echo "   ⚠️  Could not find raise HTTPException statement"
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
    echo ""
    
    # Try to pull completely fresh from submodule
    echo "   Pulling completely fresh version from submodule..."
    cd /opt/petrodealhub
    git submodule deinit -f document-processor 2>/dev/null || true
    rm -rf document-processor
    git submodule update --init --recursive document-processor
    cd document-processor
    git fetch origin master
    git reset --hard origin/master || git reset --hard origin/main
    git pull origin master || git pull origin main
    
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

# 6. Delete all python-api and restart
echo "6. Restarting API..."
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

# 7. Check status
echo "7. Checking API status..."
pm2 status python-api
echo ""

# 8. Check for errors
echo "8. Checking for errors..."
ERRORS=$(pm2 logs python-api --lines 10 --nostream 2>&1 | grep -i "error\|exception" | tail -3 || true)
if [ -n "$ERRORS" ]; then
    echo "   Found errors:"
    echo "$ERRORS"
else
    echo "   ✅ No errors"
fi
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
fi
echo ""

# 10. Check port 8000
echo "10. Checking port 8000..."
if lsof -ti:8000 > /dev/null 2>&1; then
    echo "   ✅ Port 8000 is in use"
else
    echo "   ❌ Port 8000 is NOT in use"
fi
echo ""

# 11. Save PM2
echo "11. Saving PM2..."
pm2 save || true
echo ""

# 12. Summary
echo "=========================================="
echo "FIX COMPLETE"
echo "=========================================="
echo ""
echo "Status:"
echo "  Syntax: $(python3 -m py_compile main.py 2>&1 | grep -q 'SyntaxError\|IndentationError' && echo '❌ Has errors' || echo '✅ Valid')"
echo "  Port 8000: $(lsof -ti:8000 > /dev/null 2>&1 && echo '✅ In use' || echo '❌ Not in use')"
echo "  API health: HTTP $HTTP_CODE"
echo ""
