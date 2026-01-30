# VPS deploy and fix (port 8000, Pydantic, API restart)

Use this after pushing updates. Fixes **port 8000 already in use** and **Pydantic schema error**.

---

## 1. SSH into your VPS

```bash
ssh user@your-vps-ip
```

---

## 2. Pull latest code

**If you use the main repo only** (e.g. `/opt/petrodealhub` or project root):

```bash
cd /opt/petrodealhub
git pull origin main
```

**If `document-processor` is a submodule**, also update it:

```bash
cd /opt/petrodealhub
git pull origin main
git submodule update --init --recursive
```

**If `document-processor` is a separate clone**:

```bash
cd /opt/petrodealhub/document-processor
git pull origin master
```

---

## 3. Run the fix script (free port 8000 + restart API)

The script stops pm2 API apps, kills whatever uses port 8000, then starts the API again.

```bash
cd /opt/petrodealhub/document-processor
bash VPS_FIX_PORT_8000_AND_RESTART.sh
```

If the API runs as root (e.g. systemd):

```bash
sudo bash VPS_FIX_PORT_8000_AND_RESTART.sh
```

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
