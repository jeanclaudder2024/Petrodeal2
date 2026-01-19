#!/bin/bash
# Fix misplaced else: after raise HTTPException

set -e

cd /opt/petrodealhub/document-processor
source venv/bin/activate

echo "=========================================="
echo "FIXING MISPLACED else: STATEMENT"
echo "=========================================="
echo ""

# 1. Backup
BACKUP_FILE="main.py.before_fix.$(date +%Y%m%d_%H%M%S)"
cp main.py "$BACKUP_FILE"
echo "1. ✅ Backed up to: $BACKUP_FILE"
echo ""

# 2. Show problematic area
echo "2. Checking problematic area..."
sed -n '2340,2380p' main.py | cat -n -A
echo ""

# 3. Use Python to fix the misplaced else:
echo "3. Fixing misplaced else: statement..."
python3 << 'PYTHON_EOF'
import re

with open('main.py', 'r') as f:
    lines = f.readlines()

# Find raise HTTPException with misplaced else: after it
problem_idx = None
for i in range(2330, min(2390, len(lines))):
    if 'raise HTTPException' in lines[i] and 'Template not found' in lines[i]:
        # Check if there's a misplaced else: shortly after
        if i + 5 < len(lines):
            next_lines = ''.join(lines[i+1:i+10])
            # Look for else: after raise (which is unreachable)
            if 'else:' in next_lines:
                # Check if this else: is misplaced (not part of valid structure)
                for j in range(i+1, min(i+10, len(lines))):
                    if 'else:' in lines[j]:
                        # Check indentation - if else: is at similar indentation to raise, it's misplaced
                        raise_indent = len(lines[i]) - len(lines[i].lstrip())
                        else_indent = len(lines[j]) - len(lines[j].lstrip())
                        if else_indent >= raise_indent - 4 and else_indent <= raise_indent + 4:
                            # This is likely misplaced
                            problem_idx = i
                            print(f"   Found problematic raise HTTPException at line {i + 1}")
                            print(f"   Found misplaced else: at line {j + 1}")
                            break
                if problem_idx is not None:
                    break

if problem_idx is None:
    print("   ✅ No problematic else: found")
    exit(0)

# Find all else: statements after raise HTTPException that are misplaced
raise_indent = len(lines[problem_idx]) - len(lines[problem_idx].lstrip())
lines_to_remove = []

# Look for else: statements after raise that shouldn't be there
for i in range(problem_idx + 1, min(problem_idx + 20, len(lines))):
    line = lines[i]
    stripped = line.strip()
    
    if not stripped:
        continue
    
    line_indent = len(line) - len(line.lstrip())
    
    # Check if this is a misplaced else:
    if stripped == 'else:' or stripped.startswith('else:'):
        # If indentation is similar to raise, it's likely misplaced
        if line_indent >= raise_indent - 4 and line_indent <= raise_indent + 4:
            # Check if there's an if statement before this else that's valid
            # Look backwards for the corresponding if
            has_valid_if = False
            for j in range(problem_idx - 20, problem_idx):
                if j < 0:
                    break
                if 'if ' in lines[j] or 'except ' in lines[j] or 'try:' in lines[j]:
                    # Check if this if is at the right indentation
                    if_indent = len(lines[j]) - len(lines[j].lstrip())
                    if if_indent < raise_indent:
                        has_valid_if = True
                        break
            
            if not has_valid_if:
                # This else: is misplaced
                lines_to_remove.append(i)
                print(f"   Marking line {i + 1} for removal (misplaced else:): {stripped}")

# Also remove any code after misplaced else: that's unreachable
if lines_to_remove:
    first_else_idx = lines_to_remove[0]
    # Remove code after misplaced else: until we find valid resume point
    for i in range(first_else_idx + 1, min(first_else_idx + 30, len(lines))):
        line = lines[i]
        stripped = line.strip()
        
        if not stripped:
            continue
        
        line_indent = len(line) - len(line.lstrip())
        
        # Check if we've reached valid code resume
        # Valid resume would be at less indentation (next block/function)
        if line_indent < raise_indent - 4:
            # Found valid resume point
            break
        
        # Check for patterns that indicate misplaced code
        misplaced_patterns = [
            r'logger\.(info|warning|error)',
            r'plan_tier',
            r'plan_id_uuid',
            r'saved_perms',
            r'# Get the',
            r'# Fallback',
        ]
        
        is_misplaced = False
        for pattern in misplaced_patterns:
            if re.search(pattern, stripped):
                is_misplaced = True
                break
        
        # If indentation is excessive, it's likely misplaced
        if line_indent > raise_indent + 8:
            is_misplaced = True
        
        if is_misplaced:
            lines_to_remove.append(i)
            print(f"   Marking line {i + 1} for removal: {stripped[:60]}")

# Remove lines in reverse order
removed_count = 0
for i in reversed(sorted(lines_to_remove)):
    if i < len(lines):
        print(f"   Removing line {i + 1}: {lines[i].strip()[:60]}")
        del lines[i]
        removed_count += 1

print(f"   ✅ Removed {removed_count} misplaced line(s)")

# Ensure proper structure: raise HTTPException followed by empty line or next block
# Make sure there's an empty line after raise if the next line is code
if problem_idx + 1 < len(lines):
    next_line = lines[problem_idx + 1]
    if next_line.strip() and not next_line.strip().startswith('except'):
        # Add empty line after raise
        lines.insert(problem_idx + 1, '\n')

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

# 4. Verify the fix
echo "4. Verifying fix..."
sed -n '2340,2380p' main.py | cat -n -A
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
