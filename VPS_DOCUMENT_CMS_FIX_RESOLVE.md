# How We Fixed Document CMS (CORS, 404, Login)

## What was wrong

1. **CORS** – Preflight (OPTIONS) had no `Access-Control-Allow-Origin`, or it was duplicated (Nginx + Python).
2. **404 on /update-plan** – Nginx only proxied `/auth/` and `/api/`. The CMS called `/update-plan`, `/plans`, etc. at the root → 404.

## What we changed

**Frontend:** The Document CMS now uses  
`https://control.petrodealhub.com/api`  
as the API base URL (with `/api`).

- All requests go to `/api/auth/login`, `/api/update-plan`, `/api/plans`, `/api/templates`, etc.
- Nginx `location /api/` already proxies to the document API, so **no 404**.
- Preflight (OPTIONS) goes to `/api/...` → same location. Add OPTIONS+CORS only in `location /api/` (see below).

## What you need on the VPS

### 1. Pull and build

```bash
cd /opt/petrodealhub
git pull origin main
npm install
npm run build
pm2 restart react-app
pm2 restart python-api
pm2 save
```

### 2. Nginx: OPTIONS + CORS for `/api/` (and `/auth/`)

So the browser can send OPTIONS preflight and get CORS headers.

**Option A – Script**

```bash
cd /opt/petrodealhub
sudo bash VPS_ADD_OPTIONS_CORS_NGINX.sh
```

**Option B – Manual**

Open the Nginx config for `control.petrodealhub.com`. In **both** `location /api/ {` and `location /auth/ {`, add this **right after the `{`**:

```nginx
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
```

Then:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### 3. No duplicate CORS

**Do not** add `add_header Access-Control-*` in the main body of `location /api/` or `location /auth/` (only inside the `if ($request_method = 'OPTIONS')` block above). Let the Python API add CORS for GET/POST.

### 4. Check

- **Preflight:**  
  `curl -i -X OPTIONS "https://control.petrodealhub.com/api/auth/login" -H "Origin: https://petrodealhub.com" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type"`  
  → Response must include `Access-Control-Allow-Origin: https://petrodealhub.com`.

- **API:**  
  Open `https://petrodealhub.com` → Admin → Document CMS → log in. Plans, templates, update-plan should work.

## Summary

| Change | Purpose |
|--------|---------|
| API base URL = `.../api` | Use existing `location /api/` → no 404 |
| OPTIONS+CORS only in `/api/` and `/auth/` | Preflight works, no duplicate CORS |
| CORS only in Python for GET/POST | Single CORS source for real requests |
