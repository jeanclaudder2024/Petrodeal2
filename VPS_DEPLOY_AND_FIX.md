# VPS deploy and fix (port 8000, Pydantic, API restart)

Use this after pushing updates. Fixes **port 8000 already in use** and **Pydantic schema error**.

---

## 1. SSH into your VPS

```bash
ssh user@your-vps-ip
```

---

## 2. Pull latest code

```bash
cd /opt/petrodealhub
git pull origin main
```

**If you see** `fatal: No url found for submodule path 'document-processor' in .gitmodules`  
→ Pull added `.gitmodules`. Run again: `git pull origin main`, then:

```bash
git submodule update --init --recursive
```

**If submodule update still fails**, update `document-processor` directly (gets fix script + API changes):

```bash
cd /opt/petrodealhub/document-processor
git fetch origin
git pull origin master
cd ..
```

---

## 3. Run the fix script (free port 8000 + restart API)

The script is at **repo root**. It finds `document-processor` automatically. Run from repo root:

```bash
cd /opt/petrodealhub
bash VPS_FIX_PORT_8000_AND_RESTART.sh
```

You can also run it from inside `document-processor` if that dir has the script:

```bash
cd /opt/petrodealhub/document-processor
bash VPS_FIX_PORT_8000_AND_RESTART.sh
```

If the API runs as root:

```bash
sudo bash VPS_FIX_PORT_8000_AND_RESTART.sh
```

**Script not found?** The script lives at **repo root** (`/opt/petrodealhub/VPS_FIX_PORT_8000_AND_RESTART.sh`). Run it from the repo root, not from `document-processor`, if you just pulled main.

---

## 4. Verify

- **Logs**
  ```bash
  pm2 logs python-api --lines 50
  ```
  You should see `Starting Document Processing API v2.0...` and **no** `address already in use` or Pydantic errors.

- **Health**
  ```bash
  curl -s http://127.0.0.1:8000/health
  ```
  Expect a 200 OK response.

---

## 5. If the script is not used (manual steps)

```bash
# Stop and remove pm2 API apps
pm2 stop python-api python-a 2>/dev/null
pm2 delete python-api python-a 2>/dev/null
pm2 save

# Free port 8000
lsof -ti:8000 | xargs -r kill -9
sleep 2

# Start API
cd /opt/petrodealhub/document-processor
pm2 start venv/bin/python --name python-api -- main.py
pm2 save

# Check
pm2 logs python-api --lines 30
curl -s http://127.0.0.1:8000/health
```

---

## 6. Project paths

Replace `/opt/petrodealhub` with your actual project root if different, e.g.:

- `/opt/aivessel-trade-flow`
- `$HOME/aivessel-trade-flow-main`

---

## 7. What was fixed in this update

| Issue | Fix |
|-------|-----|
| **Port 8000 already in use** | Script stops pm2 apps, kills process on 8000, restarts API |
| **Pydantic Union schema error** | `/templates/{id}/metadata` now uses `Request` + `request.json()` instead of `Body(Dict)` |
| **AI upload mapping** | Placeholders upsert to Supabase only when `template_id` exists; otherwise persist to disk only |

See `document-processor/VPS_FIX_PORT_8000_AND_PYDANTIC.md` for more detail.
