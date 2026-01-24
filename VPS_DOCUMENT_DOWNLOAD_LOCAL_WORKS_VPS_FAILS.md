# Document Download: Works Locally, Fails on VPS

## Why local works but VPS doesn’t

| | **Local** | **VPS** |
|---|---|---|
| **Frontend** | localhost:8080 / :5173 | https://petrodealhub.com |
| **API** | Direct `http://localhost:8000` | Via Nginx → `https://control.petrodealhub.com/api` |
| **Nginx** | None | Proxies /api/ to Python |
| **Template files** | Your `document-processor/templates/` | VPS `.../templates/` or Supabase only |

Common causes on VPS:

1. **Nginx** – /api/ not proxied correctly for POST, or wrong path.
2. **Template files missing** – Templates in DB but no .docx on VPS (404 "Template file missing").
3. **Old API code** – document-processor not updated or python-api not restarted.

---

## 1. Update document-processor and restart API

```bash
cd /opt/petrodealhub/document-processor
git pull origin master
cd /opt/petrodealhub
pm2 restart python-api
pm2 save
```

Check it’s running:

```bash
pm2 list
curl -s http://localhost:8000/health
# Expect {"status":"healthy",...}
```

---

## 2. Check Nginx proxy for /api/ (control subdomain)

Find the config for **control.petrodealhub.com**:

```bash
sudo grep -r "control.petrodealhub" /etc/nginx/
# Often: /etc/nginx/sites-available/... or /etc/nginx/conf.d/...
```

In that server block, you must have something like:

```nginx
location /api/ {
    proxy_pass http://localhost:8000/;   # trailing slash = strip /api
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Cookie $http_cookie;
    client_max_body_size 50M;
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
}
```

- **`proxy_pass http://localhost:8000/`** (with trailing slash):  
  `/api/generate-document` → backend sees `/generate-document`.  
  Python route: `POST /generate-document`.

- **`proxy_pass http://localhost:8000`** (no slash):  
  Backend sees `/api/generate-document`.  
  The API also has `POST /api/generate-document`, so both work if the code is up to date.

Ensure there is **no** `limit_except GET` (or similar) that would block POST.

Then:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## 3. Test from the VPS

**A. Direct to Python (no Nginx):**

```bash
curl -s -X POST http://localhost:8000/generate-document \
  -H "Content-Type: application/json" \
  -d '{"template_name":"ICPO TEMPLATE","vessel_imo":"1234567"}' \
  -w "\nHTTP_CODE:%{http_code}\n" -o /tmp/out.bin
```

- **200** + binary output → API works; problem is Nginx or frontend.
- **404** → "Template not found" or "Template file missing" (see step 4).
- **422** → Missing/invalid `template_name` or `vessel_imo`.

**B. Through Nginx (same as frontend):**

```bash
curl -s -X POST https://control.petrodealhub.com/api/generate-document \
  -H "Content-Type: application/json" \
  -d '{"template_name":"ICPO TEMPLATE","vessel_imo":"1234567"}' \
  -w "\nHTTP_CODE:%{http_code}\n" -o /tmp/out2.bin
```

- **404** here but **200** on (A) → Nginx config or path issue for /api/.
- **200** → Nginx and API are fine; check frontend (URL, CORS, etc.).

---

## 4. Template files on VPS (404 "Template file missing")

The API looks for the .docx in:

1. **Supabase** `template_files` (by template_id), or  
2. **Local** `document-processor/templates/` on the VPS.

If the template is in DB but the file is in neither place, you get **404 "Template file missing"**.  
Locally you often have the files in `templates/`; on VPS that folder might be empty or out of sync.

**Fix:**

- **Option A – Use CMS:** Upload the template via Document CMS so it’s stored in Supabase.  
- **Option B – Sync local files:** Copy your local `document-processor/templates/*.docx` to the VPS:

  ```bash
  # On your machine (PowerShell or Git Bash)
  scp "D:\ia oile project prop\aivessel-trade-flow-main\document-processor\templates\*.docx" \
    root@YOUR_VPS_IP:/opt/petrodealhub/document-processor/templates/
  ```

Replace `YOUR_VPS_IP` and paths if different.

Then ensure the app uses that dir (e.g. same as `TEMPLATES_DIR` / `document-processor` in your setup).

---

## 5. Watch logs while reproducing

```bash
pm2 logs python-api --lines 0
```

Click **Download** on the vessel page, then check the log:

- **"GENERATING DOCUMENT"** / **"Template Name"** / **"Vessel IMO"** → Request reaches Python.  
  - Then **404** → template not found or **template file missing** (step 4).  
- **Nothing** → Request not reaching Python (Nginx or frontend).

---

## 6. Quick checklist

- [ ] `cd /opt/petrodealhub/document-processor && git pull origin master`
- [ ] `pm2 restart python-api && pm2 save`
- [ ] `curl -s http://localhost:8000/health` → healthy
- [ ] Nginx `location /api/` proxies to `http://localhost:8000/` (or `...8000`) and allows POST
- [ ] `sudo nginx -t && sudo systemctl reload nginx`
- [ ] Template .docx exists in Supabase **or** in `document-processor/templates/` on VPS
- [ ] `curl -X POST http://localhost:8000/generate-document ...` returns 200 (or 404 with clear body)
- [ ] `curl -X POST https://control.petrodealhub.com/api/generate-document ...` returns 200 (or same 404)

If both curls behave the same, the remaining problem is frontend (URL, CORS, or environment).  
If (A) works and (B) 404s, focus on Nginx and control subdomain config.
