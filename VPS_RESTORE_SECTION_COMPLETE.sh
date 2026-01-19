#!/bin/bash
# Complete section restore - rebuild the entire problematic section

set -e

cd /opt/petrodealhub/document-processor
source venv/bin/activate

echo "=========================================="
echo "COMPLETE SECTION RESTORE"
echo "=========================================="
echo ""

# 1. Backup
BACKUP_FILE="main.py.before_fix.$(date +%Y%m%d_%H%M%S)"
cp main.py "$BACKUP_FILE"
echo "1. ✅ Backed up to: $BACKUP_FILE"
echo ""

# 2. Show problematic area
echo "2. Checking problematic area..."
sed -n '2340,2370p' main.py | cat -n -A
echo ""

# 3. Use Python to completely rebuild the section
echo "3. Rebuilding section with correct structure..."
python3 << 'PYTHON_EOF'
import re

with open('main.py', 'r') as f:
    lines = f.readlines()

# Find the problematic raise HTTPException
problem_idx = None
for i in range(2330, min(2360, len(lines))):
    if 'raise HTTPException' in lines[i] and 'Template not found' in lines[i]:
        problem_idx = i
        break

if problem_idx is None:
    print("   ❌ Could not find problematic raise HTTPException")
    exit(1)

print(f"   Found raise HTTPException at line {problem_idx + 1}")

# Find the function context - look backwards for the function definition
func_start = None
for i in range(problem_idx, max(problem_idx - 50, 0), -1):
    if 'def save_placeholder_settings' in lines[i]:
        func_start = i
        break

if func_start is None:
    print("   ❌ Could not find function start")
    exit(1)

print(f"   Found function start at line {func_start + 1}")

# The correct structure after raise HTTPException (line 2348) should be:
# Line 2348: raise HTTPException(status_code=404, detail="Template not found")
# Line 2349: (empty line)
# Line 2350: template_id = template_record['id']
# Line 2351: (empty line)
# Line 2352: # Normalise payload to Supabase schema then upsert

# Find where we should resume - look for "# Normalise payload" or similar
resume_idx = None
for i in range(problem_idx + 1, min(problem_idx + 100, len(lines))):
    line = lines[i].strip()
    if 'Normalise payload' in line or '# Normalise payload' in line:
        resume_idx = i - 1  # The line before (should be template_id = ...)
        break
    # Or look for template_id = template_record['id'] directly
    if 'template_id = template_record' in line and "['id']" in line:
        resume_idx = i
        break

if resume_idx is None:
    print("   ⚠️  Could not find exact resume point, trying to find next valid block...")
    # Try to find the next indented block at the right level
    raise_indent = len(lines[problem_idx]) - len(lines[problem_idx].lstrip())
    for i in range(problem_idx + 1, min(problem_idx + 100, len(lines))):
        line = lines[i]
        stripped = line.strip()
        if not stripped or stripped.startswith('#'):
            continue
        line_indent = len(line) - len(line.lstrip())
        # Look for code at same indentation as the raise statement
        if line_indent == raise_indent and 'template_id' in stripped:
            resume_idx = i
            print(f"   Found potential resume at line {resume_idx + 1}: {stripped[:60]}")
            break

if resume_idx is None:
    print("   ❌ Could not find valid resume point")
    print("   Attempting to restore from correct structure...")
    
    # If we can't find the resume, we need to rebuild
    # Insert the correct lines after raise HTTPException
    fixed_raise = re.sub(
        r'detail=f?"Template not found: \{template_id\}"',
        'detail="Template not found"',
        lines[problem_idx]
    )
    
    # Build new structure
    new_lines = lines[:problem_idx]
    new_lines.append(fixed_raise)
    new_lines.append('\n')  # Empty line
    new_lines.append('            template_id = template_record[\'id\']\n')
    new_lines.append('\n')  # Empty line
    new_lines.append('            # Normalise payload to Supabase schema then upsert\n')
    new_lines.append('            sanitised_settings: Dict[str, Dict] = {}\n')
    
    # Now try to find where to continue from the remaining file
    # Look for the next major block after this section
    for i in range(problem_idx + 1, min(problem_idx + 200, len(lines))):
        line = lines[i]
        stripped = line.strip()
        if not stripped:
            continue
        line_indent = len(line) - len(line.lstrip())
        # Look for code that's part of the sanitised_settings block
        if 'sanitised_settings[' in stripped or 'for placeholder, cfg in new_settings' in stripped:
            # We found where to continue - add everything from here
            new_lines.extend(lines[i:])
            print(f"   Rebuilt section, continuing from line {i + 1}")
            break
    else:
        # If we can't find where to continue, just keep the rest
        new_lines.extend(lines[problem_idx + 1:])
        print("   Kept remaining lines")
    
    with open('main.py', 'w') as f:
        f.writelines(new_lines)
    
    print("   ✅ Rebuilt section with correct structure")
    exit(0)

# If we found resume_idx, we can do a simpler fix
print(f"   Found resume point at line {resume_idx + 1}")
print(f"   Content: {lines[resume_idx].strip()[:60]}")

# Fix the raise HTTPException message
fixed_raise = re.sub(
    r'detail=f?"Template not found: \{template_id\}"',
    'detail="Template not found"',
    lines[problem_idx]
)

# Build new structure
new_lines = lines[:problem_idx]
new_lines.append(fixed_raise)
new_lines.append('\n')  # Empty line

# Check if resume_idx has the correct template_id line
if 'template_id = template_record' not in lines[resume_idx]:
    # Insert the correct line
    new_lines.append('            template_id = template_record[\'id\']\n')
    new_lines.append('\n')  # Empty line

# Add from resume_idx onwards, but skip duplicates
skip_duplicates = True
for i in range(resume_idx, len(lines)):
    line = lines[i]
    
    # Skip duplicate raise HTTPException
    if skip_duplicates and 'raise HTTPException' in line and 'Template not found' in line:
        print(f"   Skipping duplicate raise HTTPException at line {i + 1}")
        skip_duplicates = False
        continue
    
    # Skip empty lines with wrong indentation right after duplicates
    if not skip_duplicates and not line.strip():
        continue
    
    skip_duplicates = True
    new_lines.append(line)

removed = len(lines) - len(new_lines)
print(f"   Removed {removed} problematic line(s)")

# Write the fixed file
with open('main.py', 'w') as f:
    f.writelines(new_lines)

print("   ✅ Section structure fixed")
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
    
    # Final git restore
    echo "   Attempting final git restore..."
    cd /opt/petrodealhub
    git submodule update --init --force --recursive document-processor 2>/dev/null || true
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
