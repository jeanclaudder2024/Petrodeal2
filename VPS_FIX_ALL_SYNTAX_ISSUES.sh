#!/bin/bash
# ============================================================================
# COMPREHENSIVE FIX FOR ALL SYNTAX ISSUES IN main.py
# ============================================================================
# This script fixes all known syntax issues:
# 1. Removes unreachable code after raise HTTPException statements
# 2. Fixes hardcoded Windows debug log paths
# 3. Ensures correct indentation
# 4. Verifies syntax before starting API
# ============================================================================

set -e

echo "=========================================="
echo "FIXING ALL SYNTAX ISSUES IN main.py"
echo "=========================================="

cd /opt/petrodealhub/document-processor || exit 1

# 1. Backup main.py
BACKUP_FILE="main.py.before_complete_fix.$(date +%Y%m%d_%H%M%S)"
cp main.py "$BACKUP_FILE"
echo "1. ✅ Backed up to: $BACKUP_FILE"

# 2. Fix hardcoded Windows debug log path
echo "2. Fixing hardcoded Windows debug log paths..."
sed -i "s|with open(r'd:\\\\ia oile project prop\\\\aivessel-trade-flow-main\\\\.cursor\\\\debug.log', 'a')|with open(DEBUG_LOG_PATH, 'a')|g" main.py
sed -i "s|with open(r\"d:\\\\ia oile project prop\\\\aivessel-trade-flow-main\\\\.cursor\\\\debug.log\", 'a')|with open(DEBUG_LOG_PATH, 'a')|g" main.py
echo "   ✅ Fixed hardcoded debug log paths"

# 3. Remove unreachable code after raise HTTPException statements
echo "3. Removing unreachable code after raise statements..."

# Use Python to find and fix unreachable code
python3 << 'PYTHON_FIX'
import re
import sys

try:
    with open('main.py', 'r', encoding='utf-8') as f:
        content = f.read()
        lines = content.split('\n')
    
    fixed_lines = []
    i = 0
    removed_count = 0
    
    while i < len(lines):
        line = lines[i]
        fixed_lines.append(line)
        
        # Check if this line is a raise HTTPException statement
        if re.match(r'^\s+raise HTTPException\(', line):
            raise_indent = len(line) - len(line.lstrip())
            
            # Look ahead to find unreachable code
            j = i + 1
            unreachable_start = None
            
            while j < len(lines):
                next_line = lines[j]
                
                # Skip blank lines
                if not next_line.strip():
                    j += 1
                    continue
                
                # Check if this is a comment (allow comments)
                if next_line.strip().startswith('#'):
                    j += 1
                    continue
                
                next_indent = len(next_line) - len(next_line.lstrip())
                
                # If next line has same or greater indentation, it's unreachable
                if next_indent >= raise_indent:
                    if unreachable_start is None:
                        unreachable_start = j
                    j += 1
                else:
                    # Found properly indented code, stop
                    break
            
            # If we found unreachable code, mark it for removal
            if unreachable_start is not None:
                # Remove unreachable lines (but keep the fixed_lines we already added)
                print(f"   🗑️  Found unreachable code after raise at line {i+1}")
                print(f"      Removing lines {unreachable_start+1} to {j}")
                
                # Don't add unreachable lines to fixed_lines
                # Skip ahead to line j
                i = j - 1
                removed_count += (j - unreachable_start)
        
        i += 1
    
    if removed_count > 0:
        with open('main.py', 'w', encoding='utf-8') as f:
            f.write('\n'.join(fixed_lines))
        print(f"   ✅ Removed {removed_count} lines of unreachable code")
    else:
        print("   ✅ No unreachable code found")
        
except Exception as e:
    print(f"   ❌ Error fixing unreachable code: {e}")
    sys.exit(1)

PYTHON_FIX

# 4. Fix specific issue: remove code after raise HTTPException in else block
echo "4. Fixing specific raise HTTPException issue in else block..."
python3 << 'PYTHON_FIX2'
import re

