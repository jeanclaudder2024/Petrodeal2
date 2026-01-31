#!/bin/bash

echo "=========================================="
echo "  Check Recent Upload Activity"
echo "=========================================="

cd /opt/petrodealhub/document-processor

echo "1. Recent API logs (last 100 lines):"
echo "=========================================="
pm2 logs python-api --lines 100 --nostream

echo ""
echo "=========================================="
echo "2. Looking for upload and mapping activity:"
echo "=========================================="
pm2 logs python-api --lines 200 --nostream | grep -i "upload\|mapping\|placeholder\|template uploaded"

echo ""
echo "=========================================="
echo "3. Check if any templates exist:"
echo "=========================================="
ls -lh templates/

echo ""
echo "=========================================="
echo "4. Test upload endpoint directly:"
echo "=========================================="
curl -s http://localhost:8000/templates | head -c 500

echo ""
echo ""
echo "=========================================="
echo "  Instructions"
echo "=========================================="
echo "If no upload logs appear above, the upload may not have reached the API."
echo "Try uploading a template again via the CMS and watch:"
echo "  pm2 logs python-api"
echo ""
