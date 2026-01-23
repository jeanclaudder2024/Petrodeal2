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

**If you use PM2 for the frontend:**

```bash
pm2 restart react-app
# or petrodealhub-app, depending on your setup – see pm2 list
```

**If you serve built files with Nginx only** (no PM2 for frontend):

- The `dist/` folder is updated by `npm run build`.  
- Nginx serves from `dist/` – no restart needed.  
- Hard-refresh the site (Ctrl+Shift+R) or clear CDN cache if you use one.

---

## 6. Restart document API (Python)

**You use PM2 for the API** (app name: `python-api`). **Do not use** `systemctl restart document-processor` – that service does not exist.

```bash
pm2 restart python-api
```

Optional, if dependencies changed:

```bash
cd /opt/petrodealhub/document-processor
source venv/bin/activate
pip install -r requirements.txt
cd /opt/petrodealhub
pm2 restart python-api
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

```bash
cd /opt/petrodealhub && \
git pull origin main && \
git submodule update --init --recursive document-processor 2>/dev/null || true && \
npm install && \
npm run build && \
pm2 restart python-api react-app && \
echo "Done. Check: curl http://localhost:8000/health && curl -I http://localhost:3000"
```

If your frontend app is named `petrodealhub-app` instead of `react-app`, use that. Run `pm2 list` to see app names.

---

## Troubleshooting

| Issue | What to do |
|-------|------------|
| `Unit document-processor.service not found` | You use **PM2** for the API. Use `pm2 restart python-api` instead. See **VPS_FIX_PM2_AND_FRONTEND.md**. |
| `Process or Namespace frontend not found` | Your frontend app may be `react-app` or `petrodealhub-app`. Run `pm2 list` and use that name. See **VPS_FIX_PM2_AND_FRONTEND.md**. |
| `petrodealhub-app` or `react-app` **errored** | Frontend serves `dist/` (Vite), not `build/`. Ensure `npm run build` ran, then restart. See **VPS_FIX_PM2_AND_FRONTEND.md**. |
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
