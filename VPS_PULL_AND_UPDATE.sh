#!/bin/bash
# VPS: Pull Latest Code and Handle Local Changes
# This script handles local changes before pulling

cd /opt/petrodealhub || { echo "ERROR: /opt/petrodealhub not found!"; exit 1; }

echo "=========================================="
echo "Pulling Latest Code from GitHub"
echo "=========================================="
echo ""

# Check for local changes
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Local changes detected. Stashing them..."
    git stash save "Local changes before pull - $(date +%Y-%m-%d_%H-%M-%S)"
    echo "✅ Local changes stashed"
    echo ""
fi

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pulled latest code!"
    echo ""
    
    # Check if there were stashed changes
    if git stash list | grep -q "Local changes before pull"; then
        echo "💡 Note: You had local changes that were stashed."
        echo "   To see them: git stash list"
        echo "   To apply them: git stash pop"
        echo "   To discard them: git stash drop"
    fi
else
    echo ""
    echo "❌ Error pulling code. Please check the error above."
    exit 1
fi

echo ""
echo "=========================================="
echo "Next steps:"
echo "=========================================="
echo "1. Run the diagnostic script:"
echo "   chmod +x VPS_COMPLETE_DIAGNOSTIC_AND_FIX.sh"
echo "   bash VPS_COMPLETE_DIAGNOSTIC_AND_FIX.sh"
echo ""
echo "2. Or run quick update:"
echo "   chmod +x VPS_QUICK_UPDATE.sh"
echo "   bash VPS_QUICK_UPDATE.sh"
echo ""