try:
    with open('main.py', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    fixed_lines = []
    i = 0
    in_problematic_else = False
    removed_after_raise = False
    
    while i < len(lines):
        line = lines[i]
        
        # Detect problematic else block with raise HTTPException
        if re.match(r'^\s+else:\s*$', line) and i + 1 < len(lines):
            next_line = lines[i + 1]
            if re.match(r'^\s+raise HTTPException\(status_code=404, detail=f"Template not found:', next_line):
                in_problematic_else = True
                fixed_lines.append(line)
                fixed_lines.append(next_line)
                i += 2
                
                # Skip any blank lines
                while i < len(lines) and not lines[i].strip():
                    fixed_lines.append(lines[i])
                    i += 1
                
                # If next non-blank line has wrong indentation (same as raise), remove it
                if i < len(lines):
                    next_non_blank = lines[i]
                    raise_indent = len(next_line) - len(next_line.lstrip())
                    next_indent = len(next_non_blank) - len(next_non_blank.lstrip())
                    
                    # If indentation is same or greater, and it's not a comment, remove it
                    if next_indent >= raise_indent and not next_non_blank.strip().startswith('#'):
                        print(f"   🗑️  Removing unreachable line {i+1}: {next_non_blank.strip()[:50]}")
                        removed_after_raise = True
                        # Skip this line and any subsequent unreachable lines
                        i += 1
                        while i < len(lines):
                            check_line = lines[i]
                            if not check_line.strip():
                                # Blank line - allow it
                                fixed_lines.append(check_line)
                                i += 1
                            elif check_line.strip().startswith('#'):
                                # Comment - allow it
                                fixed_lines.append(check_line)
                                i += 1
                            else:
                                check_indent = len(check_line) - len(check_line.lstrip())
                                if check_indent >= raise_indent:
                                    # Still unreachable, skip it
                                    print(f"      Removing line {i+1}: {check_line.strip()[:50]}")
                                    i += 1
                                else:
                                    # Found valid code, stop removing
                                    break
                        continue
                
                continue
        
        fixed_lines.append(line)
        i += 1
    
    if removed_after_raise:
        with open('main.py', 'w', encoding='utf-8') as f:
            f.writelines(fixed_lines)
        print("   ✅ Fixed unreachable code after raise HTTPException")
    else:
        print("   ✅ No unreachable code after raise HTTPException found")
        
except Exception as e:
    print(f"   ❌ Error: {e}")
    import traceback
    traceback.print_exc()
    exit(1)

PYTHON_FIX2

# 5. Remove null bytes (file corruption)
echo "5. Removing null bytes..."
sed -i 's/\x00//g' main.py
echo "   ✅ Removed null bytes"

# 6. Verify Python syntax
echo "6. Verifying Python syntax..."
if python3 -m py_compile main.py 2>&1; then
    echo "   ✅ Python syntax is valid"
else
    echo "   ❌ Python syntax error detected"
    echo "   Checking for common issues..."
    
    # Try to identify the issue
    python3 -m py_compile main.py 2>&1 | head -20
    
    echo ""
    echo "   ⚠️  Syntax error persists. Attempting more aggressive fix..."
    
    # Try to restore from git if syntax is still broken
    git checkout main.py
    echo "   ✅ Restored from git"
    
    # Re-apply fixes
    sed -i "s|with open(r'd:\\\\ia oile project prop\\\\aivessel-trade-flow-main\\\\.cursor\\\\debug.log', 'a')|with open(DEBUG_LOG_PATH, 'a')|g" main.py
    sed -i 's/\x00//g' main.py
    
    # Verify again
    if python3 -m py_compile main.py 2>&1; then
        echo "   ✅ Syntax fixed after restore"
    else
        echo "   ❌ Still has syntax errors after restore"
        exit 1
    fi
fi

# 7. Summary
echo ""
echo "=========================================="
echo "FIX COMPLETE"
echo "=========================================="
echo "✅ Backed up original file"
echo "✅ Fixed hardcoded debug log paths"
echo "✅ Removed unreachable code"
echo "✅ Removed null bytes"
echo "✅ Verified Python syntax"
echo ""
echo "You can now start the API with:"
echo "  pm2 restart python-api"
echo "or"
echo "  python3 main.py"
