#!/usr/bin/env python3
"""Add OPTIONS preflight block with CORS to Nginx config for control.petrodealhub.com.
Use when preflight returns 204 with no CORS. Adds CORS *only* for OPTIONS; GET/POST
get CORS from Python.

Run: python3 add_options_cors_nginx_control.py /path/to/nginx/config
"""
import sys

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

NEEDLES = ['location /auth/ {', 'location /api/ {']


def main():
    if len(sys.argv) < 2:
        print("Usage: add_options_cors_nginx_control.py <config path>", file=sys.stderr)
        sys.exit(1)
    path = sys.argv[1]

    with open(path, 'r') as f:
        content = f.read()

    modified = False
    for needle in NEEDLES:
        start = 0
        while True:
            idx = content.find(needle, start)
            if idx == -1:
                break
            insert_at = idx + len(needle)
            chunk = content[insert_at:insert_at + 400]
            if "if ($request_method = 'OPTIONS')" in chunk:
                start = idx + 1
                continue
            content = content[:insert_at] + OPTIONS_BLOCK + content[insert_at:]
            modified = True
            start = insert_at + len(OPTIONS_BLOCK)

    if not modified:
        print("No suitable location /auth/ or /api/ found, or already has OPTIONS+CORS.")
        print("Tip: Run on the exact nginx config that defines control.petrodealhub.com")
        print("     and contains 'location /auth/' or 'location /api/' proxying to :8000.")
        return

    with open(path, 'w') as f:
        f.write(content)
    print("Added OPTIONS+CORS block to API location(s).")


if __name__ == '__main__':
    main()
