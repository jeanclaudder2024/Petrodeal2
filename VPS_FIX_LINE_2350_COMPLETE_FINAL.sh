#!/bin/bash
# Complete final fix for line 2350 - remove all misplaced code after raise HTTPException

set -e

cd /opt/petrodealhub/document-processor
source venv/bin/activate

echo "=========================================="
echo "COMPLETE FINAL FIX FOR LINE 2350"
echo "=========================================="
echo ""

# 1. Backup
BACKUP_FILE="main.py.before_fix.$(date +%Y%m%d_%H%M%S)"
cp main.py "$BACKUP_FILE"
echo "1. ✅ Backed up to: $BACKUP_FILE"
echo ""

# 2. Use Python to completely fix the section
echo "2. Removing all misplaced code after raise HTTPException..."
python3 << 'PYTHON_EOF'
import re

with open('main.py', 'r') as f:
    lines = f.readlines()

# Find the problematic raise HTTPException around line 2348-2350
problem_idx = None
for i in range(2330, min(2370, len(lines))):
    if 'raise HTTPException' in lines[i] and 'Template not found' in lines[i]:
        # Check if there's misplaced code after it
        if i + 5 < len(lines):
            next_lines = ''.join(lines[i+1:i+10])
            if 'saved_perms' in next_lines or 'logger.info' in next_lines or 'plan_id_uuid' in next_lines:
                problem_idx = i
                break

if problem_idx is None:
    print("   ⚠️  Could not find problematic raise HTTPException")
    # Try to find any raise HTTPException with misplaced code after it
    for i in range(2300, min(2400, len(lines))):
        if 'raise HTTPException' in lines[i] and 'Template not found' in lines[i]:
            # Check next 20 lines for unreachable code
            unreachable_patterns = ['saved_perms', 'plan_id_uuid', 'logger.info.*Found.*saved']
            has_unreachable = False
            for j in range(i + 1, min(i + 25, len(lines))):
                line_content = lines[j]
                for pattern in unreachable_patterns:
                    if pattern in line_content and not line_content.strip().startswith('#'):
                        has_unreachable = True
                        break
                if has_unreachable:
                    break
            
            if has_unreachable:
                problem_idx = i
                print(f"   Found problematic raise HTTPException at line {problem_idx + 1}")
                break

if problem_idx is None:
    print("   ✅ No problematic raise HTTPException found")
    exit(0)

print(f"   Found problematic raise HTTPException at line {problem_idx + 1}")
print(f"   Content: {lines[problem_idx].strip()}")

# Find where valid code resumes
# After raise HTTPException, we should have empty line(s), then the next function or code block
raise_indent = len(lines[problem_idx]) - len(lines[problem_idx].lstrip())
print(f"   Raise statement indentation: {raise_indent} spaces")

# Look for valid code resume
# Valid resume should be at same or less indentation (next block)
resume_idx = None
for i in range(problem_idx + 1, min(problem_idx + 100, len(lines))):
    line = lines[i]
    stripped = line.strip()
    
    # Skip empty lines and comments
    if not stripped or stripped.startswith('#'):
        continue
    
    line_indent = len(line) - len(line.lstrip())
    
    # Check for patterns that indicate misplaced code (unreachable after raise)
    misplaced_patterns = [
        r'logger\.info.*Found.*saved',
        r'saved_perms',
        r'plan_id_uuid\s*=',
        r'plan_res\s*=.*subscription_plans',
        r'plan_tier',
    ]
    
    is_misplaced = False
    for pattern in misplaced_patterns:
        if re.search(pattern, stripped):
            is_misplaced = True
            break
    
    # If indentation is excessive (much more than raise), it's likely misplaced
    if line_indent > raise_indent + 8:
        is_misplaced = True
    
    if not is_misplaced:
        # This might be valid code - check if it's at the right indentation
        # Valid code should be at same or less indentation than raise
        if line_indent <= raise_indent:
            resume_idx = i
            print(f"   Found valid code resume at line {resume_idx + 1}: {stripped[:60]}")
            break

if resume_idx is None:
    print("   ⚠️  Could not find valid code resume, removing misplaced code until next block")
    # Find next block at same or less indentation
    for i in range(problem_idx + 1, min(problem_idx + 150, len(lines))):
        line = lines[i]
        stripped = line.strip()
        if not stripped or stripped.startswith('#'):
            continue
        line_indent = len(line) - len(line.lstrip())
        # Look for code at same or less indentation (next function/block)
        if line_indent <= raise_indent and (stripped.startswith('def ') or stripped.startswith('@') or stripped.startswith('if ') or stripped.startswith('except ') or stripped.startswith('else:')):
            resume_idx = i
            print(f"   Found next block at line {resume_idx + 1}: {stripped[:60]}")
            break

if resume_idx is None:
    print("   ❌ Could not find valid resume point")
    exit(1)

# Remove all lines between problem_idx + 1 and resume_idx - 1
# But keep one empty line after raise
lines_to_remove = []
for i in range(problem_idx + 1, resume_idx):
    line = lines[i]
    stripped = line.strip()
    
    # Keep first empty line after raise, remove others
    if not stripped:
        if len(lines_to_remove) == 0:
            continue  # Keep first empty line
        else:
            lines_to_remove.append(i)
    else:
        lines_to_remove.append(i)

# Remove lines in reverse order
removed_count = 0
for i in reversed(lines_to_remove):
    if i < len(lines):
        print(f"   Removing line {i + 1}: {lines[i].strip()[:60]}")
        del lines[i]
        removed_count += 1

# Ensure there's one empty line after raise
if problem_idx + 1 < len(lines):
    next_line = lines[problem_idx + 1]
    if next_line.strip():  # Not empty, add empty line
        lines.insert(problem_idx + 1, '\n')
    # If already empty, keep it

print(f"   ✅ Removed {removed_count} misplaced line(s)")

# Write the fixed file
with open('main.py', 'w') as f:
    f.writelines(lines)

print("   ✅ File structure fixed")
PYTHON_EOF

if [ $? -ne 0 ]; then
    echo "   ❌ Python fix failed"
    exit 1
fi

echo ""

# 3. Verify the fix
echo "3. Verifying fix..."
sed -n '2345,2365p' main.py | cat -n -A
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
    
    # Try git restore
    echo "   Attempting git restore..."
    cd /opt/petrodealhub/document-processor
    git fetch origin master 2>/dev/null || git fetch origin main 2>/dev/null || true
    git reset --hard origin/master 2>/dev/null || git reset --hard origin/main 2>/dev/null || git reset --hard HEAD 2>/dev/null || true
    git checkout --force . 2>/dev/null || true
    
    python3 -m py_compile main.py 2>&1
    if [ $? -eq 0 ]; then
        echo "   ✅ Git restore successful!"
    else
        echo "   ❌ All fixes failed"
        python3 -m py_compile main.py 2>&1 | head -10
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
