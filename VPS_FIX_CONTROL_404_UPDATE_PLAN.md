# Fix: 404 on POST /update-plan, /plans, /templates (control.petrodealhub.com)

## What’s wrong

The Document CMS calls `https://control.petrodealhub.com/update-plan`, `/plans`, `/templates`, etc. **at the root** (no `/api/` prefix). Your Nginx config for `control.petrodealhub.com` only proxies:

- `/auth/` → document API  
- `/api/` → document API  
- `/health` → document API  
- `/cms` → document API  

So `/update-plan`, `/plans`, `/plans-db`, `/templates`, `/upload-template`, `/data/all`, etc. **don’t match** any of those and fall through to the default location → **404**.

## Fix: add a catch‑all `location /` for the document API

Inside the **HTTPS** `server` block for `control.petrodealhub.com`, add a **`location /`** that proxies to the document API. It must be **less specific** than `/cms`, `/auth/`, `/api/`, `/health`, so it will only handle paths that don’t match those (e.g. `/update-plan`, `/plans`, `/templates`).

**Where to add it:**  
Place it **after** the existing `location` blocks (e.g. after `location /api/ { ... }`) and **before** the closing `}` of the `server` block. Keep `location = /` (redirect to `/cms`) as is; it has higher priority.

**Block to add:**

```nginx
    # Document API catch-all (update-plan, plans, templates, etc.)
    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Cookie $http_cookie;
        client_max_body_size 50M;
    }
```

**If you use `127.0.0.1` instead of `localhost`**, change `http://localhost:8000` accordingly.

**Then:**

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## Verify

```bash
curl -s -o /dev/null -w "%{http_code}" https://control.petrodealhub.com/plans
# Expect 200 (or 401 if auth required)

curl -s -X POST https://control.petrodealhub.com/update-plan -H "Content-Type: application/json" -d '{}' -w "%{http_code}"
# Expect 401/422/200, not 404
```

## Summary

| Path            | Location   | Proxied to      |
|-----------------|-----------|------------------|
| `/`             | `= /`     | redirect /cms    |
| `/cms`, `/auth/`, `/api/`, `/health` | specific | document API |
| `/update-plan`, `/plans`, `/templates`, … | `location /` | document API |

Adding `location /` fixes 404s for `/update-plan` and other root-level document API paths.
