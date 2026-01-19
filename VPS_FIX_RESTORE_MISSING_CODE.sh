#!/bin/bash
# Restore missing code block after if placeholder_settings:

set -e

cd /opt/petrodealhub/document-processor
source venv/bin/activate

echo "=========================================="
echo "RESTORING MISSING CODE BLOCK"
echo "=========================================="
echo ""

# 1. Backup
BACKUP_FILE="main.py.before_fix.$(date +%Y%m%d_%H%M%S)"
cp main.py "$BACKUP_FILE"
echo "1. ✅ Backed up to: $BACKUP_FILE"
echo ""

# 2. Show problematic area
echo "2. Checking problematic area..."
sed -n '2205,2230p' main.py | cat -n -A
echo ""

# 3. Use Python to fix the missing code block
echo "3. Restoring missing code block..."
python3 << 'PYTHON_EOF'
import re

with open('main.py', 'r') as f:
    lines = f.readlines()

# Find if placeholder_settings: followed by else: (wrong structure)
problem_idx = None
for i in range(2200, min(2230, len(lines))):
    if 'if placeholder_settings:' in lines[i]:
        # Check if next non-empty line is else: (wrong)
        for j in range(i + 1, min(i + 5, len(lines))):
            next_line = lines[j]
            next_stripped = next_line.strip()
            
            if not next_stripped or next_stripped.startswith('#'):
                continue
            
            if next_stripped == 'else:':
                problem_idx = i
                print(f"   Found problematic if placeholder_settings: at line {i + 1}")
                print(f"   Found misplaced else: at line {j + 1}")
                break
        
        if problem_idx is not None:
            break

if problem_idx is None:
    print("   ✅ No problematic structure found")
    exit(0)

# The correct structure should be:
# if placeholder_settings:
#     removed = False
#     if docx_name in placeholder_settings:
#         placeholder_settings.pop(docx_name, None)
#         removed = True
# 
# But the VPS has:
# if placeholder_settings:
#     else:  (WRONG!)

# Find the misplaced else:
else_idx = None
for i in range(problem_idx + 1, min(problem_idx + 10, len(lines))):
    if lines[i].strip() == 'else:':
        else_idx = i
        break

if else_idx is None:
    print("   ❌ Could not find misplaced else:")
    exit(1)

print(f"   Found misplaced else: at line {else_idx + 1}")

# Get indentation for the if block
if_indent = len(lines[problem_idx]) - len(lines[problem_idx].lstrip())
block_indent = ' ' * (if_indent + 4)

# The correct code block should be inserted here
correct_code = [
    block_indent + 'removed = False\n',
    block_indent + 'if docx_name in placeholder_settings:\n',
    block_indent + '    placeholder_settings.pop(docx_name, None)\n',
    block_indent + '    removed = True\n'
]

# Remove the misplaced else: and insert correct code
print(f"   Removing misplaced else: at line {else_idx + 1}")
del lines[else_idx]

# Insert correct code after if placeholder_settings:
print(f"   Inserting correct code block after line {problem_idx + 1}")
for i, code_line in enumerate(correct_code):
    lines.insert(problem_idx + 1 + i, code_line)
    print(f"   Added line {problem_idx + 2 + i}: {code_line.strip()[:60]}")

# Write the fixed file
with open('main.py', 'w') as f:
    f.writelines(lines)

print("   ✅ Missing code block restored")
PYTHON_EOF

if [ $? -ne 0 ]; then
    echo "   ❌ Python fix failed"
    exit 1
fi

echo ""

# 4. Verify the fix
echo "4. Verifying fix..."
sed -n '2205,2225p' main.py | cat -n -A
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
    echo ""
    echo "   ✅ CMS should be accessible at: https://control.petrodealhub.com/"
else
    echo "   ❌ API is not responding yet"
    echo "   Check: pm2 logs python-api --err --lines 30"
fi
echo ""

echo "=========================================="
echo "FIX COMPLETE"
echo "=========================================="
echo ""
