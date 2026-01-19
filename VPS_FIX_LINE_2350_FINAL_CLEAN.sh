#!/bin/bash
# Final clean fix for line 2350 - remove empty lines and restore structure

set -e

cd /opt/petrodealhub/document-processor
source venv/bin/activate

echo "=========================================="
echo "FINAL CLEAN FIX FOR LINE 2350"
echo "=========================================="
echo ""

# 1. Backup
BACKUP_FILE="main.py.before_fix.$(date +%Y%m%d_%H%M%S)"
cp main.py "$BACKUP_FILE"
echo "1. ✅ Backed up to: $BACKUP_FILE"
echo ""

# 2. Use Python to completely fix the structure
echo "2. Fixing file structure around line 2350..."
python3 << 'PYTHON_EOF'
import re

with open('main.py', 'r') as f:
    lines = f.readlines()

# Find the problematic raise HTTPException
problem_idx = None
for i, line in enumerate(lines):
    if 'raise HTTPException' in line and 'Template not found' in line and 'template_id' in line:
        problem_idx = i
        break

if problem_idx is None:
    print("   ❌ Could not find problematic raise HTTPException")
    exit(1)

print(f"   Found problematic raise at line {problem_idx + 1}")
print(f"   Content: {lines[problem_idx].strip()}")

# The correct structure should be:
# Line N:     raise HTTPException(status_code=404, detail="Template not found")
# Line N+1:   (empty line)
# Line N+2:   template_id = template_record['id']
# 
# But the VPS has corrupted structure with empty lines with wrong indentation

# Find where valid code resumes by looking for "template_id = template_record"
valid_resume_idx = None
for i in range(problem_idx + 1, min(problem_idx + 50, len(lines))):
    if 'template_id = template_record' in lines[i]:
        valid_resume_idx = i
        break

if valid_resume_idx is None:
    print("   ⚠️  Could not find valid code resume (template_id = template_record)")
    # Try to find next valid code block
    raise_indent = len(lines[problem_idx]) - len(lines[problem_idx].lstrip())
    for i in range(problem_idx + 1, min(problem_idx + 100, len(lines))):
        line = lines[i]
        stripped = line.strip()
        if not stripped:
            continue
        line_indent = len(line) - len(line.lstrip())
        # If we find code at similar or less indentation that's not empty lines
        if line_indent <= raise_indent and not stripped.startswith('#'):
            valid_resume_idx = i
            break

if valid_resume_idx is None:
    print("   ❌ Could not find valid code resume")
    exit(1)

print(f"   Found valid code resume at line {valid_resume_idx + 1}")
print(f"   Content: {lines[valid_resume_idx].strip()[:70]}")

# Remove all lines between problem_idx+1 and valid_resume_idx-1
# Keep only if they're properly indented as part of valid structure
lines_to_keep = []
remove_count = 0

# Fix the raise HTTPException message first
if '{template_id}' in lines[problem_idx]:
    lines[problem_idx] = re.sub(
        r'detail=f?"Template not found: \{template_id\}"',
        'detail="Template not found"',
        lines[problem_idx]
    )
    print(f"   Fixed raise HTTPException message")

# Now fix the structure - we want:
# - raise HTTPException line (problem_idx)
# - One empty line (if needed)
# - Valid code resume (valid_resume_idx)

# Build new lines
new_lines = lines[:problem_idx + 1]  # Keep up to and including raise

# Check if we need an empty line before valid resume
if valid_resume_idx > problem_idx + 1:
    # Add one empty line
    new_lines.append('\n')
    # Count how many lines we're removing
    remove_count = valid_resume_idx - problem_idx - 1
else:
    remove_count = 0

# Add the valid code from resume onwards
new_lines.extend(lines[valid_resume_idx:])

print(f"   Removed {remove_count} problematic line(s)")

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

# 3. Verify the fix
echo "3. Verifying fix..."
sed -n '2345,2360p' main.py | cat -n -A
echo ""

# 4. Test syntax
echo "4. Testing Python syntax..."
SYNTAX_OUTPUT=$(python3 -m py_compile main.py 2>&1)
if [ $? -eq 0 ]; then
    echo "   ✅ Python syntax is 100% correct!"
else
    echo "   ❌ Syntax error still present:"
    echo "$SYNTAX_OUTPUT" | head -10
    echo ""
    
    # Try one final aggressive restore
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
        echo "   Showing syntax error details:"
        python3 -m py_compile main.py 2>&1 | head -15
        exit 1
    fi
fi
echo ""

# 5. Verify imports
echo "5. Verifying critical imports..."
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

# 6. Restart API
echo "6. Restarting API..."
pm2 delete python-api 2>/dev/null || true
sleep 2
cd /opt/petrodealhub/document-processor
pm2 start venv/bin/python --name python-api -- main.py
echo "   ✅ API restarted"
echo ""

# 7. Wait and verify
echo "7. Waiting 10 seconds for API to start..."
sleep 10
echo ""

# 8. Final verification
echo "8. Final verification..."
python3 -m py_compile main.py 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ Syntax OK"
else
    echo "   ❌ Syntax still has errors"
    python3 -m py_compile main.py 2>&1 | head -10
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
