#!/bin/bash
# Fix indentation error at line 2350 in main.py

set -e

echo "=========================================="
echo "FIX LINE 2350 INDENTATION ERROR"
echo "=========================================="
echo ""

cd /opt/petrodealhub/document-processor

# 1. Backup main.py
echo "1. Backing up main.py..."
cp main.py main.py.backup.before_fix_$(date +%Y%m%d_%H%M%S)
echo "   ✅ Backup created"
echo ""

# 2. Check current line 2350
echo "2. Checking line 2350 and surrounding context..."
echo "   Lines 2345-2355:"
sed -n '2345,2355p' main.py | cat -A | head -15
echo ""

# 3. Check for indentation issues around line 2350
echo "3. Checking for indentation issues..."
# Get the problematic line
LINE_2350=$(sed -n '2350p' main.py)
echo "   Line 2350 content: '$LINE_2350'"

# Check if it's the EMPTY/NULL line that's misplaced
if echo "$LINE_2350" | grep -q "EMPTY/NULL, skipping"; then
    echo "   ❌ Found misplaced EMPTY/NULL warning at line 2350"
    echo "   This line should be at line 2337, not 2350"
    
    # Check what's at line 2337
    LINE_2337=$(sed -n '2337p' main.py)
    echo "   Line 2337 content: '$LINE_2337'"
    
    # Check indentation
    INDENT_2350=$(echo "$LINE_2350" | sed 's/[^ ].*//' | wc -c)
    INDENT_2337=$(echo "$LINE_2337" | sed 's/[^ ].*//' | wc -c)
    echo "   Indentation at 2337: $INDENT_2337 spaces"
    echo "   Indentation at 2350: $INDENT_2350 spaces"
    
    # Check context - what should be at line 2350
    PREV_LINE=$(sed -n '2349p' main.py)
    NEXT_LINE=$(sed -n '2351p' main.py)
    echo "   Line 2349 (prev): '$PREV_LINE'"
    echo "   Line 2351 (next): '$NEXT_LINE'"
    echo ""
    
    # Fix: Remove the duplicate/misplaced line at 2350
    echo "4. Fixing indentation error..."
    echo "   Removing misplaced line 2350..."
    
    # Use Python to fix this properly
    python3 << 'PYTHON_FIX'
import re

with open('/opt/petrodealhub/document-processor/main.py', 'r') as f:
    lines = f.readlines()

# Check if line 2350 (index 2349) is the problematic line
if len(lines) > 2349:
    line_2350 = lines[2349].rstrip()
    line_2337 = lines[2336].rstrip() if len(lines) > 2336 else ""
    
    # If line 2350 contains the EMPTY/NULL warning and line 2337 already has it, remove 2350
    if "EMPTY/NULL, skipping" in line_2350 and "EMPTY/NULL, skipping" in line_2337:
        print(f"   Found duplicate at line 2350: {line_2350}")
        print(f"   Line 2337 already has: {line_2337}")
        print("   Removing duplicate line 2350...")
        # Remove the duplicate line
        lines.pop(2349)
        
        # Write back
        with open('/opt/petrodealhub/document-processor/main.py', 'w') as f:
            f.writelines(lines)
        print("   ✅ Removed duplicate line")
    elif "EMPTY/NULL, skipping" in line_2350:
        # Check what should be at line 2350 - it should be plan_uuid_test line
        # If EMPTY/NULL is here but shouldn't be, we need to check the context
        if 2335 < len(lines):
            line_2335 = lines[2334].rstrip()  # for loop
            line_2336 = lines[2335].rstrip()  # if not plan_identifier
            line_2337_expected = lines[2336].rstrip() if len(lines) > 2336 else ""
            
            # Check if the structure is broken
            print(f"   Line 2335: {line_2335}")
            print(f"   Line 2336: {line_2336}")
            print(f"   Line 2337: {line_2337_expected}")
            
            # If line 2350 has wrong indentation, fix it
            # Expected at line 2350 (after removing EMPTY/NULL): plan_uuid_test = uuid.UUID(...)
            if "plan_uuid_test" not in line_2350:
                print("   Line 2350 is misplaced, checking if we need to remove it...")
                
                # Find where plan_uuid_test should be
                for i in range(2340, 2360):
                    if i < len(lines) and "plan_uuid_test" in lines[i]:
                        print(f"   Found plan_uuid_test at line {i+1}")
                        break
                
                # If EMPTY/NULL is at 2350 but shouldn't be, and we need plan_uuid_test there
                # Remove the misplaced line
                if "plan_uuid_test" not in line_2350:
                    print("   Removing misplaced line 2350...")
                    lines.pop(2349)
                    
                    with open('/opt/petrodealhub/document-processor/main.py', 'w') as f:
                        f.writelines(lines)
                    print("   ✅ Fixed structure")
                else:
                    # Just fix indentation
                    print("   Fixing indentation at line 2350...")
                    # Check previous line indentation
                    if 2348 < len(lines):
                        prev_indent = len(lines[2348]) - len(lines[2348].lstrip())
                        # Line 2350 should have 4 more spaces than the try: statement
                        # (which is at line 2348 if we count correctly)
                        correct_indent = "                                    "  # 36 spaces for code inside try inside for inside if
                        lines[2349] = correct_indent + lines[2349].lstrip()
                        
                        with open('/opt/petrodealhub/document-processor/main.py', 'w') as f:
                            f.writelines(lines)
                        print("   ✅ Fixed indentation")
