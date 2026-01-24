#!/bin/bash
# Add OPTIONS preflight + CORS to Nginx for control.petrodealhub.com
# Use when: preflight returns 204 but "No Access-Control-Allow-Origin" (CORS was stripped).

set -e

echo "=============================================="
echo "ADD OPTIONS+CORS TO control.petrodealhub.com"
echo "=============================================="
echo ""

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
BACKUP="${CONTROL_CONFIG}.bak.options_cors.$(date +%Y%m%d_%H%M%S)"
sudo cp "$CONTROL_CONFIG" "$BACKUP"
echo "Backup: $BACKUP"
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ ! -f "$SCRIPT_DIR/scripts/add_options_cors_nginx_control.py" ]; then
  echo "Run from project root. scripts/add_options_cors_nginx_control.py not found."
  exit 1
fi

sudo python3 "$SCRIPT_DIR/scripts/add_options_cors_nginx_control.py" "$CONTROL_CONFIG"

echo "Testing nginx..."
if ! sudo nginx -t 2>&1; then
  echo "Config invalid. Restoring backup."
  sudo cp "$BACKUP" "$CONTROL_CONFIG"
  exit 1
fi

echo "Reloading nginx..."
sudo systemctl reload nginx
echo "Done. Verify:"
echo "  curl -i -X OPTIONS -H 'Origin: https://petrodealhub.com' https://control.petrodealhub.com/auth/login"
echo "  (Response must include Access-Control-Allow-Origin: https://petrodealhub.com)"
