# Fix VPS: document-processor not found & Frontend errored

## What’s going on

1. **`document-processor.service` not found** – You run the document API with **PM2** (`python-api`), not systemd. Ignore any `systemctl restart document-processor` step.
2. **`pm2 restart frontend`** – You don’t have an app named `frontend`. Your frontend is likely **`petrodealhub-app`** or **`react-app`**.
3. **`petrodealhub-app` is errored** – The app is crashing (wrong folder, wrong serve path, or missing `dist`).

---

## Fix in 4 steps

Run these on your **VPS** (as root or with sudo if needed).

### 1. Go to project and pull latest

```bash
cd /opt/petrodealhub
git pull origin main
```

### 2. Install deps, build frontend, ensure `dist` exists

```bash
npm install
npm run build
```

You must see a `dist/` folder. The app serves **`dist`** (Vite output), not `build`.

### 3. Fix PM2 – use ecosystem (react-app + python-api)

**Option A – Use ecosystem (recommended)**

```bash
cd /opt/petrodealhub

# Stop and delete the broken frontend app (if you have petrodealhub-app)
pm2 delete petrodealhub-app 2>/dev/null || true

# Start both apps from ecosystem
pm2 start ecosystem.config.cjs
```

This starts **`python-api`** and **`react-app`**. The frontend serves `dist` on port 3000.

**Option B – Keep `petrodealhub-app` and only fix it**

If you prefer to keep the name `petrodealhub-app`:

```bash
cd /opt/petrodealhub
pm2 delete petrodealhub-app
pm2 start npx --name "petrodealhub-app" -- serve -s dist -l 3000
# cwd must be /opt/petrodealhub (where dist lives)
pm2 save
```

### 4. Restart API (if you didn’t use ecosystem)

```bash
pm2 restart python-api
```

---

## Commands you should use (no systemd)

| Goal | Command |
|------|---------|
| Restart document API | `pm2 restart python-api` |
| Restart frontend | `pm2 restart react-app` (or `petrodealhub-app` if you use Option B) |
| Restart both | `pm2 restart python-api react-app` |
| **Do NOT use** | `sudo systemctl restart document-processor` (service doesn’t exist) |

---

## Check that it works

```bash
# API
curl http://localhost:8000/health

# Frontend (React app on 3000)
curl -I http://localhost:3000
```

```bash
pm2 status
pm2 logs react-app --lines 30
pm2 logs python-api --lines 30
```

---

## If `react-app` still errors

1. **Confirm `dist` exists:**

   ```bash
   ls -la /opt/petrodealhub/dist
   ```

2. **Check logs:**

   ```bash
   pm2 logs react-app --err --lines 50
   ```

3. **Run serve manually to see the error:**

   ```bash
   cd /opt/petrodealhub
   npx serve -s dist -l 3000
   ```

   Stop with Ctrl+C when done, then fix any errors (e.g. missing `dist`, port in use).

4. **Port 3000 in use?**

   ```bash
   sudo lsof -i :3000
   ```

   Stop whatever uses it, or change the port in `ecosystem.config.cjs` (e.g. `-l 3001`) and restart.

---

## One‑liner (after `git pull`)

```bash
cd /opt/petrodealhub && \
git pull origin main && \
npm install && \
npm run build && \
pm2 delete petrodealhub-app 2>/dev/null || true && \
pm2 start ecosystem.config.cjs && \
pm2 save && \
echo "Done. Check: curl http://localhost:8000/health && curl -I http://localhost:3000"
```

---

## Summary

- **Document API**: Use **PM2** → `pm2 restart python-api`. Do **not** use `systemctl restart document-processor`.
- **Frontend**: Use **PM2** → `react-app` (or `petrodealhub-app`). Serve **`dist`** from **project root** (`/opt/petrodealhub`).
- **Update flow**: `git pull` → `npm install` → `npm run build` → `pm2 restart python-api react-app`.
