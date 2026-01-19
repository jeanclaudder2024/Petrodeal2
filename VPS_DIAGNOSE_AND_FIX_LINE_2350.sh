#!/bin/bash
# Diagnose and fix line 2350 indentation error

set -e

cd /opt/petrodealhub/document-processor

echo "=========================================="
echo "Diagnosing Line 2350 Problem"
echo "=========================================="
echo ""

# Show git status
echo "1. Checking git status..."
git status --short
echo ""

# Show what's actually on line 2350
echo "2. Showing lines 2345-2355 (problem area):"
sed -n '2345,2355p' main.py | cat -n
echo ""

# Check for continue statement around line 2350
echo "3. Checking for 'continue' statements around line 2350:"
grep -n "continue" main.py | grep -E "234[5-9]|235[0-5]"
echo ""

# Show the context around line 2350
echo "4. Full context around line 2350 (2340-2360):"
sed -n '2340,2360p' main.py | cat -A
echo ""

# Backup first
BACKUP_FILE="main.py.before_fix.$(date +%Y%m%d_%H%M%S)"
echo "5. Creating backup: $BACKUP_FILE"
cp main.py "$BACKUP_FILE"
echo "   ✅ Backup created"
echo ""

# Try to fix: remove any continue statement on line 2350
echo "6. Attempting to fix line 2350..."
# Check if line 2350 has "continue"
LINE_2350=$(sed -n '2350p' main.py)

if echo "$LINE_2350" | grep -q "continue"; then
    echo "   ⚠️  Found 'continue' on line 2350 - removing it"
    # Replace line 2350 with an empty line (proper indentation)
    sed -i '2350s/.*/                /' main.py
    echo "   ✅ Removed continue statement"
elif [ -z "${LINE_2350// }" ]; then
    echo "   ℹ️  Line 2350 is empty/whitespace (correct)"
else
    echo "   ⚠️  Line 2350 contains: '$LINE_2350'"
    echo "   ℹ️  Attempting to fix indentation..."
    # Make sure line 2350 has correct indentation (empty with 16 spaces)
    sed -i '2350s/.*/                /' main.py
    echo "   ✅ Fixed indentation"
fi
echo ""

# Verify syntax
echo "7. Verifying Python syntax..."
source venv/bin/activate
if python -m py_compile main.py 2>&1; then
    echo "   ✅ Syntax check passed!"
else
    echo "   ❌ Syntax check still failed!"
    echo ""
    echo "   Restoring backup..."
    cp "$BACKUP_FILE" main.py
    echo "   Showing the error again:"
    python -m py_compile main.py 2>&1 || true
    exit 1
fi
echo ""

echo "=========================================="
echo "Fix Complete!"
echo "=========================================="
echo ""
echo "Now restart the API:"
echo "  pm2 restart python-api"
echo ""