else:
    print("   File is shorter than expected")
PYTHON_FIX

else
    echo "   ✅ Line 2350 looks correct, checking syntax..."
    python3 -m py_compile main.py 2>&1 | head -5 || {
        echo "   ❌ Still has syntax errors"
        python3 -m py_compile main.py 2>&1
    }
fi
echo ""

# 4. Verify syntax
echo "5. Verifying Python syntax..."
if python3 -m py_compile main.py 2>&1; then
    echo "   ✅ No syntax errors!"
else
    echo "   ❌ Still has syntax errors:"
    SYNTAX_ERR=$(python3 -m py_compile main.py 2>&1 | head -5)
    echo "$SYNTAX_ERR"
    echo ""
    
    # If still has errors, try to restore from git
    echo "   Attempting to restore clean version from git..."
    git checkout main.py || git checkout HEAD main.py || {
        echo "   ⚠️  Could not restore from git, trying to pull fresh..."
        cd ..
        git submodule update --init --recursive document-processor
        cd document-processor
        git pull origin master || git pull origin main
        git checkout main.py
    }
    
    # Remove null bytes again
    tr -d '\000' < main.py > main.py.tmp && mv main.py.tmp main.py
    
    # Check syntax again
    echo ""
    echo "   Re-checking syntax after restore..."
    if python3 -m py_compile main.py 2>&1; then
        echo "   ✅ Syntax is now valid after restore"
    else
        echo "   ⚠️  Still has errors after restore:"
        python3 -m py_compile main.py 2>&1 | head -5
    fi
fi
echo ""

# 5. Test if API can start
echo "6. Testing if API can start..."
cd /opt/petrodealhub/document-processor

# Clean up PM2
pm2 delete python-api 2>/dev/null || true
sleep 2

# Start API
if [ -d "venv" ] && [ -f "venv/bin/python" ]; then
    PYTHON_CMD="venv/bin/python"
elif [ -d "../venv" ] && [ -f "../venv/bin/python" ]; then
    PYTHON_CMD="../venv/bin/python"
else
    PYTHON_CMD="python3"
fi

echo "   Starting with: $PYTHON_CMD"
pm2 start "$PYTHON_CMD" main.py \
    --name python-api \
    --interpreter python3 \
    --cwd /opt/petrodealhub/document-processor \
    --watch false || {
    pm2 start python3 main.py --name python-api --interpreter python3 --cwd /opt/petrodealhub/document-processor
}

sleep 5
echo ""

# 6. Check status
echo "7. Checking API status..."
pm2 status python-api
echo ""

# 7. Test API
echo "8. Testing API..."
sleep 3
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ API is responding (HTTP $HTTP_CODE)"
    curl -s http://localhost:8000/health | head -1
else
    echo "   ❌ API is not responding (HTTP $HTTP_CODE)"
    echo "   Checking logs..."
    pm2 logs python-api --lines 10 --nostream | tail -10
fi
echo ""

# 8. Check port 8000
echo "9. Checking port 8000..."
if lsof -ti:8000 > /dev/null 2>&1 || netstat -tuln 2>/dev/null | grep -q ":8000 "; then
    echo "   ✅ Port 8000 is in use"
else
    echo "   ❌ Port 8000 is NOT in use"
fi
echo ""

# 9. Save PM2
echo "10. Saving PM2 configuration..."
pm2 save || echo "   ⚠️  Could not save"
echo ""

# 10. Summary
echo "=========================================="
echo "FIX COMPLETE"
echo "=========================================="
echo ""
echo "Status:"
echo "  Syntax errors: $(python3 -m py_compile main.py 2>&1 | grep -q 'SyntaxError\|IndentationError' && echo 'Fixed ✅' || echo 'Remain ❌')"
echo "  Port 8000: $(lsof -ti:8000 > /dev/null 2>&1 && echo 'In use ✅' || echo 'Not in use ❌')"
echo "  API health: HTTP $HTTP_CODE"
echo ""
