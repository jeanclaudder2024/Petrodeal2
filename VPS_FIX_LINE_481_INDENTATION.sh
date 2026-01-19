#!/bin/bash
# Fix indentation error on line 481

cd /opt/petrodealhub/document-processor

echo "=========================================="
echo "Fixing Line 481 Indentation Error"
echo "=========================================="
echo ""

# Backup
cp main.py main.py.line481_fix.$(date +%Y%m%d_%H%M%S)

# Fix line 481 - remove extra indentation
echo "1. Checking line 481..."
sed -n '479,483p' main.py | cat -n -A
echo ""

# Fix: line 481 has 8 spaces but should have 4 spaces (or be empty)
echo "2. Fixing indentation on line 481..."
sed -i '481s/^        $/    /' main.py
# Or remove if it's just whitespace
sed -i '481s/^        $//' main.py

echo "3. Fixed area:"
sed -n '479,483p' main.py | cat -n -A
echo ""

# Verify syntax
echo "4. Verifying Python syntax..."
source venv/bin/activate
if python3 -m py_compile main.py 2>&1; then
    echo "   ✅ Syntax check passed!"
else
    echo "   ❌ Syntax check failed!"
    python3 -m py_compile main.py 2>&1 | head -10
    
    # Try alternative fix - just make it an empty line
    sed -i '481d' main.py
    sed -i '480a\\' main.py
    
    echo ""
    echo "   Trying alternative fix..."
    python3 -m py_compile main.py 2>&1 || {
        echo "   Still failing, showing error:"
        python3 -m py_compile main.py 2>&1 | head -10
        exit 1
    }
    echo "   ✅ Fixed with alternative method!"
fi

echo ""
echo "=========================================="
echo "Fix Complete!"
echo "=========================================="
