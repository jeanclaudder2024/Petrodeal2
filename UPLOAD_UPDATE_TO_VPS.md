# How to Upload / Update Your Project on the VPS

You have **two ways** to get updates onto your VPS: **pull from GitHub** (recommended) or **upload files manually**.

---

## Method 1: Pull from GitHub (recommended)

Use this when you’ve already **pushed** your changes to GitHub (e.g. from your PC). The VPS pulls the same code.

### 1. SSH into your VPS

From your **PC** (PowerShell or terminal):

```bash
ssh your-username@your-vps-ip
```

Example: `ssh root@203.0.113.50` or `ssh ubuntu@my-server.com`

### 2. Go to the project folder

```bash
cd /opt/petrodealhub
```

If your app is somewhere else (e.g. `/var/www/petrodealhub`), use that path instead.

### 3. Pull the latest code

**Main repo (React + config):**
```bash
git pull origin main
```

**Document-processor (Python) submodule:**
```bash
git submodule update --init --recursive document-processor
cd document-processor
git pull origin master
cd ..
```

### 4. Install dependencies and build (if needed)

**React (frontend):**
```bash
cd /opt/petrodealhub
npm install
npm run build
```

**Python (document-processor), only if you added new packages:**
```bash
cd /opt/petrodealhub/document-processor
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..
```

### 5. Restart services (PM2)

```bash
pm2 restart python-api
pm2 restart react-app
```

If your frontend has another name, run `pm2 list` and use that name (e.g. `petrodealhub-app`).

### 6. Check that everything is running

```bash
# Python API (document-processor runs on port 8000 on VPS)
curl http://localhost:8000/health

# PM2 status
pm2 status
```

---

## One-line update (after SSH and cd)

Run this **on the VPS** after `cd /opt/petrodealhub`:

```bash
git pull origin main && \
git submodule update --init --recursive document-processor && \
cd document-processor && git pull origin master && cd .. && \
npm install && npm run build && \
pm2 restart python-api react-app && \
echo "Done. API: curl http://localhost:8000/health"
```

Replace `react-app` with your frontend app name if different (`pm2 list`).

---

## Method 2: Upload files from your PC to the VPS

Use this when you **don’t** use GitHub or want to copy specific files.

### Option A: Using SCP (copy whole project)

From your **PC** (PowerShell), in the project folder:

```powershell
# Replace with your VPS user and IP/hostname
scp -r "D:\ia oile project prop\aivessel-trade-flow-main\*" your-user@your-vps-ip:/opt/petrodealhub/
```

**Do not copy** `.env` if it has secrets; create `.env` on the VPS and paste values there.

### Option B: Using rsync (only changed files, from WSL or Git Bash)

```bash
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' \
  "/d/ia oile project prop/aivessel-trade-flow-main/" \
  your-user@your-vps-ip:/opt/petrodealhub/
```

Then on the VPS: `cd /opt/petrodealhub && npm install && npm run build && pm2 restart python-api react-app`.

---

## Important: .env on the VPS

- **`.env` is not in Git** (for security). It is **not** uploaded when you pull.
- On the VPS you must **create** `document-processor/.env` (and root `.env` if you use it) and add:
  - `SUPABASE_URL`
  - `SUPABASE_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`)
  - Optional: `OPENAI_API_KEY`
- Copy from `document-processor/.env.example` and fill in the values.

---

## Run VPS without Python API (frontend only)

If you **don’t want to run the Python document-processor** on the VPS (only React):

**1. Stop and remove the Python app from PM2 (run on VPS):**
```bash
pm2 stop python-api
pm2 delete python-api
pm2 save
```

**2. For future updates**, only pull, build, and restart the frontend:
```bash
cd /opt/petrodealhub
git pull origin main
npm install && npm run build
pm2 restart react-app
```

Document generation in the app will not work on the VPS until you run the Python API again (or point the app to an external document API URL).

---

## Quick reference

| Step              | Command (on VPS, in project folder) |
|-------------------|--------------------------------------|
| Pull main repo    | `git pull origin main`               |
| Update submodule  | `git submodule update --init --recursive document-processor` then `cd document-processor && git pull origin master` |
| Build frontend    | `npm install && npm run build`      |
| Restart API       | `pm2 restart python-api`            |
| Restart frontend  | `pm2 restart react-app`             |
| **Stop Python**   | `pm2 stop python-api && pm2 delete python-api && pm2 save` |
| Check API         | `curl http://localhost:8000/health`  |
| PM2 list          | `pm2 list`                           |
| PM2 logs          | `pm2 logs python-api`                |

---

## If something goes wrong

- **API not starting:**  
  `cd /opt/petrodealhub/document-processor && source venv/bin/activate && python main.py`  
  (see errors in the terminal)

- **Frontend not updating:**  
  Run `npm run build` again, then `pm2 restart react-app`. Hard-refresh the browser (Ctrl+Shift+R).

- **Git conflicts:**  
  `git stash` then `git pull origin main`, or (if you don’t need local changes) `git reset --hard origin/main`.
