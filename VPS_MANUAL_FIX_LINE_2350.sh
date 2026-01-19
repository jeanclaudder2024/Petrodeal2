#!/bin/bash
# Manual fix for line 2350 - removes continue statement and fixes indentation

cd /opt/petrodealhub/document-processor

echo "=========================================="
echo "Manual Fix for Line 2350"
echo "=========================================="
echo ""

# Backup
cp main.py main.py.manual_fix_backup.$(date +%Y%m%d_%H%M%S)

# Show current state
echo "Current state of lines 2348-2352:"
sed -n '2348,2352p' main.py | cat -n
echo ""

# Fix: Ensure line 2350 is empty with correct indentation
# Line 2350 should be empty (16 spaces to match indentation level)
echo "Fixing line 2350..."
sed -i '2350s/.*/                /' main.py

echo "Fixed state of lines 2348-2352:"
sed -n '2348,2352p' main.py | cat -n
echo ""

# Verify
echo "Verifying syntax..."
source venv/bin/activate
if python -m py_compile main.py; then
    echo "✅ Syntax check passed!"
    echo ""
    echo "Restarting API..."
    pm2 restart python-api
    sleep 3
    curl http://localhost:8000/health || echo "Check logs: pm2 logs python-api --err"
else
    echo "❌ Syntax check failed!"
    exit 1
fi
