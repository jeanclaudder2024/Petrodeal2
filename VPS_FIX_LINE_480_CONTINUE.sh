#!/bin/bash
# Fix line 480 - change continue to return (continue is only for loops)

cd /opt/petrodealhub/document-processor

echo "=========================================="
echo "Fixing Line 480 - Replace continue with return"
echo "=========================================="
echo ""

# Backup
cp main.py main.py.line480_fix.$(date +%Y%m%d_%H%M%S)

# Show the problematic area
echo "1. Current state around line 480:"
sed -n '477,485p' main.py | cat -n
echo ""

# Check if line 480 has continue
LINE_480=$(sed -n '480p' main.py)
if echo "$LINE_480" | grep -q "continue"; then
    echo "2. Found 'continue' on line 480 - this is wrong!"
    echo "   'continue' only works in loops, but this is in an if statement"
    echo "   Changing 'continue' to 'return'..."
    
    # Replace continue with return
    sed -i '480s/continue/return/' main.py
    
    echo "   ✅ Changed 'continue' to 'return'"
else
    echo "2. Line 480 doesn't have 'continue' - checking what's there..."
    echo "   Line 480: '$LINE_480'"
fi

echo ""
echo "3. Fixed area:"
sed -n '477,485p' main.py | cat -n
echo ""

# Verify syntax
echo "4. Verifying Python syntax..."
source venv/bin/activate
if python3 -m py_compile main.py 2>&1; then
    echo "   ✅ Syntax check passed!"
else
    echo "   ❌ Syntax check still failed!"
    python3 -m py_compile main.py 2>&1 | head -10
    exit 1
fi

echo ""
echo "=========================================="
echo "Fix Complete!"
echo "=========================================="
