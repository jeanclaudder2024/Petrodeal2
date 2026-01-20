#!/bin/bash
# Force fix syntax by removing ALL unreachable code after raise HTTPException

set -e

echo "=========================================="
echo "FORCE FIX SYNTAX - REMOVE ALL UNREACHABLE CODE"
echo "=========================================="
echo ""

cd /opt/petrodealhub/document-processor

# 1. Backup
echo "1. Backing up main.py..."
cp main.py main.py.backup.force_fix_$(date +%Y%m%d_%H%M%S)
echo "   ✅ Backup created"
echo ""

# 2. Find raise HTTPException
echo "2. Finding raise HTTPException statement..."
RAISE_LINE=$(grep -n "raise HTTPException.*Template not found.*template_id" main.py | head -1 | cut -d: -f1 || echo "0")

if [ "$RAISE_LINE" = "0" ]; then
    echo "   ❌ Could not find raise HTTPException statement"
    exit 1
fi

echo "   Found at line: $RAISE_LINE"
echo ""

# 3. Get indentation of raise statement
RAISE_INDENT=$(sed -n "${RAISE_LINE}p" main.py | sed 's/[^ ].*//' | wc -c)
RAISE_INDENT=$((RAISE_INDENT - 1))
echo "   Raise statement indentation: $RAISE_INDENT spaces"
echo ""

# 4. Find the proper next block (same or less indentation, not empty)
echo "3. Finding proper next block after raise..."
NEXT_BLOCK_LINE=0
for i in $(seq $(($RAISE_LINE + 1)) $(($RAISE_LINE + 200))); do
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
    
    # If line has same or less indentation than raise, it's the next block
    if [ "$INDENT_I" -le "$RAISE_INDENT" ]; then
        NEXT_BLOCK_LINE=$i
        echo "   Found next block at line $NEXT_BLOCK_LINE (indent: $INDENT_I)"
        break
    fi
done

if [ "$NEXT_BLOCK_LINE" = "0" ]; then
    echo "   ⚠️  Could not find next block, will remove up to 200 lines after raise"
    NEXT_BLOCK_LINE=$(($RAISE_LINE + 200))
fi
echo ""

# 5. Remove all lines between raise and next block
echo "4. Removing unreachable code (lines $(($RAISE_LINE + 1)) to $(($NEXT_BLOCK_LINE - 1)))..."
LINES_TO_REMOVE=$(($NEXT_BLOCK_LINE - $RAISE_LINE - 1))

if [ "$LINES_TO_REMOVE" -gt 0 ]; then
    # Use Python to remove lines safely
    python3 << PYTHON_REMOVE
with open('/opt/petrodealhub/document-processor/main.py', 'r') as f:
    lines = f.readlines()

# Remove lines from RAISE_LINE+1 to NEXT_BLOCK_LINE-1 (0-indexed)
start_idx = $RAISE_LINE  # Line after raise (0-indexed)
end_idx = $NEXT_BLOCK_LINE - 1  # Line before next block (0-indexed)

print(f"Removing lines {start_idx+1} to {end_idx} (0-indexed: {start_idx} to {end_idx-1})")
print(f"Total lines to remove: {end_idx - start_idx}")

# Show what we're removing
print("First 5 lines to remove:")
for i in range(start_idx, min(start_idx + 5, end_idx + 1, len(lines))):
    print(f"  {i+1}: {lines[i].rstrip()}")

# Remove lines in reverse order
removed_count = 0
for i in range(end_idx, start_idx - 1, -1):
    if i < len(lines):
        lines.pop(i)
        removed_count += 1

# Write back
with open('/opt/petrodealhub/document-processor/main.py', 'w') as f:
    f.writelines(lines)

print(f"✅ Removed {removed_count} unreachable line(s)")
PYTHON_REMOVE
    
    echo "   ✅ Unreachable code removed"
else
    echo "   ✅ No unreachable code to remove"
fi
echo ""

# 6. Verify syntax
echo "5. Verifying syntax..."
if python3 -m py_compile main.py 2>&1; then
    echo "   ✅ Syntax is valid!"
else
    SYNTAX_ERR=$(python3 -m py_compile main.py 2>&1)
    echo "   ❌ Still has syntax errors:"
    echo "$SYNTAX_ERR" | head -5
    
    # Try one more aggressive fix - check if there are more issues
    ERROR_LINE=$(echo "$SYNTAX_ERR" | grep -o "line [0-9]*" | head -1 | cut -d' ' -f2 || echo "0")
    if [ "$ERROR_LINE" != "0" ]; then
        echo ""
        echo "   Error at line $ERROR_LINE, checking context..."
        sed -n "$(($ERROR_LINE - 5)),$(($ERROR_LINE + 5))p" main.py | cat -n
    fi
fi
echo ""

# 7. Remove null bytes
echo "6. Removing null bytes..."
tr -d '\000' < main.py > main.py.tmp && mv main.py.tmp main.py 2>/dev/null || true
echo "   ✅ Null bytes removed"
echo ""

# 8. Final syntax check
echo "7. Final syntax check..."
if python3 -m py_compile main.py 2>&1; then
    echo "   ✅ Syntax is valid!"
else
    echo "   ❌ Still has syntax errors:"
    python3 -m py_compile main.py 2>&1 | head -5
    echo ""
    echo "   File may need manual review"
fi
echo ""

# 9. Restart API
echo "8. Restarting API..."
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

# 10. Check status
echo "9. Checking API status..."
pm2 status python-api
echo ""

# 11. Test API
echo "10. Testing API..."
sleep 3
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ API is responding (HTTP $HTTP_CODE)"
    curl -s http://localhost:8000/health | head -1
else
    echo "   ❌ API is not responding (HTTP $HTTP_CODE)"
    echo "   Checking logs..."
    pm2 logs python-api --lines 15 --nostream | tail -10
fi
echo ""

# 12. Check port 8000
echo "11. Checking port 8000..."
if lsof -ti:8000 > /dev/null 2>&1; then
    echo "   ✅ Port 8000 is in use"
else
    echo "   ❌ Port 8000 is NOT in use"
fi
echo ""

# 13. Save PM2
echo "12. Saving PM2..."
pm2 save || true
echo ""

# 14. Summary
echo "=========================================="
echo "FIX COMPLETE"
echo "=========================================="
echo ""
echo "Status:"
echo "  Syntax: $(python3 -m py_compile main.py 2>&1 | grep -q 'SyntaxError\|IndentationError' && echo '❌ Has errors' || echo '✅ Valid')"
echo "  Port 8000: $(lsof -ti:8000 > /dev/null 2>&1 && echo '✅ In use' || echo '❌ Not in use')"
echo "  API health: HTTP $HTTP_CODE"
echo ""
