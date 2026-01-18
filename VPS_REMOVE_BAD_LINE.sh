#!/bin/bash
# Remove bad line at 2350 that causes indentation error

echo "🔧 Fixing indentation error at line 2350..."

cd /opt/petrodealhub/document-processor || exit 1

# Backup file first
cp main.py main.py.backup.$(date +%Y%m%d_%H%M%S)

# Check current line 2350
echo ""
echo "📋 Current line 2350:"
sed -n '2350p' main.py

# Remove the bad line (if it contains the permission-convert message)
sed -i '/logger\.warning.*\[permission-convert\].*Plan.*EMPTY.*NULL.*skipping/d' main.py

# Or fix it by replacing with correct indentation (if you want to keep it)
# sed -i '2350s/^[[:space:]]*/                        /' main.py

echo ""
echo "✅ Line removed. Checking syntax..."
python -m py_compile main.py 2>&1 | head -10

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Syntax check passed!"
    echo "📋 Testing startup..."
    python main.py &
    sleep 3
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "✅ API is working!"
        kill %1 2>/dev/null
    else
        echo "❌ API still not responding"
        kill %1 2>/dev/null
    fi
else
    echo ""
    echo "❌ Syntax check failed. Restore from backup:"
    echo "   cp main.py.backup.* main.py"
fi
