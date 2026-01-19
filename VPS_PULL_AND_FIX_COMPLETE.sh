#!/bin/bash
# Pull updates from GitHub and run complete fix

cd /opt/petrodealhub

echo "=========================================="
echo "Pulling Updates from GitHub"
echo "=========================================="
echo ""

# Pull main repository
echo "1. Pulling main repository..."
git pull origin main || git pull origin master
echo "✅ Main repository updated"
echo ""

# Pull document-processor submodule
echo "2. Pulling document-processor submodule..."
cd document-processor
git pull origin master || git pull origin main
echo "✅ Submodule updated"
echo ""

# Go back to document-processor for the fix
cd /opt/petrodealhub/document-processor

# Download and run the complete fix script
echo "3. Downloading complete fix script..."
curl -O https://raw.githubusercontent.com/jeanclaudder2024/Petrodeal2/main/VPS_COMPLETE_FIX_ALL_PROBLEMS.sh
chmod +x VPS_COMPLETE_FIX_ALL_PROBLEMS.sh
echo "✅ Fix script downloaded"
echo ""

echo "4. Running complete fix script..."
echo ""
./VPS_COMPLETE_FIX_ALL_PROBLEMS.sh
