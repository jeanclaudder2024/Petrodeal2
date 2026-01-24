# Fix: Duplicate `Access-Control-Allow-Origin` (CORS)

## What’s wrong

Requests from `https://petrodealhub.com` to `https://control.petrodealhub.com` (e.g. `/plans`, `/auth/me`, `/templates`) fail with:

```
The 'Access-Control-Allow-Origin' header contains multiple values 'https://petrodealhub.com, https://petrodealhub.com', but only one is allowed.
```

**Cause:** Both **Nginx** (reverse proxy for control.petrodealhub.com) and the **Python document API** add `Access-Control-Allow-Origin`. The browser sees the header twice and blocks the response.

---

## Fix: CORS only in the Python API

**Rule:** Only the **Python app** (FastAPI) must send CORS headers. **Nginx must not** add any `Access-Control-*` headers for locations that proxy to the document API.

### 1. Edit the Nginx config for control.petrodealhub.com

Find the config that defines `server_name control.petrodealhub.com` (e.g. `/etc/nginx/sites-available/` or included configs).

### 2. Remove CORS from API proxy locations

In **every** `location` that `proxy_pass`es to the document API (e.g. `localhost:8000` or `127.0.0.1:8000`), **remove**:

- All lines: `add_header Access-Control-Allow-Origin ...;`
- All lines: `add_header Access-Control-Allow-Methods ...;`
- All lines: `add_header Access-Control-Allow-Headers ...;`
- All lines: `add_header Access-Control-Allow-Credentials ...;`
- The whole **OPTIONS preflight** block, e.g.:

  ```nginx
  if ($request_method = 'OPTIONS') {
      add_header Access-Control-Allow-Origin ...;
      ...
      return 204;
  }
  ```

**Keep:** `proxy_set_header`, `proxy_pass`, `client_max_body_size`, etc. Only CORS-related lines and the OPTIONS block go.

### 3. Reload Nginx

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### 4. Verify

From a browser on petrodealhub.com, open the admin Document CMS. Calls to `https://control.petrodealhub.com/plans`, `/auth/me`, `/templates` should succeed without CORS errors.

---

## Optional: use the fix script

From the project root on the VPS (e.g. `/opt/petrodealhub`):

```bash
cd /opt/petrodealhub
sudo bash VPS_FIX_NGINX_REMOVE_CORS_FOR_CONTROL.sh
```

The script backs up the config, runs `scripts/strip_cors_from_nginx_control.py` to strip CORS from the control config, runs `nginx -t`, and reloads nginx. It targets the nginx config file that contains `control.petrodealhub.com`. **Check** that it modified the correct file.

---

## Summary

| Layer    | CORS headers                          |
|----------|---------------------------------------|
| Nginx    | **None** for API proxy locations      |
| Python   | **All** CORS (including preflight)    |

Once Nginx no longer adds `Access-Control-*` for the document API, the duplicate value error goes away.

---

## "No 'Access-Control-Allow-Origin' on preflight" (OPTIONS)

If you see:

```
Response to preflight request doesn't pass access control check:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**Cause:** Nginx is handling `OPTIONS` (e.g. `if ($request_method = 'OPTIONS') { return 204; }`) and returning 204 **without** CORS headers. The preflight never reaches the Python API.

**Fix:**

**Option A – Add OPTIONS+CORS in Nginx (recommended)**  
If the strip script already ran and preflight still returns 204 with **no** CORS, add an OPTIONS block that **includes** CORS (only for OPTIONS; GET/POST still get CORS from Python):

```bash
cd /opt/petrodealhub
sudo bash VPS_ADD_OPTIONS_CORS_NGINX.sh
```

Then verify preflight (step 4 below).

**If the script says "No suitable location /auth/ or /api/ found":**

1. Find which nginx config defines `location /auth/` for control:
   ```bash
   sudo grep -rn "location /auth/" /etc/nginx/
   ```
2. Run the script on that file explicitly:
   ```bash
   cd /opt/petrodealhub
   sudo bash VPS_ADD_OPTIONS_CORS_NGINX.sh /etc/nginx/sites-available/your-control-config
   ```
3. Or add the OPTIONS block manually: open the control config, and **inside** `location /auth/ {` (right after the `{`), paste:
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
   Then `sudo nginx -t && sudo systemctl reload nginx`.

**Option B – Proxy OPTIONS to Python**

1. **Remove all OPTIONS handling from Nginx** for API proxy locations. The strip script does this: it removes both CORS headers and `if ($request_method = 'OPTIONS') { return 204; }` blocks. Re-run:

   ```bash
   cd /opt/petrodealhub
   sudo bash VPS_FIX_NGINX_REMOVE_CORS_FOR_CONTROL.sh
   ```

2. **Check the config** – Search for `OPTIONS` or `return 204` in the control config. If any `if ($request_method = 'OPTIONS')` block remains, delete it so `OPTIONS` is proxied to the backend.

3. **Restart the Python API** – The document API has explicit `OPTIONS` handlers for `/auth/login`, `/auth/logout`, `/auth/me` that return CORS. Restart so they’re active:

   ```bash
   pm2 restart python-api
   ```

4. **Verify preflight**:

   ```bash
   curl -i -X OPTIONS "https://control.petrodealhub.com/auth/login" \
     -H "Origin: https://petrodealhub.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type"
   ```

   The response must include `Access-Control-Allow-Origin: https://petrodealhub.com` and `204` or `200`.
