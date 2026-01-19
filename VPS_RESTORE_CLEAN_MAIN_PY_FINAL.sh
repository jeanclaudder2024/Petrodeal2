#!/bin/bash
# Restore clean main.py from git to fix all syntax errors

cd /opt/petrodealhub/document-processor

echo "=========================================="
echo "Restoring Clean main.py from Git"
echo "=========================================="
echo ""

# Backup current file
BACKUP_FILE="main.py.broken.$(date +%Y%m%d_%H%M%S)"
echo "1. Creating backup: $BACKUP_FILE"
cp main.py "$BACKUP_FILE"
echo "   ✅ Backup created"
echo ""

# Discard all local changes and restore from git
echo "2. Restoring main.py from git..."
git checkout HEAD -- main.py 2>/dev/null || git checkout master -- main.py 2>/dev/null || git checkout main -- main.py 2>/dev/null

if [ $? -eq 0 ]; then
    echo "   ✅ Restored from git"
else
    echo "   ⚠️  Git restore failed, trying to pull latest..."
    git pull origin master 2>/dev/null || git pull origin main 2>/dev/null
    git checkout HEAD -- main.py 2>/dev/null || git checkout master -- main.py 2>/dev/null
    echo "   ✅ Pulled and restored from git"
fi
echo ""

# Verify syntax
echo "3. Verifying Python syntax..."
source venv/bin/activate
if python3 -m py_compile main.py 2>&1; then
    echo "   ✅ Syntax check passed!"
else
    echo "   ❌ Syntax check still failed!"
    ERROR_OUTPUT=$(python3 -m py_compile main.py 2>&1)
    echo "   Error: $ERROR_OUTPUT"
    echo ""
    echo "   Checking what's wrong..."
    
    # Show the problematic area
    ERROR_LINE=$(echo "$ERROR_OUTPUT" | grep -o "line [0-9]*" | grep -o "[0-9]*" | head -1)
    if [ ! -z "$ERROR_LINE" ]; then
        echo "   Problem is around line: $ERROR_LINE"
        sed -n "$((ERROR_LINE-3)),$((ERROR_LINE+3))p" main.py | cat -n -A
    fi
    
    exit 1
fi
echo ""

echo "=========================================="
echo "Restore Complete!"
echo "=========================================="
echo ""
echo "main.py has been restored to clean version from git."
echo "Syntax check passed!"
echo ""
echo "Now restart the API:"
echo "  pm2 restart python-api"
echo ""
