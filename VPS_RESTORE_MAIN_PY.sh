#!/bin/bash
# Restore main.py from git to fix indentation errors

cd /opt/petrodealhub/document-processor

# Backup current file
cp main.py main.py.broken.$(date +%Y%m%d_%H%M%S)

# Restore from git
git checkout HEAD -- main.py

# Verify syntax
echo "Checking Python syntax..."
python -m py_compile main.py

if [ $? -eq 0 ]; then
    echo "✅ Syntax check passed!"
    echo ""
    echo "Now restart the API:"
    echo "  pm2 restart python-api"
    echo ""
    echo "Or test manually:"
    echo "  python main.py"
else
    echo "❌ Syntax check failed. Please check the file manually."
    exit 1
fi
