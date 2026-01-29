# VPS: Set up document-processor venv and run API

Use these steps on the VPS. Run as `root` or with `sudo` if needed.

**PM2 ecosystem** (`ecosystem.config.cjs`) already uses  
`/opt/petrodealhub/document-processor/venv/bin/python`. You just need to create that venv and install deps.

---

## Quick: run the script

```bash
cd /opt/petrodealhub
# Get script from repo (if you pulled):
bash VPS_SETUP_VENV_AND_PIP.sh
```

---

## Manual steps

### 1. Install python3-venv (if needed)

```bash
sudo apt update
sudo apt install -y python3-venv python3-full
```

### 2. Go to document-processor

```bash
cd /opt/petrodealhub/document-processor
```

### 3. Create venv (first time only)

```bash
python3 -m venv venv
```

### 4. Activate venv and install deps

```bash
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate
```

**Important:** Use `source venv/bin/activate` (path inside `document-processor`), not `/path/to/venv`.

### 5. Restart python-api

PM2 is already configured to use `venv/bin/python`:

```bash
pm2 restart python-api
pm2 save
curl -s http://localhost:8000/health
```

---

## One-liner (create venv + install + restart)

```bash
cd /opt/petrodealhub/document-processor && \
python3 -m venv venv && \
source venv/bin/activate && \
pip install --upgrade pip && \
pip install -r requirements.txt && \
deactivate && \
pm2 restart python-api && \
pm2 save && \
curl -s http://localhost:8000/health
```
