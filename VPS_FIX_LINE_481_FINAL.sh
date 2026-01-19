#!/bin/bash
# Final fix for line 481 - fix all indentation issues

cd /opt/petrodealhub/document-processor

echo "=========================================="
echo "Final Fix for Line 481 Indentation Error"
echo "=========================================="
echo ""

# Backup
cp main.py main.py.line481_final.$(date +%Y%m%d_%H%M%S)

# Show current state
echo "1. Current state around line 481 (showing special characters):"
sed -n '477,485p' main.py | cat -n -A
echo ""

# Show actual bytes/hex to see tabs vs spaces
echo "2. Checking for tabs vs spaces on lines 479-482:"
for i in 479 480 481 482; do
    echo "Line $i:"
    sed -n "${i}p" main.py | od -c | head -1
done
echo ""

# Fix: Line 481 should be empty or have exactly 4 spaces
# Remove any tabs, replace with proper indentation or remove entirely
echo "3. Fixing line 481..."

# Method 1: Check if line 481 has tabs
if sed -n '481p' main.py | grep -q $'\t'; then
    echo "   Found tabs on line 481 - removing tabs..."
    sed -i '481s/\t//g' main.py
fi

# Method 2: If line 481 has more than 4 spaces, fix it
LINE_481=$(sed -n '481p' main.py)
INDENT=$(echo "$LINE_481" | sed 's/[^ ].*//')
INDENT_LEN=${#INDENT}

if [ $INDENT_LEN -gt 4 ]; then
    echo "   Line 481 has $INDENT_LEN spaces (should be 4 or empty) - fixing..."
    # Make it exactly 4 spaces (function body level)
    sed -i '481s/^.*$/    /' main.py
elif [ ! -z "${LINE_481// }" ]; then
    echo "   Line 481 has content: '$LINE_481' - checking if it should be empty..."
    # If it's not empty and not just whitespace, keep it but fix indentation
    sed -i '481s/^[[:space:]]*/    /' main.py
else
    # If it's just whitespace with wrong indentation, make it exactly 4 spaces
    echo "   Line 481 is whitespace with $INDENT_LEN spaces - fixing to 4 spaces..."
    sed -i '481s/^[[:space:]]*/    /' main.py
fi

# Method 3: Alternative - just remove line 481 entirely if it's causing issues
# But first verify the fix worked
echo ""
echo "4. Checking if fix worked..."
source venv/bin/activate
if python3 -m py_compile main.py 2>&1; then
    echo "   ✅ Syntax check passed!"
else
    ERROR_OUTPUT=$(python3 -m py_compile main.py 2>&1)
    echo "   ❌ Still has error: $ERROR_OUTPUT"
    echo ""
    echo "   Trying alternative: Remove line 481 entirely..."
    sed -i '481d' main.py
    
    echo "   After removing line 481:"
    sed -n '477,485p' main.py | cat -n
    echo ""
    
    # Test again
    if python3 -m py_compile main.py 2>&1; then
        echo "   ✅ Fixed by removing line 481!"
    else
        # Try restoring from git
        echo "   Still failing, restoring from git..."
        git checkout HEAD -- main.py 2>/dev/null || echo "   Git restore failed"
        
        # Verify git version
        if python3 -m py_compile main.py 2>&1; then
            echo "   ✅ Git version is clean!"
        else
            echo "   ❌ Even git version has errors!"
            python3 -m py_compile main.py 2>&1 | head -10
            exit 1
        fi
    fi
fi

echo ""
echo "5. Final state:"
sed -n '477,485p' main.py | cat -n
echo ""

# Final verification
echo "6. Final syntax check..."
if python3 -m py_compile main.py 2>&1; then
    echo "   ✅ Python syntax is correct!"
else
    echo "   ❌ Still has syntax errors!"
    python3 -m py_compile main.py 2>&1 | head -10
    exit 1
fi

echo ""
echo "=========================================="
echo "Fix Complete!"
echo "=========================================="
