#!/bin/bash
# Add missing continue statement in if block at line 3423

cd /opt/petrodealhub/document-processor

echo "=========================================="
echo "Adding Missing Continue Statement"
echo "=========================================="
echo ""

# Backup
cp main.py main.py.add_continue_backup.$(date +%Y%m%d_%H%M%S)

# Find the line with "if not template_name:"
IF_LINE=$(grep -n "^\s*if not template_name:" main.py | head -1 | cut -d: -f1)
echo "1. Found 'if not template_name:' at line: $IF_LINE"

# Show current state
echo ""
echo "2. Current state (lines $IF_LINE-$((IF_LINE+5))):"
sed -n "${IF_LINE},$((IF_LINE+5))p" main.py | cat -n -A
echo ""

# Check if continue already exists
NEXT_LINE=$((IF_LINE + 1))
NEXT_CONTENT=$(sed -n "${NEXT_LINE}p" main.py)
if echo "$NEXT_CONTENT" | grep -q "continue"; then
    echo "3. Continue statement already exists at line $NEXT_LINE"
    echo "   Checking indentation..."
    # Check if it's properly indented (should be more indented than if statement)
    IF_INDENT=$(sed -n "${IF_LINE}p" main.py | sed 's/[^ ].*//' | wc -c)
    CONTINUE_INDENT=$(sed -n "${NEXT_LINE}p" main.py | sed 's/[^ ].*//' | wc -c)
    if [ $CONTINUE_INDENT -gt $IF_INDENT ]; then
        echo "   ✅ Continue is properly indented"
    else
        echo "   ❌ Continue indentation is wrong - fixing..."
        # Fix indentation (should be 4 spaces more than if)
        PROPER_INDENT=$(printf '%*s' $((IF_INDENT + 4)) '')
        sed -i "${NEXT_LINE}s/^[[:space:]]*/${PROPER_INDENT}/" main.py
        echo "   ✅ Fixed indentation"
    fi
else
    echo "3. Continue statement is missing - adding it..."
    # Get indentation of if statement
    IF_INDENT=$(sed -n "${IF_LINE}p" main.py | sed 's/[^ ].*//' | wc -c)
    # Continue should be indented 4 more spaces
    PROPER_INDENT=$(printf '%*s' $((IF_INDENT + 4)) '')
    echo "   If statement indentation: $IF_INDENT spaces"
    echo "   Continue will be indented: $((IF_INDENT + 4)) spaces"
    
    # Insert continue after if statement
    sed -i "${IF_LINE}a\\${PROPER_INDENT}continue" main.py
    echo "   ✅ Added continue statement"
fi

echo ""
echo "4. Fixed state (lines $IF_LINE-$((IF_LINE+5))):"
sed -n "${IF_LINE},$((IF_LINE+5))p" main.py | cat -n
echo ""

# Also check for the other if statement that might have the same issue
echo "5. Checking for other similar issues..."
IF_LINE2=$(grep -n "^\s*if allowed_original == '\*':" main.py | head -1 | cut -d: -f1)
if [ ! -z "$IF_LINE2" ]; then
    echo "   Found 'if allowed_original == '*':' at line: $IF_LINE2"
    NEXT_LINE2=$((IF_LINE2 + 1))
    NEXT_CONTENT2=$(sed -n "${NEXT_LINE2}p" main.py)
    if ! echo "$NEXT_CONTENT2" | grep -q "continue"; then
        echo "   Missing continue - adding it..."
        IF_INDENT2=$(sed -n "${IF_LINE2}p" main.py | sed 's/[^ ].*//' | wc -c)
        PROPER_INDENT2=$(printf '%*s' $((IF_INDENT2 + 4)) '')
        sed -i "${IF_LINE2}a\\${PROPER_INDENT2}continue" main.py
        echo "   ✅ Added continue statement"
    else
        echo "   ✅ Continue already exists"
    fi
fi

echo ""
echo "6. Verifying Python syntax..."
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
echo ""
echo "Now restart the API:"
echo "  pm2 restart python-api"
echo "  sleep 3"
echo "  curl http://localhost:8000/health"
echo ""
