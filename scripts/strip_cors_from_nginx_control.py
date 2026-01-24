#!/usr/bin/env python3
"""Remove CORS headers from Nginx config for control.petrodealhub.com.
Run with: python3 strip_cors_from_nginx_control.py /path/to/nginx/config
"""
import re
import sys

def main():
    if len(sys.argv) < 2:
        print("Usage: strip_cors_from_nginx_control.py <config path>", file=sys.stderr)
        sys.exit(1)
    path = sys.argv[1]

    with open(path, 'r') as f:
        content = f.read()

    # Remove add_header Access-Control-* lines (and optional preceding comment)
    content = re.sub(r'\n\s*# CORS headers\s*\n', '\n', content)
    content = re.sub(r'\n\s*add_header Access-Control-Allow-Origin[^;]+;\s*\n', '\n', content)
    content = re.sub(r'\n\s*add_header Access-Control-Allow-Methods[^;]+;\s*\n', '\n', content)
    content = re.sub(r'\n\s*add_header Access-Control-Allow-Headers[^;]+;\s*\n', '\n', content)
    content = re.sub(r'\n\s*add_header Access-Control-Allow-Credentials[^;]+;\s*\n', '\n', content)

    # Remove "Handle OPTIONS preflight" comment + if block (multi-line)
    content = re.sub(
        r'\n\s*# Handle OPTIONS preflight\s*\n\s*if \(\$request_method = [\'"]OPTIONS[\'"]\) \{\s*\n(?:[^}]*\n)*?\s*return 204;\s*\n\s*\}\s*\n',
        '\n',
        content
    )

    # Remove standalone if ($request_method = 'OPTIONS') { return 204; } blocks
    content = re.sub(
        r'\n\s*if \(\$request_method = [\'"]OPTIONS[\'"]\) \{\s*\n\s*return 204;\s*\n\s*\}\s*\n',
        '\n',
        content
    )

    with open(path, 'w') as f:
        f.write(content)
    print("Stripped CORS from control config.")


if __name__ == '__main__':
    main()
