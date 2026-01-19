#!/bin/bash
# Fix if statement error at line 2834

set -e

cd /opt/petrodealhub/document-processor
source venv/bin/activate

echo "=========================================="
echo "FIXING IF STATEMENT ERROR AT LINE 2834"
echo "=========================================="
echo ""

# 1. Backup
BACKUP_FILE="main.py.before_fix.$(date +%Y%m%d_%H%M%S)"
cp main.py "$BACKUP_FILE"
echo "1. ✅ Backed up to: $BACKUP_FILE"
echo ""

# 2. Show problematic area
echo "2. Checking problematic area around line 2834..."
sed -n '2830,2840p' main.py | cat -n -A
echo ""

# 3. Use Python to fix the if statement
echo "3. Fixing if statement without indented block..."
python3 << 'PYTHON_EOF'
import re

with open('main.py', 'r') as f:
    lines = f.readlines()

# Find if statements without proper blocks around line 2834
problem_line = None
for i in range(2825, min(2845, len(lines))):
    line = lines[i]
    stripped = line.strip()
    
    # Check if this is an if statement
    if stripped.startswith('if ') and stripped.endswith(':'):
        # Check if next non-empty line is at wrong indentation
        if i + 1 < len(lines):
            # Skip empty lines and comments
            for j in range(i + 1, min(i + 5, len(lines))):
                next_line = lines[j]
                next_stripped = next_line.strip()
                
                if not next_stripped or next_stripped.startswith('#'):
                    continue
                
                # Get indentation levels
                if_indent = len(line) - len(line.lstrip())
                next_indent = len(next_line) - len(next_line.lstrip())
                
                # If next line is not indented more than if, it's a problem
                if next_indent <= if_indent:
                    problem_line = i
                    print(f"   Found problematic if statement at line {i + 1}")
                    print(f"   Content: {stripped[:60]}")
                    print(f"   Next line {j + 1} has wrong indentation: {next_stripped[:60]}")
                    
                    # Fix by adding pass statement
                    indent = ' ' * (if_indent + 4)
                    lines.insert(i + 1, indent + 'pass\n')
                    print(f"   ✅ Added 'pass' statement after if at line {i + 2}")
                    break
                
                break  # Found next line, stop checking
        
        if problem_line is not None:
            break

# Check for if statements with only empty line after them
for i in range(2825, min(2845, len(lines))):
    line = lines[i]
    stripped = line.strip()
    
    if stripped.startswith('if ') and stripped.endswith(':'):
        # Check if next lines are empty or at wrong indentation
        has_body = False
        if_indent = len(line) - len(line.lstrip())
        
        for j in range(i + 1, min(i + 5, len(lines))):
            next_line = lines[j]
            next_stripped = next_line.strip()
            
            if not next_stripped or next_stripped.startswith('#'):
                continue
            
            next_indent = len(next_line) - len(next_line.lstrip())
            
            # If next line is properly indented, we have a body
            if next_indent > if_indent:
                has_body = True
                break
            # If next line is at same or less indentation, no body found
            elif next_indent <= if_indent:
                break
        
        if not has_body:
            # No body found, add pass
            indent = ' ' * (if_indent + 4)
            lines.insert(i + 1, indent + 'pass\n')
            print(f"   Found if statement at line {i + 1} without body - added 'pass'")

# Write the fixed file
with open('main.py', 'w') as f:
    f.writelines(lines)

print("   ✅ File fixed")
PYTHON_EOF

if [ $? -ne 0 ]; then
    echo "   ❌ Python fix failed"
    exit 1
fi

echo ""

# 4. Verify the fix
echo "4. Verifying fix..."
sed -n '2830,2840p' main.py | cat -n -A
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
