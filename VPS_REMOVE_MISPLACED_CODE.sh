#!/bin/bash
# Remove all misplaced code after raise HTTPException statement

cd /opt/petrodealhub/document-processor

echo "=========================================="
echo "Removing Misplaced Code After raise HTTPException"
echo "=========================================="
echo ""

# Backup
cp main.py main.py.remove_misplaced_backup.$(date +%Y%m%d_%H%M%S)

# Find the raise HTTPException line
RAISE_LINE=$(grep -n "raise HTTPException.*Template not found.*template_id" main.py | head -1 | cut -d: -f1)
echo "1. Found 'raise HTTPException' at line: $RAISE_LINE"

# Show what's currently there
echo ""
echo "2. Current state after raise (lines $((RAISE_LINE))-$((RAISE_LINE+15))):"
sed -n "${RAISE_LINE},$((RAISE_LINE+15))p" main.py | cat -n -A
echo ""

# Find where the correct next section starts (# Also update local metadata)
NEXT_SECTION=$(grep -n "^        # Also update local metadata file if template_record has file_name" main.py | head -1 | cut -d: -f1)
echo "3. Found next section at line: $NEXT_SECTION"

if [ -z "$NEXT_SECTION" ]; then
    echo "   ⚠️  Could not find next section, looking for alternative marker..."
    # Try to find the next proper code block (not overly indented)
    NEXT_SECTION=$(awk -v start=$RAISE_LINE 'NR > start && /^[[:space:]]{0,20}[^[:space:]]/ && !/^[[:space:]]{30,}/ {print NR; exit}' main.py)
    if [ -z "$NEXT_SECTION" ]; then
        # Fallback: find next line with reasonable indentation (0-20 spaces)
        NEXT_SECTION=$((RAISE_LINE + 10))
    fi
    echo "   Using line: $NEXT_SECTION"
fi

# Show what should be kept
echo ""
echo "4. What should remain (line $NEXT_SECTION):"
sed -n "${NEXT_SECTION}p" main.py
echo ""

# Remove lines between raise HTTPException and the next section
# Keep the raise line, remove everything after it until the next section
echo "5. Removing misplaced code between lines $((RAISE_LINE+1)) and $((NEXT_SECTION-1))..."
if [ $NEXT_SECTION -gt $((RAISE_LINE + 1)) ]; then
    # Delete lines from after raise until before next section
    sed -i "$((RAISE_LINE+1)),$((NEXT_SECTION-1))d" main.py
    echo "   ✅ Removed $((NEXT_SECTION - RAISE_LINE - 1)) misplaced lines"
else
    echo "   ℹ️  No lines to remove (next section is immediately after raise)"
fi

# Ensure there's exactly one empty line after raise HTTPException
RAISE_LINE_NEW=$(grep -n "raise HTTPException.*Template not found.*template_id" main.py | head -1 | cut -d: -f1)
if [ ! -z "$RAISE_LINE_NEW" ]; then
    # Check line after raise
    LINE_AFTER=$((RAISE_LINE_NEW + 1))
    LINE_CONTENT=$(sed -n "${LINE_AFTER}p" main.py)
    
    # If line after is not empty and not the next section, add empty line
    if [ ! -z "${LINE_CONTENT// }" ] && ! echo "$LINE_CONTENT" | grep -q "^[[:space:]]*#"; then
        sed -i "${LINE_AFTER}i\\" main.py
        echo "   ✅ Added empty line after raise HTTPException"
    fi
fi

# Show the fixed area
echo ""
echo "6. Fixed area (lines $((RAISE_LINE_NEW-2))-$((RAISE_LINE_NEW+5))):"
sed -n "$((RAISE_LINE_NEW-2)),$((RAISE_LINE_NEW+5))p" main.py | cat -n
echo ""

# Verify syntax
echo "7. Verifying Python syntax..."
source venv/bin/activate
if python3 -m py_compile main.py 2>&1; then
    echo "   ✅ Syntax check passed!"
else
    echo "   ❌ Syntax check failed!"
    echo ""
    echo "   Error details:"
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
echo "  sleep 3"
echo "  curl http://localhost:8000/health"
echo ""
