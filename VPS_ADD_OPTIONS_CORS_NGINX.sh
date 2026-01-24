#!/bin/bash
# Add OPTIONS preflight + CORS to Nginx for control.petrodealhub.com
# Use when: preflight returns 204 but "No Access-Control-Allow-Origin" (CORS was stripped).
# Usage: ./VPS_ADD_OPTIONS_CORS_NGINX.sh [config_path]
#   If config_path given, use that file. Else search sites-available, sites-enabled, conf.d.

set -e

echo "=============================================="
echo "ADD OPTIONS+CORS TO control.petrodealhub.com"
echo "=============================================="
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ ! -f "$SCRIPT_DIR/scripts/add_options_cors_nginx_control.py" ]; then
  echo "Run from project root. scripts/add_options_cors_nginx_control.py not found."
  exit 1
fi

CONFIGS=()
if [ -n "$1" ]; then
  if [ ! -f "$1" ]; then
    echo "Config not found: $1"
    exit 1
  fi
  CONFIGS=("$1")
  echo "Using config: $1"
else
  for d in /etc/nginx/sites-available /etc/nginx/sites-enabled /etc/nginx/conf.d; do
    [ -d "$d" ] || continue
    for f in "$d"/*; do
      [ -f "$f" ] || continue
      grep -q "control\.petrodealhub\.com" "$f" 2>/dev/null || continue
      CONFIGS+=("$f")
    done
  done
  if [ ${#CONFIGS[@]} -eq 0 ]; then
    echo "No nginx config found for control.petrodealhub.com"
    echo "Usage: $0 /path/to/control-nginx.conf"
    exit 1
  fi
  echo "Found ${#CONFIGS[@]} config(s) with control.petrodealhub.com"
fi

BACKUPS=()
for c in "${CONFIGS[@]}"; do
  echo ""
  echo "Processing: $c"
  BACKUP="${c}.bak.options_cors.$(date +%Y%m%d_%H%M%S)"
  sudo cp "$c" "$BACKUP"
  BACKUPS+=("$BACKUP")
  echo "Backup: $BACKUP"
  sudo python3 "$SCRIPT_DIR/scripts/add_options_cors_nginx_control.py" "$c" || true
done

echo ""
echo "Testing nginx..."
if ! sudo nginx -t 2>&1; then
  echo "Config invalid. Restoring backups."
  for i in "${!CONFIGS[@]}"; do
    sudo cp "${BACKUPS[$i]}" "${CONFIGS[$i]}"
  done
  exit 1
fi

echo "Reloading nginx..."
sudo systemctl reload nginx
echo "Done. Verify:"
echo "  curl -i -X OPTIONS -H 'Origin: https://petrodealhub.com' https://control.petrodealhub.com/auth/login"
echo "  (Response must include Access-Control-Allow-Origin: https://petrodealhub.com)"
