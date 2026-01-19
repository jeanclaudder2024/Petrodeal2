#!/bin/bash
# Remove misplaced code after raise HTTPException

set -e

cd /opt/petrodealhub/document-processor
source venv/bin/activate

echo "=========================================="
echo "REMOVING MISPLACED CODE AFTER raise HTTPException"
echo "=========================================="
echo ""

# 1. Show the problematic area
echo "1. Checking problematic area around line 2350..."
sed -n '2345,2370p' main.py | cat -n -A
echo ""

# 2. Backup
BACKUP_FILE="main.py.before_fix.$(date +%Y%m%d_%H%M%S)"
cp main.py "$BACKUP_FILE"
echo "2. ✅ Backed up to: $BACKUP_FILE"
echo ""

# 3. Find the exact problem
echo "3. Locating raise HTTPException and misplaced code..."
RAISE_LINE=$(grep -n "raise HTTPException.*Template not found" main.py | head -1 | cut -d: -f1)
echo "   Found raise HTTPException at line: $RAISE_LINE"
echo ""

# 4. Check what follows it
echo "4. Checking lines after raise HTTPException..."
sed -n "${RAISE_LINE},$((RAISE_LINE+20))p" main.py | cat -n -A
echo ""

# 5. Remove misplaced code using Python (more reliable)
echo "5. Removing misplaced code after raise HTTPException..."
python3 << 'PYTHON_EOF'
import re

with open('main.py', 'r') as f:
    lines = f.readlines()

# Find the raise HTTPException line
raise_line_idx = None
for i, line in enumerate(lines):
    if 'raise HTTPException' in line and 'Template not found' in line:
        raise_line_idx = i
        break

if raise_line_idx is None:
    print("   ⚠️  Could not find raise HTTPException line")
    exit(1)

print(f"   Found raise HTTPException at line {raise_line_idx + 1}")

# Find where the next valid code block starts
# After raise HTTPException, we should have empty lines, then either:
# - A new function/class (starts at column 0)
# - A try/except block at same indentation level
# - Another if/else at same indentation level
# - The end of the function (next dedented code)

raise_indent = len(lines[raise_line_idx]) - len(lines[raise_line_idx].lstrip())

# Look for lines after raise that are:
# 1. Not empty (or just whitespace)
# 2. Have indentation that suggests they're in the same block
# 3. Look like misplaced code (logger.warning, continue, etc.)

lines_to_remove = []
search_end = min(raise_line_idx + 30, len(lines))

for i in range(raise_line_idx + 1, search_end):
    line = lines[i]
    stripped = line.strip()
    
    # Skip empty lines initially
    if not stripped:
        continue
    
    # Check indentation
    line_indent = len(line) - len(line.lstrip())
    
    # If we've dedented significantly, we're past the misplaced code
    if line_indent < raise_indent - 4:
        break
    
    # Look for specific problematic patterns
    if any(pattern in stripped for pattern in [
        'logger.warning.*permission-convert',
        'logger.info.*permission-convert',
        'continue$',  # continue at end of line
        '# Try to get plan_id from plan_tier'
    ]):
        # Check if this is actually misplaced (has similar/extra indentation after raise)
        if line_indent >= raise_indent:
            lines_to_remove.append(i)
            print(f"   Marking line {i + 1} for removal: {stripped[:60]}")

# Remove the lines (in reverse order to maintain indices)
for i in reversed(lines_to_remove):
    print(f"   Removing line {i + 1}: {lines[i].strip()[:60]}")
    del lines[i]

# Write the fixed file
with open('main.py', 'w') as f:
    f.writelines(lines)

print(f"   ✅ Removed {len(lines_to_remove)} misplaced line(s)")
PYTHON_EOF

if [ $? -ne 0 ]; then
    echo "   ❌ Python fix failed, trying sed approach..."
    
    # Fallback: use sed to remove specific problematic lines
    # Remove logger.warning lines after raise HTTPException
    sed -i '/raise HTTPException.*Template not found/{:a;N;$!ba; s/\n[[:space:]]*logger\.warning.*permission-convert.*\n//g;}' main.py 2>/dev/null || true
    sed -i '/raise HTTPException.*Template not found/{:a;N;$!ba; s/\n[[:space:]]*continue[[:space:]]*\n//g;}' main.py 2>/dev/null || true
    sed -i '/raise HTTPException.*Template not found/{:a;N;$!ba; s/\n[[:space:]]*logger\.info.*permission-convert.*\n//g;}' main.py 2>/dev/null || true
fi

echo ""

# 6. Verify the fix
echo "6. Verifying fix..."
sed -n '2345,2360p' main.py | cat -n -A
echo ""

# 7. Test syntax
echo "7. Testing Python syntax..."
SYNTAX_OUTPUT=$(python3 -m py_compile main.py 2>&1)
if [ $? -eq 0 ]; then
    echo "   ✅ Python syntax is 100% correct!"
else
    echo "   ❌ Syntax error still present:"
    echo "$SYNTAX_OUTPUT" | head -10
    echo ""
    
    # Try one more aggressive fix: restore from git submodule
    echo "   Attempting final restore from git submodule..."
    cd /opt/petrodealhub
    git submodule update --init --force --recursive document-processor 2>/dev/null || true
    cd /opt/petrodealhub/document-processor
    git fetch origin master 2>/dev/null || git fetch origin main 2>/dev/null || true
    git reset --hard origin/master 2>/dev/null || git reset --hard origin/main 2>/dev/null || git reset --hard HEAD 2>/dev/null || true
    
    # Test again
    python3 -m py_compile main.py 2>&1
    if [ $? -eq 0 ]; then
        echo "   ✅ Final restore successful!"
    else
        echo "   ❌ All fixes failed"
        exit 1
    fi
fi
echo ""

# 8. Verify imports
echo "8. Verifying critical imports..."
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

# 9. Restart API
echo "9. Restarting API..."
pm2 delete python-api 2>/dev/null || true
sleep 2
cd /opt/petrodealhub/document-processor
pm2 start venv/bin/python --name python-api -- main.py
echo "   ✅ API restarted"
echo ""

# 10. Wait and verify
echo "10. Waiting 10 seconds for API to start..."
sleep 10
echo ""

# 11. Final verification
echo "11. Final verification..."
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
