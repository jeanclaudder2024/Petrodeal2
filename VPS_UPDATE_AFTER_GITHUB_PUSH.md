# Update VPS After GitHub Push

After pushing updates to GitHub, run these steps on your **VPS** to deploy.

---

## 1. SSH into your VPS

```bash
ssh your-user@your-vps-ip
```

---

## 2. Go to project directory

```bash
cd /opt/petrodealhub
# If your app lives elsewhere, use that path (e.g. /var/www/petrodealhub)
```

---

## 3. Pull latest from GitHub

```bash
git pull origin main
```

If you use **document-processor** as a submodule:

```bash
git submodule update --init --recursive document-processor
cd document-processor
git pull origin master
cd ..
```

---

## 4. Install dependencies & rebuild frontend

```bash
npm install
npm run build
```

---

## 5. Restart frontend (PM2 or your server)

**If you use PM2 for the frontend (e.g. `serve` or Node):**

```bash
pm2 restart frontend
# or whatever your frontend app name is, e.g.:
# pm2 restart all
```

**If you serve built files with Nginx only** (no PM2 for frontend):

- The `dist/` folder is updated by `npm run build`.  
- Nginx serves from `dist/` – no restart needed.  
- Hard-refresh the site (Ctrl+Shift+R) or clear CDN cache if you use one.

---

## 6. Restart document API (Python)

**If you use PM2 for the Python document API:**

```bash
cd /opt/petrodealhub/document-processor
source venv/bin/activate
pip install -r requirements.txt   # optional, if deps changed
pm2 restart python-api
```

**If you use systemd:**

```bash
sudo systemctl restart document-processor
# or whatever your service name is
```

---

## 7. Quick health check

```bash
# Document API
curl http://localhost:8000/health

# Frontend (if served on same machine)
curl -I http://localhost:3000
# or your production URL
```

---

## One-liner (pull + build + restart)

Adjust paths and PM2 app names to match your setup:

```bash
cd /opt/petrodealhub && \
git pull origin main && \
git submodule update --init --recursive document-processor 2>/dev/null || true && \
npm install && \
npm run build && \
pm2 restart python-api frontend 2>/dev/null || true && \
echo "Done. Check: curl http://localhost:8000/health"
```

---

## Troubleshooting

| Issue | What to do |
|-------|------------|
| `git pull` conflicts | `git stash` then `git pull`, then re-apply changes, or `git reset --hard origin/main` if you don’t need local edits |
| `npm run build` fails | Run `npm install` again, check Node version (`node -v`), fix any build errors shown |
| API won’t start | `cd document-processor && source venv/bin/activate && python -m py_compile main.py` to check syntax; check `pm2 logs python-api` |
| Frontend still old | Clear browser cache, hard-refresh (Ctrl+Shift+R); if using Nginx cache, clear it |

---

## Summary

1. **Pull** → `git pull origin main` (+ submodule if used)  
2. **Build** → `npm install` && `npm run build`  
3. **Restart** → PM2 or systemd for frontend + document API  
4. **Verify** → `curl localhost:8000/health` and load your site
