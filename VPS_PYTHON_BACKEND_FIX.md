# Fix Python Backend on VPS (Make It Work in Production)

On your PC the Python API works on **localhost**. On the VPS it didn’t work because of **3 things**. Follow this guide to fix it.

---

## Why it didn’t work on the VPS

1. **React was calling `localhost:5000`** – In the browser, “localhost” is the **user’s device**, not the VPS. So the site was trying to reach an API on the visitor’s machine, not your server.
2. **Nginx was pointing to port 8000** – Your config sent `/api` to port 8000, but the document-processor runs on **port 5000**.
3. **Build had no API base URL** – The frontend must be built with `VITE_DOCUMENT_API_URL=/api` so it calls **your domain/api** (e.g. `https://yoursite.com/api`), and Nginx forwards that to Python.

---

## Fix in 5 steps (run on the VPS)

### Step 1: SSH and go to project

```bash
ssh root@your-vps-ip
cd /opt/petrodealhub
```

### Step 2: Point Nginx to Python on port 5000

Edit the Nginx config (path may differ on your server):

```bash
sudo nano /etc/nginx/sites-available/default
# or: sudo nano /etc/nginx/conf.d/petrodealhub.conf
```

Make sure the **Python API** block looks like this (port **5000**, not 8000):

```nginx
location /api/ {
    proxy_pass http://localhost:5000/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
    client_max_body_size 50M;
}

location /health {
    proxy_pass http://localhost:5000/health;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Test and reload Nginx:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### Step 3: Create `.env` for the Python app (if missing)

```bash
cd /opt/petrodealhub/document-processor
cp .env.example .env
nano .env
```

Set at least:

- `SUPABASE_URL=https://xxxx.supabase.co`
- `SUPABASE_KEY=eyJ...` (your anon or service role key)

Save and exit.

### Step 4: Python venv and dependencies

```bash
cd /opt/petrodealhub/document-processor
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate
```

### Step 5: Build frontend with `/api` and start Python

**Build React so it uses `/api` (same domain):**

```bash
cd /opt/petrodealhub
export VITE_DOCUMENT_API_URL=/api
npm run build
```

**Start or restart Python with PM2:**

```bash
cd /opt/petrodealhub/document-processor
pm2 delete python-api 2>/dev/null || true
pm2 start venv/bin/python --name python-api -- main.py
pm2 restart react-app
pm2 save
```

**Check:**

```bash
# Must return {"status":"healthy",...}
curl http://localhost:5000/health

# From outside, if your domain is yoursite.com:
curl https://yoursite.com/api/health
# or
curl https://yoursite.com/health
```

If both work, the Python backend is working on the VPS.

---

## One-time full fix script (after pulling code)

From project root on the VPS:

```bash
cd /opt/petrodealhub
git pull origin main
git submodule update --init --recursive document-processor
cd document-processor && git pull origin master && cd ..

# .env: create from example if missing
cd document-processor
[ -f .env ] || cp .env.example .env
# Edit .env and set SUPABASE_URL, SUPABASE_KEY

# Venv and deps
python3 -m venv venv 2>/dev/null || true
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..

# Build frontend with /api
export VITE_DOCUMENT_API_URL=/api
npm install && npm run build

# PM2
pm2 delete python-api 2>/dev/null || true
cd document-processor && pm2 start venv/bin/python --name python-api -- main.py && cd ..
pm2 restart react-app
pm2 save
```

Then fix Nginx as in Step 2 and reload Nginx.

---

## Checklist

| Item | Command / check |
|------|------------------|
| Nginx proxies `/api/` to port **5000** | `grep -A2 "location /api" /etc/nginx/sites-enabled/*` |
| `.env` in document-processor with Supabase keys | `cat /opt/petrodealhub/document-processor/.env` |
| Python runs on 5000 | `curl http://localhost:5000/health` |
| Site calls same-domain API | Build with `VITE_DOCUMENT_API_URL=/api` then `npm run build` |
| PM2 runs python-api | `pm2 list` → python-api online |

---

## If the API still doesn’t respond

**See why Python is failing:**

```bash
pm2 logs python-api --err --lines 50
```

**Run Python by hand to see errors:**

```bash
cd /opt/petrodealhub/document-processor
source venv/bin/activate
python main.py
# Ctrl+C to stop
```

**Typical causes:**

- Missing `.env` or wrong `SUPABASE_URL` / `SUPABASE_KEY`
- Missing system libs (e.g. for `pdf2image`): on Ubuntu/Debian try `sudo apt install -y poppler-utils`
- Port 5000 in use: `sudo lsof -i :5000`

After fixing, restart:

```bash
pm2 restart python-api
```
