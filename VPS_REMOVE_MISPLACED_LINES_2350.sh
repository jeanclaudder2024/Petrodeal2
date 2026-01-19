#!/bin/bash
# Remove misplaced lines 2350-2351 (logger.warning and continue after raise HTTPException)

cd /opt/petrodealhub/document-processor

echo "=========================================="
echo "Removing Misplaced Lines After raise HTTPException"
echo "=========================================="
echo ""

# Backup
cp main.py main.py.remove_misplaced.$(date +%Y%m%d_%H%M%S)

# Find the raise HTTPException line
RAISE_LINE=$(grep -n "raise HTTPException.*Template not found.*template_id" main.py | head -1 | cut -d: -f1)
echo "1. Found 'raise HTTPException' at line: $RAISE_LINE"

# Show current state
echo ""
echo "2. Current state (lines $((RAISE_LINE-1))-$((RAISE_LINE+10))):"
sed -n "$((RAISE_LINE-1)),$((RAISE_LINE+10))p" main.py | cat -n -A
echo ""

# Find the next proper section (should be "# Also update local metadata")
NEXT_SECTION=$(grep -n "^        # Also update local metadata file if template_record has file_name" main.py | head -1 | cut -d: -f1)
echo "3. Found next section at line: $NEXT_SECTION"

if [ -z "$NEXT_SECTION" ]; then
    # Fallback: find next line with reasonable indentation (8 spaces or less at start)
    NEXT_SECTION=$(awk -v start=$RAISE_LINE 'NR > start && /^        [^ ]/ && !/^[[:space:]]{16,}/ {print NR; exit}' main.py)
    if [ -z "$NEXT_SECTION" ]; then
        NEXT_SECTION=$((RAISE_LINE + 5))
    fi
    echo "   Using fallback line: $NEXT_SECTION"
fi

# Remove all lines between raise and next section
echo ""
echo "4. Removing misplaced lines between $((RAISE_LINE+1)) and $((NEXT_SECTION-1))..."
if [ $NEXT_SECTION -gt $((RAISE_LINE + 1)) ]; then
    # Show what will be removed
    echo "   Lines to be removed:"
    sed -n "$((RAISE_LINE+1)),$((NEXT_SECTION-1))p" main.py | cat -n
    echo ""
    
    # Remove them
    sed -i "$((RAISE_LINE+1)),$((NEXT_SECTION-1))d" main.py
    echo "   ✅ Removed $((NEXT_SECTION - RAISE_LINE - 1)) misplaced lines"
else
    echo "   ℹ️  No lines to remove (next section is immediately after raise)"
fi

# Show fixed state
echo ""
echo "5. Fixed state (lines $((RAISE_LINE-1))-$((RAISE_LINE+5))):"
sed -n "$((RAISE_LINE-1)),$((RAISE_LINE+5))p" main.py | cat -n
echo ""

# Verify syntax
echo "6. Verifying Python syntax..."
source venv/bin/activate
if python3 -m py_compile main.py 2>&1; then
    echo "   ✅ Syntax check passed!"
else
    echo "   ❌ Syntax check failed!"
    python3 -m py_compile main.py 2>&1 | head -10
    exit 1
fi

echo ""
echo "7. Restarting API with correct command..."
pm2 delete python-api 2>/dev/null || true
cd /opt/petrodealhub/document-processor
pm2 start venv/bin/python --name python-api -- main.py
echo "   ✅ Started API"
echo ""

echo "8. Waiting 5 seconds..."
sleep 5

echo "9. Checking PM2 status..."
pm2 status python-api
echo ""

echo "10. Testing API..."
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
