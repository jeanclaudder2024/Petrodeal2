#!/bin/bash
# Remove the misplaced continue statement after line 2433 (raise HTTPException)

cd /opt/petrodealhub/document-processor

echo "=========================================="
echo "Removing Bad Continue Statement"
echo "=========================================="
echo ""

# Backup
cp main.py main.py.remove_continue_backup.$(date +%Y%m%d_%H%M%S)

# Show the problematic area
echo "1. Current state around line 2430-2440:"
sed -n '2430,2440p' main.py | cat -n
echo ""

# Find the exact line numbers
echo "2. Finding the problematic lines..."
# Find where "raise HTTPException.*Template not found" is
RAISE_LINE=$(grep -n "raise HTTPException.*Template not found.*template_id" main.py | head -1 | cut -d: -f1)
echo "   Found 'raise HTTPException' at line: $RAISE_LINE"

# Show 5 lines after
echo ""
echo "3. Lines after raise HTTPException:"
sed -n "${RAISE_LINE},$((RAISE_LINE+10))p" main.py | cat -n -A
echo ""

# Remove any continue statements in the 5 lines after raise HTTPException
echo "4. Removing any continue statements after raise HTTPException..."
for i in {0..5}; do
    LINE_NUM=$((RAISE_LINE + i + 1))
    LINE_CONTENT=$(sed -n "${LINE_NUM}p" main.py)
    if echo "$LINE_CONTENT" | grep -q "^\s*continue\s*$"; then
        echo "   Found 'continue' at line $LINE_NUM - removing it"
        sed -i "${LINE_NUM}d" main.py
        # Adjust RAISE_LINE since we deleted a line
        RAISE_LINE=$((RAISE_LINE - 1))
    fi
done

# Also remove any stray continue statements around line 2350-2355
echo ""
echo "5. Checking for other misplaced continue statements..."
# Find continue statements that are way too indented (more than 30 spaces)
awk '/^[[:space:]]{30,}continue[[:space:]]*$/ {print NR": "$0}' main.py | head -5

# Remove overly indented continue statements
sed -i '/^[[:space:]]\{30,\}continue[[:space:]]*$/d' main.py

# Clean up empty lines after raise HTTPException
echo ""
echo "6. Cleaning up empty lines after raise HTTPException..."
RAISE_LINE=$(grep -n "raise HTTPException.*Template not found.*template_id" main.py | head -1 | cut -d: -f1)
# Remove empty lines right after raise (keep only one)
sed -i "${RAISE_LINE}{n;/^[[:space:]]*$/d;}" main.py

echo ""
echo "7. Showing fixed area:"
sed -n "$((RAISE_LINE-2)),$((RAISE_LINE+5))p" main.py | cat -n
echo ""

# Verify syntax
echo "8. Verifying Python syntax..."
source venv/bin/activate
if python3 -m py_compile main.py 2>&1; then
    echo "   ✅ Syntax check passed!"
else
    echo "   ❌ Syntax check failed!"
    python3 -m py_compile main.py 2>&1 | head -10
    exit 1
fi

echo ""
echo "=========================================="
echo "Fix Complete!"
echo "=========================================="
echo ""
echo "Now restart the API:"
echo "  pm2 restart python-api"
