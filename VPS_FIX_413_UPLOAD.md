# Fix 413 Payload Too Large on template upload

If uploading a document template from the admin panel returns **413 (Payload Too Large)**, Nginx is rejecting the request because the body exceeds its limit.

## Fix on VPS

1. Find the Nginx config that serves your app (e.g. `petrodealhub.com` or `control.petrodealhub.com`):
   ```bash
   sudo grep -l "petrodealhub" /etc/nginx/sites-enabled/*
   ```

2. In that file, add **inside the `server { ... }` block** (near the top, after `server_name`):
   ```nginx
   client_max_body_size 50M;
   ```

3. If you have a separate `location /api/` block, add the same line there:
   ```nginx
   location /api/ {
       client_max_body_size 50M;
       proxy_pass http://localhost:8000/;
       # ... rest of proxy settings
   }
   ```

4. Test and reload:
   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   ```

5. In the admin panel, set the **Document API base URL** to **`https://petrodealhub.com/api`** (not `.../portal`), then try uploading again.
