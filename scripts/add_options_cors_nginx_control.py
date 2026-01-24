#!/usr/bin/env python3
"""Add OPTIONS preflight block with CORS to Nginx config for control.petrodealhub.com.
Use when preflight returns 204 with no CORS. Adds CORS *only* for OPTIONS; GET/POST
get CORS from Python.

Run: python3 add_options_cors_nginx_control.py /path/to/nginx/config
"""
import sys

# Insert immediately after "location /auth/ {" or "location /api/ {"
# Use same indentation as the location line (assume 4 spaces).
OPTIONS_BLOCK = """
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin $http_origin always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
            add_header Access-Control-Allow-Credentials "true" always;
            add_header Access-Control-Max-Age 600 always;
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
"""


def main():
    if len(sys.argv) < 2:
        print("Usage: add_options_cors_nginx_control.py <config path>", file=sys.stderr)
        sys.exit(1)
    path = sys.argv[1]

    with open(path, 'r') as f:
        content = f.read()

    if "if ($request_method = 'OPTIONS')" in content and "Access-Control-Allow-Origin" in content:
        print("OPTIONS+CORS block already present, skipping.")
        return

    modified = False
    for loc in ['location /auth/', 'location /api/']:
        needle = loc + ' {'
        idx = content.find(needle)
        if idx == -1:
            continue
        insert_at = idx + len(needle)
        chunk = content[insert_at:insert_at + 300]
        if "if ($request_method = 'OPTIONS')" in chunk:
            continue
        content = content[:insert_at] + OPTIONS_BLOCK + content[insert_at:]
        modified = True

    if not modified:
        print("No suitable location /auth/ or /api/ found, or already has OPTIONS+CORS.")
        return

    with open(path, 'w') as f:
        f.write(content)
    print("Added OPTIONS+CORS block to API location(s).")


if __name__ == '__main__':
    main()
