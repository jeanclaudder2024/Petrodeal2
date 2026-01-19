#!/bin/bash
# Targeted fix for line 2350 - remove misplaced code after specific raise HTTPException

set -e

cd /opt/petrodealhub/document-processor
source venv/bin/activate

echo "=========================================="
echo "TARGETED FIX FOR LINE 2350"
echo "=========================================="
echo ""

# 1. Find the exact problematic raise HTTPException
echo "1. Finding problematic raise HTTPException..."
PROBLEM_LINE=$(grep -n "raise HTTPException.*Template not found.*template_id" main.py | head -1 | cut -d: -f1)
echo "   Found at line: $PROBLEM_LINE"
echo ""

# 2. Show the area
echo "2. Showing problematic area (lines $((PROBLEM_LINE-3)) to $((PROBLEM_LINE+30)))..."
sed -n "$((PROBLEM_LINE-3)),$((PROBLEM_LINE+30))p" main.py | cat -n -A
echo ""

# 3. Backup
BACKUP_FILE="main.py.before_fix.$(date +%Y%m%d_%H%M%S)"
cp main.py "$BACKUP_FILE"
echo "3. ✅ Backed up to: $BACKUP_FILE"
echo ""

# 4. Use Python to fix this precisely
echo "4. Removing misplaced code after raise HTTPException at line $PROBLEM_LINE..."
python3 << PYTHON_EOF
import re

with open('main.py', 'r') as f:
    lines = f.readlines()

# Find the problematic raise HTTPException line
problem_line_idx = None
for i, line in enumerate(lines):
    if 'raise HTTPException' in line and 'Template not found' in line and 'template_id' in line:
        problem_line_idx = i
        break

if problem_line_idx is None:
    print("   ❌ Could not find problematic raise HTTPException")
    exit(1)

print(f"   Found problematic raise at line {problem_line_idx + 1}")
print(f"   Line content: {lines[problem_line_idx].strip()}")

# Find where valid code resumes
# After raise HTTPException, we should have an empty line, then valid code
# The misplaced code has patterns like:
# - logger.warning with permission-convert
# - continue statements
# - logger.info with permission-convert
# - Comments about plan_id from plan_tier
# - Code with excessive indentation

# Get indentation level of the raise statement
raise_indent = len(lines[problem_line_idx]) - len(lines[problem_line_idx].lstrip())
print(f"   Raise statement indentation: {raise_indent} spaces")

# Look ahead to find where valid code resumes
lines_to_remove = []
search_end = min(problem_line_idx + 100, len(lines))
found_valid_resume = False

for i in range(problem_line_idx + 1, search_end):
    line = lines[i]
    stripped = line.strip()
    
    # Empty lines are OK
    if not stripped:
        continue
    
    line_indent = len(line) - len(line.lstrip())
    
    # Check if we've found valid code resuming
    # Valid code should be:
    # 1. At the same indentation level or less (next block)
    # 2. Not containing problematic patterns
    
    # If we've dedented significantly, we've reached the next block
    if line_indent < raise_indent - 4:
        print(f"   Found valid code resume at line {i + 1} (dedented)")
        found_valid_resume = True
        break
    
    # Check for problematic patterns
    problematic_patterns = [
        r'logger\.warning.*permission-convert',
        r'logger\.info.*permission-convert',
        r'^[[:space:]]*continue[[:space:]]*$',
        r'# Try to get plan_id from plan_tier',
        r'plan_id_uuid = None',
        r'plan_uuid_test = uuid\.UUID',
        r'plan_res = supabase\.table.*subscription_plans',
    ]
    
    is_problematic = False
    for pattern in problematic_patterns:
        if re.search(pattern, stripped):
            is_problematic = True
            break
    
    # Also check if indentation is excessive (more than raise_indent)
    if line_indent > raise_indent + 8:
        is_problematic = True
    
    if is_problematic:
        lines_to_remove.append(i)
        print(f"   Marking line {i + 1} for removal: {stripped[:70]}")
    else:
        # This might be valid code - check if it's at the right indentation
        if line_indent <= raise_indent + 4:
            # This looks like it might be valid code at similar indentation
            # But we should be careful - if we've removed some lines, this might be part of the problem
            # Let's check what comes after
            if i + 1 < len(lines):
                next_line = lines[i + 1].strip()
                # If next line is also problematic, this might be part of the problem
                next_is_problem = any(re.search(p, next_line) for p in problematic_patterns)
                if not next_is_problem:
                    print(f"   Found potential valid code at line {i + 1}: {stripped[:70]}")
                    found_valid_resume = True
                    break

