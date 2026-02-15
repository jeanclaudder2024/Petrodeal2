#!/bin/bash
# Fix Nginx so /api/ returns 200 from Python (port 8000), not 301.
# Run on VPS: sudo bash VPS_FIX_NGINX_API_301.sh

set -e

echo "=========================================="
echo "FIX NGINX /api/ -> 8000 (no 301)"
echo "=========================================="

# 1. Ensure all /api/ blocks use port 8000 (not 8050)
SITES_ENABLED="${SITES_ENABLED:-/etc/nginx/sites-enabled}"
for f in "$SITES_ENABLED"/*; do
  [ -f "$f" ] || continue
  if grep -q 'proxy_pass.*8050' "$f" 2>/dev/null; then
    echo "Fixing $f: 8050 -> 8000"
    sed -i.bak 's/127\.0\.0\.1:8050/127.0.0.1:8000/g; s/localhost:8050/localhost:8000/g' "$f"
  fi
done

# 2. Test config and reload
nginx -t && systemctl reload nginx
echo "Nginx reloaded."

# 3. Test (HTTP may 301 to HTTPS; that's OK)
CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health 2>/dev/null || echo "000")
echo "GET http://localhost/api/health -> HTTP $CODE"
if [ "$CODE" = "301" ] || [ "$CODE" = "302" ]; then
  echo "Redirect is likely HTTP->HTTPS. Test from browser: https://petrodealhub.com/api/health"
  echo "Or from VPS: curl -s -o /dev/null -w '%{http_code}' https://petrodealhub.com/api/health"
fi
if [ "$CODE" = "200" ]; then
  echo "OK: API is reachable."
fi

echo "Done."
