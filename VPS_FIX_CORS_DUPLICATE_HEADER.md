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
