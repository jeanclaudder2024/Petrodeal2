#!/bin/bash
# Fix the if statement error on line 3427

cd /opt/petrodealhub/document-processor

echo "=========================================="
echo "Fixing If Statement Error"
echo "=========================================="
echo ""

# Backup
cp main.py main.py.if_fix_backup.$(date +%Y%m%d_%H%M%S)

# Check what's on line 3427
echo "1. Checking line 3427 and surrounding area:"
sed -n '3420,3435p' main.py | cat -n -A
echo ""

# Try to find the problematic if statement
echo "2. Searching for if statements without proper bodies..."
# Look for if statements that are immediately followed by another statement without indentation
python3 << 'EOF'
import re

with open('main.py', 'r') as f:
    lines = f.readlines()

# Find if statements that might be missing bodies
for i, line in enumerate(lines, 1):
    # Match if statements
    if re.match(r'^\s+if\s+.*:\s*$', line):
        # Check if next non-empty line is not indented more
        j = i
        while j < len(lines):
            next_line = lines[j].strip()
            if next_line and not next_line.startswith('#'):
                current_indent = len(line) - len(line.lstrip())
                next_indent = len(lines[j]) - len(lines[j].lstrip())
                if next_indent <= current_indent:
                    print(f"Line {i}: Possible empty if block")
                    print(f"  {i}: {line.rstrip()}")
                    print(f"  {j+1}: {lines[j].rstrip()}")
                    print()
                break
            j += 1
            if j - i > 5:  # Give up after 5 empty lines
                break
EOF

# Try to compile and see the exact error
echo "3. Checking Python syntax for exact error location:"
source venv/bin/activate
python3 -m py_compile main.py 2>&1 | head -5
echo ""

# The error says line 3427, so let's check that specific area
ERROR_LINE=3427
echo "4. Examining the problematic area around line $ERROR_LINE:"
sed -n "$((ERROR_LINE-5)),$((ERROR_LINE+5))p" main.py | cat -n
echo ""

# Check if there's an if statement with an empty body
LINE_3427=$(sed -n "${ERROR_LINE}p" main.py)
echo "5. Line $ERROR_LINE content:"
echo "$LINE_3427" | cat -A
echo ""

# If line 3427 is an if statement, check what's after it
if echo "$LINE_3427" | grep -q "^\s*if.*:\s*$"; then
    echo "   ⚠️  Line $ERROR_LINE is an 'if' statement"
    echo "   Checking next lines..."
    sed -n "$((ERROR_LINE+1)),$((ERROR_LINE+10))p" main.py | cat -n -A
    echo ""
    
    # Check if the next non-empty, non-comment line is properly indented
    CURRENT_INDENT=$(echo "$LINE_3427" | sed 's/[^ ].*//' | wc -c)
    echo "   Current if statement indentation: $CURRENT_INDENT spaces"
    
    # Find next non-empty line
    for i in {1..10}; do
        CHECK_LINE=$((ERROR_LINE + i))
        CHECK_CONTENT=$(sed -n "${CHECK_LINE}p" main.py)
        if [ ! -z "${CHECK_CONTENT// }" ] && ! echo "$CHECK_CONTENT" | grep -q "^\s*#"; then
            CHECK_INDENT=$(echo "$CHECK_CONTENT" | sed 's/[^ ].*//' | wc -c)
            echo "   Line $CHECK_LINE indentation: $CHECK_INDENT spaces"
            if [ $CHECK_INDENT -le $CURRENT_INDENT ]; then
                echo "   ❌ Problem found! Line $CHECK_LINE is not indented enough for the if block"
                echo "   Adding a 'pass' statement to fix it..."
                sed -i "${ERROR_LINE}a\\$(printf '%*s' $((CURRENT_INDENT + 4)))pass" main.py
                break
            else
                echo "   ✅ Line $CHECK_LINE is properly indented"
                break
            fi
        fi
    done
fi

echo ""
echo "6. Verifying syntax after fix..."
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
echo ""
