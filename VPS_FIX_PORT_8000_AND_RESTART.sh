#!/bin/bash
# Fix "address already in use" (port 8000) and restart the Document API
# Run from repo root OR document-processor: bash VPS_FIX_PORT_8000_AND_RESTART.sh
# If API runs as root: sudo bash VPS_FIX_PORT_8000_AND_RESTART.sh

set -e
echo "=============================================="
echo "  Fix Port 8000 + Restart Document API"
echo "=============================================="

# Find document-processor (script in repo root or inside document-processor)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -f "$SCRIPT_DIR/main.py" ]; then
  DOC_DIR="$SCRIPT_DIR"
elif [ -f "$SCRIPT_DIR/document-processor/main.py" ]; then
  DOC_DIR="$SCRIPT_DIR/document-processor"
else
  DOC_DIR="${DOC_DIR:-/opt/petrodealhub/document-processor}"
fi
if [ ! -f "$DOC_DIR/main.py" ]; then
  echo "ERROR: main.py not found. Set DOC_DIR or run from repo root / document-processor."
  exit 1
fi
echo "   Using API dir: $DOC_DIR"

# 1. Stop and remove pm2 apps that run the API
echo ""
echo "1. Stopping pm2 API apps..."
for app in python-api python-a document-processor petrodealhub-api; do
  if pm2 describe "$app" &>/dev/null; then
    echo "   Stopping & deleting: $app"
    pm2 stop "$app" 2>/dev/null || true
    pm2 delete "$app" 2>/dev/null || true
  fi
done
pm2 save 2>/dev/null || true
echo "   Done."

# 2. Kill whatever is on port 8000
echo ""
echo "2. Freeing port 8000..."
PIDS=""
if command -v lsof &>/dev/null; then
  PIDS=$(lsof -ti:8000 2>/dev/null || true)
elif command -v ss &>/dev/null; then
  PIDS=$(ss -tlnp 2>/dev/null | grep ':8000' | grep -oP 'pid=\K[0-9]+' | tr '\n' ' ' || true)
fi
if [ -n "$PIDS" ]; then
  for pid in $PIDS; do
    echo "   Killing PID $pid on port 8000"
    kill -9 "$pid" 2>/dev/null || true
  done
  sleep 2
else
  echo "   No process found on 8000."
fi

# 3. Verify port is free
echo ""
echo "3. Verifying port 8000 is free..."
if command -v lsof &>/dev/null && lsof -ti:8000 &>/dev/null; then
  echo "   WARNING: Port 8000 still in use:"
  lsof -i:8000 2>/dev/null || true
  echo "   Run: sudo lsof -i:8000 then sudo kill -9 <PID>"
  exit 1
fi
echo "   Port 8000 is free."

# 4. Start API with pm2 (must use document-processor venv, not repo root or system python)
echo ""
echo "4. Starting API (pm2)..."
PYTHON="$DOC_DIR/venv/bin/python"
if [ ! -x "$PYTHON" ]; then
  echo "   ERROR: venv not found at $DOC_DIR/venv"
  echo "   Create it: cd $DOC_DIR && python3 -m venv venv && venv/bin/pip install -r requirements.txt"
  exit 1
fi
cd "$DOC_DIR"
pm2 start "$PYTHON" --name "python-api" -- main.py
pm2 save
sleep 3

# 5. Health check
echo ""
echo "5. Health check..."
if command -v curl &>/dev/null && curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:8000/health" 2>/dev/null | grep -q 200; then
  echo "   API is up: http://127.0.0.1:8000/health"
else
  echo "   API may still be starting. Check: pm2 logs python-api"
fi

echo ""
echo "=============================================="
echo "  Done. View logs: pm2 logs python-api"
echo "=============================================="