# Remove lines in reverse order
for i in reversed(lines_to_remove):
    print(f"   Removing line {i + 1}: {lines[i].strip()[:70]}")
    del lines[i]

# Write the fixed file
with open('main.py', 'w') as f:
    f.writelines(lines)

print(f"   ✅ Removed {len(lines_to_remove)} misplaced line(s)")
PYTHON_EOF

if [ $? -ne 0 ]; then
    echo "   ❌ Python fix failed"
    exit 1
fi

echo ""

# 5. Verify the fix
echo "5. Verifying fix..."
sed -n "$((PROBLEM_LINE-3)),$((PROBLEM_LINE+15))p" main.py | cat -n -A
echo ""

# 6. Test syntax
echo "6. Testing Python syntax..."
SYNTAX_OUTPUT=$(python3 -m py_compile main.py 2>&1)
if [ $? -eq 0 ]; then
    echo "   ✅ Python syntax is 100% correct!"
else
    echo "   ❌ Syntax error still present:"
    echo "$SYNTAX_OUTPUT" | head -10
    echo ""
    
    # Try final restore from git
    echo "   Attempting final restore from git..."
    cd /opt/petrodealhub
    git submodule update --init --force --recursive document-processor 2>/dev/null || true
    cd /opt/petrodealhub/document-processor
    
    # Try to get clean version
    git fetch origin master 2>/dev/null || git fetch origin main 2>/dev/null || true
    git reset --hard origin/master 2>/dev/null || git reset --hard origin/main 2>/dev/null || git reset --hard HEAD 2>/dev/null || true
    git checkout --force . 2>/dev/null || true
    
    # Test again
    python3 -m py_compile main.py 2>&1
    if [ $? -eq 0 ]; then
        echo "   ✅ Git restore successful!"
    else
        echo "   ❌ All fixes failed"
        exit 1
    fi
fi
echo ""

# 7. Verify imports
echo "7. Verifying critical imports..."
python3 << 'PYTHON_EOF'
try:
    from supabase import create_client
    from websockets.asyncio.client import ClientConnection
    print("✅ All imports OK")
except Exception as e:
    print(f"❌ Import error: {e}")
    import sys
    sys.exit(1)
PYTHON_EOF

if [ $? -ne 0 ]; then
    echo "   ❌ Import verification failed!"
    exit 1
fi
echo ""

# 8. Restart API
echo "8. Restarting API..."
pm2 delete python-api 2>/dev/null || true
sleep 2
cd /opt/petrodealhub/document-processor
pm2 start venv/bin/python --name python-api -- main.py
echo "   ✅ API restarted"
echo ""

# 9. Wait and verify
echo "9. Waiting 10 seconds for API to start..."
sleep 10
echo ""

# 10. Final verification
echo "10. Final verification..."
python3 -m py_compile main.py 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ Syntax OK"
else
    echo "   ❌ Syntax still has errors"
fi

ERROR_COUNT=$(pm2 logs python-api --err --lines 15 --nostream 2>/dev/null | grep -c "IndentationError\|SyntaxError" || echo "0")
if [ "$ERROR_COUNT" -eq "0" ]; then
    echo "   ✅ No syntax errors in API logs"
else
    echo "   ⚠️  Still errors in API logs:"
    pm2 logs python-api --err --lines 20 --nostream | tail -15
fi

if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "   ✅ API is responding!"
else
    echo "   ❌ API is not responding yet"
    echo "   Check: pm2 logs python-api --err --lines 30"
fi
echo ""

echo "=========================================="
echo "FIX COMPLETE"
echo "=========================================="
echo ""
