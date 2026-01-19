#!/bin/bash
# Direct fix for line 481 indentation error

cd /opt/petrodealhub/document-processor

echo "=========================================="
echo "Direct Fix for Line 481"
echo "=========================================="
echo ""

# Backup
cp main.py main.py.line481_direct.$(date +%Y%m%d_%H%M%S)

# Show the problematic area
echo "1. Current state around line 481:"
sed -n '477,485p' main.py | cat -n -A
echo ""

# Check what's actually on line 481
LINE_481=$(sed -n '481p' main.py)
echo "2. Line 481 content: '$LINE_481'"
INDENT_COUNT=$(echo "$LINE_481" | sed 's/[^ ].*//' | wc -c)
echo "   Indentation: $INDENT_COUNT spaces"
echo ""

# Fix: Line 481 should be empty or have 4 spaces max (function body level)
# If it has 8 spaces (wrong indentation), fix it
if [ $INDENT_COUNT -gt 4 ]; then
    echo "3. Fixing: Line 481 has too much indentation ($INDENT_COUNT spaces)"
    echo "   Removing extra indentation..."
    
    # Option 1: Make it a proper empty line with 4 spaces (function body level)
    sed -i '481s/^.*$/    /' main.py
    
    # Option 2: Or just make it completely empty
    # sed -i '481s/^.*$//' main.py
    
    echo "   ✅ Fixed line 481"
else
    echo "3. Line 481 indentation looks OK, checking for other issues..."
    
    # Check if line is just whitespace - remove it if so
    if [ -z "${LINE_481// }" ]; then
        sed -i '481s/^.*$//' main.py
        echo "   ✅ Removed trailing whitespace from line 481"
    fi
fi

echo ""
echo "4. Fixed area:"
sed -n '477,485p' main.py | cat -n -A
echo ""

# Verify syntax
echo "5. Verifying Python syntax..."
source venv/bin/activate
if python3 -m py_compile main.py 2>&1; then
    echo "   ✅ Syntax check passed!"
else
    echo "   ❌ Syntax check still failed!"
    ERROR_OUTPUT=$(python3 -m py_compile main.py 2>&1)
    echo "   Error: $ERROR_OUTPUT"
    
    # Try alternative fix - remove line 481 entirely if it's just whitespace
    if echo "$LINE_481" | grep -q "^\s*$"; then
        echo ""
        echo "   Trying alternative: Removing line 481 entirely..."
        sed -i '481d' main.py
        echo ""
        echo "   After removing line 481:"
        sed -n '477,485p' main.py | cat -n
        echo ""
        
        # Test again
        if python3 -m py_compile main.py 2>&1; then
            echo "   ✅ Fixed by removing line 481!"
        else
            echo "   ❌ Still failing after removing line 481"
            python3 -m py_compile main.py 2>&1 | head -10
            exit 1
        fi
    else
        exit 1
    fi
fi

echo ""
echo "=========================================="
echo "Fix Complete!"
echo "=========================================="
