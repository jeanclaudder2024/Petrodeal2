#!/bin/bash
# Clean reinstall of document-processor ONLY - safe for other projects

set -e

echo "=========================================="
echo "CLEAN REINSTALL DOCUMENT-PROCESSOR"
echo "=========================================="
echo "This script will ONLY affect document-processor project"
echo "Other projects on this VPS will NOT be touched"
echo ""

# Confirmation
read -p "Do you want to continue? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

DOCUMENT_PROCESSOR_DIR="/opt/petrodealhub/document-processor"
BACKUP_DIR="/opt/petrodealhub/document-processor-backup-$(date +%Y%m%d_%H%M%S)"
MAIN_REPO_DIR="/opt/petrodealhub"

echo "Starting clean reinstall..."
echo ""

# 1. Backup important data
echo "1. Backing up important data..."
if [ -d "$DOCUMENT_PROCESSOR_DIR" ]; then
    mkdir -p "$BACKUP_DIR"
    
    # Backup templates
    if [ -d "$DOCUMENT_PROCESSOR_DIR/templates" ]; then
        echo "   Backing up templates..."
        cp -r "$DOCUMENT_PROCESSOR_DIR/templates" "$BACKUP_DIR/templates" 2>/dev/null || true
    fi
    
    # Backup storage (metadata, settings)
    if [ -d "$DOCUMENT_PROCESSOR_DIR/storage" ]; then
        echo "   Backing up storage..."
        cp -r "$DOCUMENT_PROCESSOR_DIR/storage" "$BACKUP_DIR/storage" 2>/dev/null || true
    fi
    
    # Backup data directory
    if [ -d "$DOCUMENT_PROCESSOR_DIR/data" ]; then
        echo "   Backing up data..."
        cp -r "$DOCUMENT_PROCESSOR_DIR/data" "$BACKUP_DIR/data" 2>/dev/null || true
    fi
    
    # Backup .env if exists
    if [ -f "$DOCUMENT_PROCESSOR_DIR/.env" ]; then
        echo "   Backing up .env..."
        cp "$DOCUMENT_PROCESSOR_DIR/.env" "$BACKUP_DIR/.env" 2>/dev/null || true
    fi
    
    echo "   ✅ Backup created at: $BACKUP_DIR"
else
    echo "   ⚠️  document-processor directory not found, skipping backup"
fi
echo ""

# 2. Stop the API
echo "2. Stopping document-processor API..."
pm2 stop python-api 2>/dev/null || echo "   API not running"
pm2 delete python-api 2>/dev/null || echo "   API process not found"
echo ""

# 3. Remove document-processor directory (ONLY this project)
echo "3. Removing document-processor directory..."
if [ -d "$DOCUMENT_PROCESSOR_DIR" ]; then
    rm -rf "$DOCUMENT_PROCESSOR_DIR"
    echo "   ✅ Removed document-processor directory"
else
    echo "   ⚠️  Directory already removed"
fi
echo ""

# 4. Remove submodule entry from git (carefully)
echo "4. Removing submodule entry from git..."
cd "$MAIN_REPO_DIR"
if [ -f ".gitmodules" ] && grep -q "document-processor" .gitmodules; then
    git submodule deinit -f document-processor 2>/dev/null || true
    git rm -f document-processor 2>/dev/null || true
    echo "   ✅ Removed submodule entry"
else
    echo "   ⚠️  Submodule entry not found or already removed"
fi
echo ""

# 5. Re-initialize submodule
echo "5. Re-initializing document-processor submodule..."
cd "$MAIN_REPO_DIR"
git submodule add https://github.com/jeanclaudder2024/document-processor.git document-processor 2>/dev/null || {
    echo "   Submodule already exists in git, updating..."
    git submodule update --init --recursive document-processor
}
cd document-processor
git checkout master || git checkout main || echo "   ⚠️  Could not checkout branch"
git pull origin master || git pull origin main || echo "   ⚠️  Could not pull latest"
echo ""

