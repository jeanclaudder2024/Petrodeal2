#!/bin/bash
# Fix Python Indentation Error

echo "🔧 Fixing Python Indentation Error"
echo ""

cd /opt/petrodealhub/document-processor || exit 1

echo "📋 Step 1: Check Python syntax..."
source venv/bin/activate
python -m py_compile main.py 2>&1 | head -30

echo ""
echo "📋 Step 2: Checking around line 2350..."
sed -n '2345,2355p' main.py

echo ""
echo "📋 Step 3: Pull latest code from git (if available)..."
cd /opt/petrodealhub
if [ -d ".git" ]; then
    echo "Git repo found, pulling latest..."
    git stash  # Save any local changes
    git pull
    cd document-processor
else
    echo "No git repo found at /opt/petrodealhub"
fi

echo ""
echo "📋 Step 4: Try starting manually to see exact error..."
cd /opt/petrodealhub/document-processor
source venv/bin/activate
python -c "import ast; ast.parse(open('main.py').read())" 2>&1 | head -20

echo ""
echo "✅ Done. Check the error messages above to locate the exact line with the issue."
