#!/bin/bash
# Run on VPS. Creates venv in document-processor, installs deps, restarts python-api.
# Usage: bash VPS_SETUP_VENV_AND_PIP.sh

set -e
DOCROOT="/opt/petrodealhub"
DOCPROC="$DOCROOT/document-processor"
VENV="$DOCPROC/venv"

echo "=== document-processor venv setup ==="
cd "$DOCPROC" || exit 1

if [ ! -d "$VENV" ]; then
  echo "Creating venv at $VENV ..."
  python3 -m venv venv
else
  echo "venv already exists at $VENV"
fi

echo "Activating venv and installing requirements ..."
source venv/bin/activate
pip install --upgrade pip -q
pip install -r requirements.txt
deactivate

echo "Done. Restarting python-api (PM2 uses $VENV/bin/python) ..."
pm2 restart python-api
pm2 save

echo "=== Check ==="
pm2 list | grep -E "python-api|react"
curl -s http://localhost:8000/health | head -1
echo ""