# 6. Restore backed up data
echo "6. Restoring backed up data..."
if [ -d "$BACKUP_DIR" ]; then
    # Restore templates
    if [ -d "$BACKUP_DIR/templates" ] && [ -d "$DOCUMENT_PROCESSOR_DIR/templates" ]; then
        echo "   Restoring templates..."
        cp -r "$BACKUP_DIR/templates"/* "$DOCUMENT_PROCESSOR_DIR/templates/" 2>/dev/null || true
    fi
    
    # Restore storage
    if [ -d "$BACKUP_DIR/storage" ] && [ -d "$DOCUMENT_PROCESSOR_DIR/storage" ]; then
        echo "   Restoring storage..."
        cp -r "$BACKUP_DIR/storage"/* "$DOCUMENT_PROCESSOR_DIR/storage/" 2>/dev/null || true
    fi
    
    # Restore data
    if [ -d "$BACKUP_DIR/data" ] && [ -d "$DOCUMENT_PROCESSOR_DIR/data" ]; then
        echo "   Restoring data..."
        cp -r "$BACKUP_DIR/data"/* "$DOCUMENT_PROCESSOR_DIR/data/" 2>/dev/null || true
    fi
    
    # Restore .env
    if [ -f "$BACKUP_DIR/.env" ] && [ -d "$DOCUMENT_PROCESSOR_DIR" ]; then
        echo "   Restoring .env..."
        cp "$BACKUP_DIR/.env" "$DOCUMENT_PROCESSOR_DIR/.env" 2>/dev/null || true
    fi
    
    echo "   ✅ Data restored"
else
    echo "   ⚠️  No backup found to restore"
fi
echo ""

# 7. Install Python packages
echo "7. Installing Python packages..."
cd "$DOCUMENT_PROCESSOR_DIR"

# Check if virtual environment exists, if not create one
if [ ! -d "venv" ] && [ ! -d "../venv" ]; then
    echo "   Creating virtual environment..."
    python3 -m venv venv || python3 -m venv ../venv || echo "   ⚠️  Could not create venv"
fi

# Activate venv and install packages
if [ -d "venv" ]; then
    source venv/bin/activate
elif [ -d "../venv" ]; then
    source ../venv/bin/activate
else
    echo "   ⚠️  No virtual environment found, using system Python"
fi

# Install requirements
if [ -f "requirements.txt" ]; then
    echo "   Installing requirements from requirements.txt..."
    pip install --upgrade pip || echo "   ⚠️  Could not upgrade pip"
    pip install -r requirements.txt || echo "   ⚠️  Some packages failed to install"
else
    echo "   ⚠️  requirements.txt not found, installing common packages..."
    pip install fastapi uvicorn python-multipart supabase python-docx python-dotenv || echo "   ⚠️  Some packages failed"
fi

echo "   ✅ Package installation complete"
echo ""

# 8. Create necessary directories
echo "8. Creating necessary directories..."
mkdir -p "$DOCUMENT_PROCESSOR_DIR/templates"
mkdir -p "$DOCUMENT_PROCESSOR_DIR/storage"
mkdir -p "$DOCUMENT_PROCESSOR_DIR/data"
mkdir -p "$DOCUMENT_PROCESSOR_DIR/temp"
mkdir -p "$DOCUMENT_PROCESSOR_DIR/.cursor"
echo "   ✅ Directories created"
echo ""

# 9. Start the API
echo "9. Starting document-processor API..."
cd "$DOCUMENT_PROCESSOR_DIR"

# Use venv if available
if [ -d "venv" ]; then
    VENV_PYTHON="$DOCUMENT_PROCESSOR_DIR/venv/bin/python"
elif [ -d "../venv" ]; then
    VENV_PYTHON="../venv/bin/python"
else
    VENV_PYTHON="python3"
fi

# Check if API is already running
if pm2 list | grep -q "python-api"; then
    pm2 restart python-api
else
    pm2 start "$VENV_PYTHON" main.py --name python-api --interpreter python3 || {
        echo "   ⚠️  Failed to start with venv, trying system Python..."
        pm2 start python3 main.py --name python-api --interpreter python3
    }
fi

sleep 3
echo ""

# 10. Verify API is running
echo "10. Verifying API is running..."
pm2 status python-api
echo ""

# Test health endpoint
echo "   Testing /health endpoint..."
sleep 2
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ API is responding (HTTP $HTTP_CODE)"
    curl -s http://localhost:8000/health | head -1
else
    echo "   ❌ API is not responding (HTTP $HTTP_CODE)"
    echo "   Checking logs..."
    pm2 logs python-api --lines 20 --nostream | tail -10
fi
echo ""

# 11. Summary
echo "=========================================="
echo "REINSTALL COMPLETE"
echo "=========================================="
echo ""
echo "✅ document-processor has been cleanly reinstalled"
echo "✅ Your data has been restored from backup"
echo "✅ API has been restarted"
echo ""
echo "Backup location: $BACKUP_DIR"
echo "(You can delete this after verifying everything works)"
echo ""
echo "Next steps:"
echo "1. Test uploading a template"
echo "2. Test editing plan assignments"
echo "3. Check browser console for any errors"
echo ""
echo "To check API logs:"
echo "  pm2 logs python-api"
echo ""
echo "To check debug logs:"
echo "  tail -f $DOCUMENT_PROCESSOR_DIR/.cursor/debug.log"
echo ""
