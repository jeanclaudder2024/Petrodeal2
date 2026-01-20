#!/bin/bash
# ============================================================================
# CLEAN UP OLD SCRIPTS AND PULL LATEST CHANGES
# ============================================================================
# This script:
# 1. Backs up old fix scripts to avoid conflicts
# 2. Pulls latest changes from repository
# 3. Runs the comprehensive fix script
# ============================================================================

set -e

echo "=========================================="
echo "CLEANING UP AND PULLING LATEST CHANGES"
echo "=========================================="

cd /opt/petrodealhub || exit 1

# 1. Create backup directory for old scripts
BACKUP_DIR="old_scripts_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "1. ✅ Created backup directory: $BACKUP_DIR"

# 2. Move old scripts to backup directory
echo "2. Backing up old scripts..."
OLD_SCRIPTS=(
    "VPS_CLEAN_PM2_SINGLE_API.sh"
    "VPS_CLEAN_REINSTALL_DOCUMENT_PROCESSOR.sh"
    "VPS_COMPLETE_SYNTAX_FIX.sh"
    "VPS_DIAGNOSE_CURRENT_ERRORS.sh"
    "VPS_FIX_API_NOT_LISTENING.sh"
    "VPS_FIX_CORRUPTED_MAIN_PY.sh"
    "VPS_FIX_LINE_2350_INDENTATION.sh"
    "VPS_FIX_NGINX_LOCATION_ERROR.sh"
    "VPS_FIX_PM2_DUPLICATES.sh"
    "VPS_FIX_SYNTAX_AND_DEPENDENCIES.sh"
    "VPS_FORCE_FIX_SYNTAX.sh"
)

for script in "${OLD_SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        mv "$script" "$BACKUP_DIR/"
        echo "   ✅ Moved $script to backup"
    fi
done

echo "   ✅ Backed up ${#OLD_SCRIPTS[@]} old script(s)"

# 3. Pull latest changes
echo "3. Pulling latest changes from repository..."
if git pull origin main; then
    echo "   ✅ Successfully pulled latest changes"
else
    echo "   ❌ Failed to pull changes"
    echo "   Trying to resolve conflicts..."
    
    # Try to stash or reset if there are conflicts
    git fetch origin main
    git reset --hard origin/main || {
        echo "   ⚠️  Could not reset. Please resolve conflicts manually."
        exit 1
    }
    echo "   ✅ Reset to origin/main"
fi

# 4. Update submodule if needed
echo "4. Updating document-processor submodule..."
if [ -d "document-processor" ]; then
    cd document-processor
    git fetch origin master
    git pull origin master || {
        echo "   ⚠️  Submodule pull failed, trying reset..."
        git reset --hard origin/master
    }
    cd ..
    echo "   ✅ Updated document-processor submodule"
else
    echo "   ⚠️  document-processor directory not found, initializing..."
    git submodule update --init --recursive document-processor
    echo "   ✅ Initialized document-processor submodule"
fi

# 5. Run the comprehensive fix script
echo "5. Running comprehensive fix script..."
if [ -f "VPS_FIX_ALL_SYNTAX_ISSUES.sh" ]; then
    chmod +x VPS_FIX_ALL_SYNTAX_ISSUES.sh
    ./VPS_FIX_ALL_SYNTAX_ISSUES.sh
    echo "   ✅ Fix script completed"
else
    echo "   ⚠️  VPS_FIX_ALL_SYNTAX_ISSUES.sh not found"
    echo "   Downloading from repository..."
    curl -O https://raw.githubusercontent.com/jeanclaudder2024/Petrodeal2/main/VPS_FIX_ALL_SYNTAX_ISSUES.sh
    chmod +x VPS_FIX_ALL_SYNTAX_ISSUES.sh
    ./VPS_FIX_ALL_SYNTAX_ISSUES.sh
    echo "   ✅ Fix script completed"
fi

# 6. Summary
echo ""
echo "=========================================="
echo "CLEAN AND PULL COMPLETE"
echo "=========================================="
echo "✅ Backed up old scripts to: $BACKUP_DIR"
echo "✅ Pulled latest changes"
echo "✅ Updated submodule"
echo "✅ Ran comprehensive fix script"
echo ""
echo "You can now start the API with:"
echo "  cd /opt/petrodealhub/document-processor && pm2 restart python-api"
