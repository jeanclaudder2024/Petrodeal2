# VPS Nginx check (petrodealhub.com)

Your Nginx config is in **`/etc/nginx/sites-enabled/petrodealhub`** (not `default`).

## 1. See current API proxy (on VPS)

```bash
sudo grep -A2 "location /api" /etc/nginx/sites-enabled/petrodealhub
sudo grep -A2 "location /health" /etc/nginx/sites-enabled/petrodealhub
```

Your Python API runs on **port 8000** on the VPS. Nginx should have **`proxy_pass http://localhost:8000`** for `/api/` and `/health`. No change needed if already 8000.

## 2. Edit config

```bash
sudo nano /etc/nginx/sites-enabled/petrodealhub
```

In the **server** block for petrodealhub.com (or the one that serves your React app), ensure you have:

```nginx
# Python API (document-processor on port 8000 on VPS)
location /api/ {
    proxy_pass http://localhost:8000/;
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
    proxy_pass http://localhost:8000/health;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Ensure both use **`proxy_pass http://localhost:8000`** (document-processor runs on 8000 on VPS).

Save (Ctrl+O, Enter, Ctrl+X).

## 3. Test and reload

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## 4. Test from browser or curl

```bash
curl -s https://petrodealhub.com/api/health
# or
curl -s https://petrodealhub.com/health
```

Expected: `{"status":"healthy","version":"1.0.0"}`

---

## About the Nginx warnings

- **"conflicting server name ... ignored"** – You have several configs (e.g. petrodealhub, n8n) defining the same `server_name` (petrodealhub.com, control.petrodealhub.com). Nginx still works; it uses the first match. To clean up later, keep one server block per host and remove or comment duplicates.
- **"protocol options redefined"** – Usually from multiple `listen 443 ssl` blocks; harmless if the test passes.

As long as `nginx -t` says **syntax is ok** and **test is successful**, reload is safe.
