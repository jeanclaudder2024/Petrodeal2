# Full System Runs on VPS Only (No Python on Your PC)

You do **not** run the Python project on your PC. Everything runs on the **VPS**.

---

## What runs where

| Component        | Where it runs | How you use it |
|-----------------|----------------|----------------|
| **React app**   | VPS (PM2: react-app) | Open **https://petrodealhub.com** in your browser |
| **Python API**  | VPS (PM2: python-api, port 8000) | Used by the site at **https://petrodealhub.com/api** |
| **Nginx**       | VPS | Proxies your domain to React and `/api` to Python |
| **Your PC**     | Only: code edits, git push, SSH to VPS | No Python, no npm run dev required |

---

## One-time setup on the VPS (if not done yet)

SSH into the VPS and run:

```bash
cd /opt/petrodealhub
git pull origin main
git submodule update --init --recursive document-processor
cd document-processor && git pull origin master && cd ..

# Python: venv and dependencies
cd /opt/petrodealhub/document-processor
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate

# Create .env with Supabase (required)
cp .env.example .env
nano .env   # set SUPABASE_URL and SUPABASE_KEY

# Frontend: build with /api so the site calls the VPS API
cd /opt/petrodealhub
export VITE_DOCUMENT_API_URL=/api
npm install && npm run build

# Start both with PM2 (Python on port 8000)
cd /opt/petrodealhub/document-processor
pm2 delete python-api 2>/dev/null || true
pm2 start venv/bin/python --name python-api -- main.py
pm2 restart react-app
pm2 save
```

Ensure Nginx proxies **/api/** and **/health** to **http://localhost:8000** (see `nginx-config.conf` or `VPS_NGINX_CHECK.md`), then:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## How to update (when you change code)

1. On your **PC**: edit code, then push to GitHub:
   ```bash
   git add -A
   git commit -m "your message"
   git push origin main
   ```

2. On the **VPS**: pull and run the update script:
   ```bash
   ssh root@srv898241.hstgr.cloud   # or your VPS user@host
   cd /opt/petrodealhub
   git pull origin main
   git submodule update --init --recursive document-processor
   cd document-processor && git pull origin master && cd ..
   bash VPS_PULL_UPDATE.sh
   ```

That’s it. The full system (React + Python) runs only on the VPS; you use the site at **https://petrodealhub.com**.

---

## Your PC: what you need

- **Editor** (e.g. Cursor/VS Code) to change code
- **Git** to push to GitHub
- **SSH** to run the update commands on the VPS
- **Browser** to open https://petrodealhub.com

You do **not** need on your PC:

- Python
- Node/npm for running the app (only if you want to run the frontend locally for testing)
- Running the document-processor (Python) locally

---

## Quick check that everything is on the VPS

On the VPS:

```bash
pm2 list
curl -s http://localhost:8000/health
```

From your PC (browser or curl):

- https://petrodealhub.com  
- https://petrodealhub.com/api/health  
  Should return: `{"status":"healthy","version":"1.0.0"}`

If both work, the full system is running on the VPS only.
