#!/bin/bash
# Remove CORS headers from Nginx config for control.petrodealhub.com
# Fix: "Access-Control-Allow-Origin contains multiple values" (duplicate with Python API)

set -e

echo "=============================================="
echo "REMOVE CORS FROM control.petrodealhub.com"
echo "=============================================="
echo ""

# Find config containing control.petrodealhub.com
NGINX_SITES="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"
CONTROL_CONFIG=""

for d in "$NGINX_SITES" "$NGINX_ENABLED"; do
  [ -d "$d" ] || continue
  for f in "$d"/*; do
    [ -f "$f" ] || continue
    if grep -q "control\.petrodealhub\.com" "$f" 2>/dev/null; then
      CONTROL_CONFIG="$f"
      break 2
    fi
  done
done

if [ -z "$CONTROL_CONFIG" ]; then
  echo "No nginx config found for control.petrodealhub.com"
  exit 1
fi

echo "Config: $CONTROL_CONFIG"
BACKUP="${CONTROL_CONFIG}.bak.cors.$(date +%Y%m%d_%H%M%S)"
sudo cp "$CONTROL_CONFIG" "$BACKUP"
echo "Backup: $BACKUP"
echo ""

# Remove CORS-related lines and OPTIONS block
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -f "$SCRIPT_DIR/scripts/strip_cors_from_nginx_control.py" ]; then
  sudo python3 "$SCRIPT_DIR/scripts/strip_cors_from_nginx_control.py" "$CONTROL_CONFIG"
else
  echo "Run from project root so scripts/strip_cors_from_nginx_control.py is found."
  exit 1
fi

echo "Testing nginx..."
if ! sudo nginx -t 2>&1; then
  echo "Config invalid. Restoring backup."
  sudo cp "$BACKUP" "$CONTROL_CONFIG"
  exit 1
fi

echo "Reloading nginx..."
sudo systemctl reload nginx
echo "Done. CORS is now only from Python API."
echo "Verify: curl -I -X OPTIONS -H 'Origin: https://petrodealhub.com' https://control.petrodealhub.com/auth/me"
