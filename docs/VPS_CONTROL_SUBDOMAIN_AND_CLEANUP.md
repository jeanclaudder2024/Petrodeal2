# Clean Up Nginx and Connect Document API to control.petrodealhub.com

This guide helps you:
1. **Clean up** duplicate Nginx configs (fix "conflicting server name" warnings).
2. **Connect** the document Python backend so it works at **control.petrodealhub.com** (e.g. `https://control.petrodealhub.com/api/health`).

The **same** Python API (port 8000) can serve both:
- `https://petrodealhub.com/api/`
- `https://control.petrodealhub.com/api/`

---

## Part 1: See what you have

On the VPS:

```bash
# List all enabled site configs
ls -la /etc/nginx/sites-enabled/

# See which files mention control.petrodealhub.com
sudo grep -l "control.petrodealhub.com" /etc/nginx/sites-enabled/*

# See which files mention petrodealhub (main + control)
sudo grep -l "petrodealhub" /etc/nginx/sites-enabled/*
```

You likely have **several** files (e.g. from hosting panel + repo), each defining `server_name petrodealhub.com` or `control.petrodealhub.com`, which causes the "conflicting server name … ignored" warnings.

---

## Part 2: One config per domain (cleanup)

Goal: **one** config file that handles **petrodealhub.com** (and www), and **one** that handles **control.petrodealhub.com**. Disable the rest.

### Option A: Use a single combined file (recommended)

1. **Back up** current configs:
   ```bash
   sudo mkdir -p /etc/nginx/sites-enabled.backup
   sudo cp -a /etc/nginx/sites-enabled/* /etc/nginx/sites-enabled.backup/
   ```

2. **Disable** all current site configs (so Nginx doesn’t load duplicates):
   ```bash
   cd /etc/nginx/sites-enabled
   sudo mv petrodealhub petrodealhub.bak.$(date +%Y%m%d) 2>/dev/null || true
   sudo mv control.petrodealhub control.petrodealhub.bak 2>/dev/null || true
   # Disable any other files that define petrodealhub.com or control.petrodealhub.com
   # e.g. sudo mv some-other.conf some-other.conf.bak
   ```

3. **Create one file** for both domains (see Part 3 below), or restore **only one** file per domain and ensure each has the `/api/` block (Part 4).

4. **Test and reload**:
   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   ```

### Option B: Keep hosting panel configs

If your host (e.g. Hestia/hstgr) manages Nginx, you may need to add the `/api/` block **inside the panel’s** vhost for `control.petrodealhub.com` instead of replacing files. Use the snippet in Part 4 in that vhost.

---

## Part 3: Reference config for control.petrodealhub.com (with /api/)

Use this as a **reference** only. Adjust paths and SSL cert paths to match your server.

**File:** e.g. `/etc/nginx/sites-available/control.petrodealhub.com`  
Symlink: `/etc/nginx/sites-enabled/control.petrodealhub.com` → `../sites-available/control.petrodealhub.com`

```nginx
# control.petrodealhub.com - Control panel + Document API
server {
    listen 80;
    server_name control.petrodealhub.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name control.petrodealhub.com;

    # SSL (adjust paths to your certs, e.g. Let’s Encrypt or panel)
    ssl_certificate     /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    # Document Python API (same backend as main site)
    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        client_max_body_size 50M;
    }

    location /health {
        proxy_pass http://127.0.0.1:8000/health;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Control panel app (React or other – adjust port if different)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

If **control** runs on a **different port** (e.g. 3001), change the `location /` `proxy_pass` to that port (e.g. `http://localhost:3001`).

---

## Part 4: Add /api/ to an existing control.petrodealhub.com server block

If you already have a working HTTPS server block for `control.petrodealhub.com`, just add the **document API** inside it.

1. Open the file that Nginx actually uses for `control.petrodealhub.com` (often the only one left after cleanup):
   ```bash
   sudo nano /etc/nginx/sites-enabled/control.petrodealhub.com
   # or the file your panel uses
   ```

2. Inside the `server { ... }` block that has `server_name control.petrodealhub.com;` and `listen 443 ssl`, add **before** `location /`:

   ```nginx
   # Document API (Python backend on port 8000)
   location /api/ {
       proxy_pass http://127.0.0.1:8000/;
       proxy_http_version 1.1;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
       proxy_connect_timeout 300s;
       proxy_send_timeout 300s;
       proxy_read_timeout 300s;
       client_max_body_size 50M;
   }

   location /health {
       proxy_pass http://127.0.0.1:8000/health;
       proxy_set_header Host $host;
       proxy_set_header X-Forwarded-Proto $scheme;
   }
   ```

3. Test and reload:
   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   ```

4. Test the document API on control subdomain:
   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" https://control.petrodealhub.com/api/health
   ```
   You should get **200**.

---

## Part 5: Use the document API from the control panel app

- **API base URL on control subdomain:** use **`/api`** (same origin).
- So from pages like `https://control.petrodealhub.com/...`, the app should call `https://control.petrodealhub.com/api/...` (e.g. `/api/health`, `/api/templates`, etc.).
- Your existing logic that uses `getDocumentApiUrl()` will already use `/api` when the host is not localhost, so when the app is opened from `control.petrodealhub.com`, it will use `https://control.petrodealhub.com/api` automatically. No code change needed if you rely on same-origin `/api`.

If you ever force a specific URL in the control panel, set it to **`/api`** or **`https://control.petrodealhub.com/api`**.

---

## Quick checklist

| Step | Command / action |
|------|-------------------|
| Backup | `sudo cp -a /etc/nginx/sites-enabled /etc/nginx/sites-enabled.backup` |
| List configs | `ls /etc/nginx/sites-enabled` |
| Edit control vhost | Add `location /api/` and `location /health` (see Part 4) |
| Test | `sudo nginx -t` |
| Reload | `sudo systemctl reload nginx` |
| Test API | `curl -s -o /dev/null -w "%{http_code}\n" https://control.petrodealhub.com/api/health` → expect **200** |

After this, the document Python backend is connected to **control.petrodealhub.com** and Nginx is cleaned up to one server block per domain.
