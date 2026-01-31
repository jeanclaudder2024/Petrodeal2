#!/bin/bash

echo "=========================================="
echo "  Checking VPS Deployment Status"
echo "=========================================="

cd /opt/petrodealhub

echo ""
echo "1. Main repository status:"
git status
echo ""
echo "Main repo current commit:"
git log --oneline -1

echo ""
echo "=========================================="
echo "2. Document-processor submodule status:"
cd document-processor
echo ""
echo "Current commit:"
git log --oneline -1
echo ""
echo "Expected commit: 5135f2a Fix upload mapping counts..."
echo ""

if git log --oneline -1 | grep -q "5135f2a"; then
    echo "✅ Submodule is at the correct commit!"
else
    echo "❌ Submodule is NOT at the correct commit!"
    echo ""
    echo "Current commit info:"
    git log --oneline -5
fi

cd ..

echo ""
echo "=========================================="
echo "3. PM2 processes:"
pm2 list

echo ""
echo "=========================================="
echo "4. Python API status:"
pm2 info python-api 2>/dev/null || echo "❌ python-api process not found in pm2"

echo ""
echo "=========================================="
echo "5. Recent API logs (last 50 lines):"
pm2 logs python-api --lines 50 --nostream 2>/dev/null || echo "No logs available"

echo ""
echo "=========================================="
echo "6. Test API endpoint:"
curl -s http://localhost:8000/database-tables | head -c 200
echo ""

echo ""
echo "=========================================="
echo "  Diagnosis Complete"
echo "=========================================="
