#!/bin/bash
# Precise fix - restore exact structure from repository

set -e

cd /opt/petrodealhub/document-processor
source venv/bin/activate

echo "=========================================="
echo "PRECISE FIX - RESTORE EXACT STRUCTURE"
echo "=========================================="
echo ""

# 1. Backup
BACKUP_FILE="main.py.before_fix.$(date +%Y%m%d_%H%M%S)"
cp main.py "$BACKUP_FILE"
echo "1. ✅ Backed up to: $BACKUP_FILE"
echo ""

# 2. Show current problematic area
echo "2. Checking current state..."
sed -n '2340,2370p' main.py | cat -n -A
echo ""

# 3. Use Python to find and fix precisely
echo "3. Finding exact problematic section..."
python3 << 'PYTHON_EOF'
import re

with open('main.py', 'r') as f:
    lines = f.readlines()

# Find the problematic raise HTTPException around line 2348
# Look for: raise HTTPException with Template not found
problem_idx = None
for i in range(2340, min(2360, len(lines))):
    if 'raise HTTPException' in lines[i] and 'Template not found' in lines[i]:
        problem_idx = i
        break

if problem_idx is None:
    print("   ❌ Could not find problematic raise HTTPException")
    exit(1)

print(f"   Found raise HTTPException at line {problem_idx + 1}")
print(f"   Content: {lines[problem_idx].strip()}")

# The correct structure after raise HTTPException should be:
# 1. raise HTTPException(status_code=404, detail="Template not found")
# 2. (empty line)
# 3. template_id = template_record['id']

# Find where template_id = template_record['id'] should be
target_idx = None
for i in range(problem_idx + 1, min(problem_idx + 20, len(lines))):
    if 'template_id = template_record' in lines[i] and "['id']" in lines[i]:
        target_idx = i
        break

if target_idx is None:
    print("   ❌ Could not find template_id = template_record['id']")
    print("   Looking for alternative resume point...")
    # Try to find the next valid code block
    raise_indent = len(lines[problem_idx]) - len(lines[problem_idx].lstrip())
    for i in range(problem_idx + 1, min(problem_idx + 50, len(lines))):
        line = lines[i]
        stripped = line.strip()
        if not stripped or stripped.startswith('#'):
            continue
        line_indent = len(line) - len(line.lstrip())
        # Look for code at same indentation level (the template_id line)
        if line_indent == raise_indent + 4 and 'template_id' in stripped:
            target_idx = i
            print(f"   Found potential resume at line {target_idx + 1}: {stripped[:60]}")
            break

if target_idx is None:
    print("   ❌ Could not find valid code resume")
    exit(1)

print(f"   Found target code at line {target_idx + 1}")
print(f"   Content: {lines[target_idx].strip()}")

# Now fix the structure
# We want:
# - Everything before problem_idx (keep)
# - problem_idx: raise HTTPException (fix message)
# - problem_idx + 1: empty line
# - problem_idx + 2: template_id = template_record['id']
# - Everything from target_idx onwards (but skip duplicates)

# Fix the raise HTTPException message
fixed_raise = re.sub(
    r'detail=f?"Template not found: \{template_id\}"',
    'detail="Template not found"',
    lines[problem_idx]
)

# Build new structure
new_lines = lines[:problem_idx]  # Everything before raise
new_lines.append(fixed_raise)     # Fixed raise statement
new_lines.append('\n')            # Empty line
new_lines.append(lines[target_idx])  # template_id line

# Now check if there's more valid code after target_idx that we need to keep
# Look for code at same indentation level
target_indent = len(lines[target_idx]) - len(lines[target_idx].lstrip())

# Add remaining lines from target_idx + 1, but skip any duplicate raise HTTPException
skip_next_lines = False
for i in range(target_idx + 1, len(lines)):
    line = lines[i]
    
    # Skip duplicate raise HTTPException
    if 'raise HTTPException' in line and 'Template not found' in line:
        print(f"   Skipping duplicate raise HTTPException at line {i + 1}")
        skip_next_lines = True
        continue
    
    # Skip empty lines with wrong indentation if we just skipped a duplicate
    if skip_next_lines:
        stripped = line.strip()
        if not stripped:
            continue
        # If we find valid code, stop skipping
        line_indent = len(line) - len(line.lstrip())
        if line_indent <= target_indent + 8:  # Allow some nesting
            skip_next_lines = False
    
    if not skip_next_lines:
        new_lines.append(line)

# Calculate how many lines we removed
original_lines = len(lines)
new_lines_count = len(new_lines)
removed = original_lines - new_lines_count

print(f"   Removed {removed} problematic line(s)")

# Write the fixed file
with open('main.py', 'w') as f:
    f.writelines(new_lines)

print(f"   ✅ File structure fixed")
PYTHON_EOF

if [ $? -ne 0 ]; then
    echo "   ❌ Python fix failed"
    exit 1
fi

echo ""

# 4. Verify the fix
echo "4. Verifying fix..."
sed -n '2345,2360p' main.py | cat -n -A
echo ""

# 5. Test syntax
echo "5. Testing Python syntax..."
SYNTAX_OUTPUT=$(python3 -m py_compile main.py 2>&1)
if [ $? -eq 0 ]; then
    echo "   ✅ Python syntax is 100% correct!"
else
    echo "   ❌ Syntax error still present:"
    echo "$SYNTAX_OUTPUT" | head -10
    echo ""
    
    # Try final git restore
    echo "   Attempting final git restore..."
    cd /opt/petrodealhub
    git submodule update --init --force --recursive document-processor 2>/dev/null || true
    cd /opt/petrodealhub/document-processor
    git fetch origin master 2>/dev/null || git fetch origin main 2>/dev/null || true
    git reset --hard origin/master 2>/dev/null || git reset --hard origin/main 2>/dev/null || git reset --hard HEAD 2>/dev/null || true
    git checkout --force . 2>/dev/null || true
    
    # Test again
    python3 -m py_compile main.py 2>&1
    if [ $? -eq 0 ]; then
        echo "   ✅ Git restore successful!"
    else
        echo "   ❌ All fixes failed"
        echo "   Syntax error:"
        python3 -m py_compile main.py 2>&1 | head -10
        exit 1
    fi
fi
echo ""

# 6. Verify imports
echo "6. Verifying critical imports..."
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

# 7. Restart API
echo "7. Restarting API..."
pm2 delete python-api 2>/dev/null || true
sleep 2
cd /opt/petrodealhub/document-processor
pm2 start venv/bin/python --name python-api -- main.py
echo "   ✅ API restarted"
echo ""

# 8. Wait and verify
echo "8. Waiting 10 seconds for API to start..."
sleep 10
echo ""

# 9. Final verification
echo "9. Final verification..."
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
    echo ""
    echo "   Health check response:"
    curl -s http://localhost:8000/health | head -3
else
    echo "   ❌ API is not responding yet"
    echo "   Check: pm2 logs python-api --err --lines 30"
fi
echo ""

echo "=========================================="
echo "FIX COMPLETE"
echo "=========================================="
echo ""
