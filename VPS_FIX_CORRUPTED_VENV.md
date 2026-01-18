# Fix: Corrupted Virtual Environment

## Problem:
```
SyntaxError: source code cannot contain null bytes
File "/opt/petrodealhub/document-processor/venv/bin/python", line 1
  ELF
```

**This means:** PM2 is trying to execute the Python binary (`venv/bin/python`) as a Python script. The venv might be corrupted or PM2 is misconfigured.

## Solution: Recreate Virtual Environment

### Step 1: Stop PM2 Process

```bash
pm2 stop python-api
pm2 delete python-api
```

### Step 2: Check if venv/bin/python is valid

```bash
cd /opt/petrodealhub/document-processor
ls -la venv/bin/python
file venv/bin/python
# Should show: ELF 64-bit LSB executable
```

### Step 3: Recreate Virtual Environment

```bash
cd /opt/petrodealhub/document-processor

# Remove old venv
rm -rf venv

# Create new venv
python3 -m venv venv

# Activate it
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install requirements
pip install -r requirements.txt
```

### Step 4: Verify Python works

```bash
cd /opt/petrodealhub/document-processor
source venv/bin/activate
python --version
# Should show: Python 3.x.x

# Test main.py
python main.py
# Should start without errors (press Ctrl+C to stop)
```

### Step 5: Start with PM2 (Correct Syntax)

```bash
cd /opt/petrodealhub/document-processor

# Option 1: Use full path to Python
pm2 start main.py \
  --name python-api \
  --interpreter /opt/petrodealhub/document-processor/venv/bin/python

# Option 2: Or use this syntax
cd /opt/petrodealhub/document-processor
source venv/bin/activate
pm2 start python --name python-api -- main.py
# This uses the activated Python from PATH

# Save PM2 config
pm2 save
```

### Step 6: Verify It's Working

```bash
# Wait 3 seconds
sleep 3

# Check PM2 status
pm2 list

# Check logs (should not show ELF error)
pm2 logs python-api --lines 20

# Test API
curl http://localhost:8000/health
# Should return: {"status":"ok"}
```

---

## Alternative: Use systemd instead of PM2

If PM2 keeps having issues, use systemd:

```bash
sudo nano /etc/systemd/system/petrodealhub-api.service
```

Add:
```ini
[Unit]
Description=Petrodealhub Document Processor API
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/petrodealhub/document-processor
Environment="PATH=/opt/petrodealhub/document-processor/venv/bin"
ExecStart=/opt/petrodealhub/document-processor/venv/bin/python main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl start petrodealhub-api
sudo systemctl enable petrodealhub-api
sudo systemctl status petrodealhub-api
```

---

## Quick One-Liner Fix:

```bash
cd /opt/petrodealhub/document-processor && \
pm2 stop python-api && pm2 delete python-api && \
rm -rf venv && \
python3 -m venv venv && \
source venv/bin/activate && \
pip install --upgrade pip && \
pip install -r requirements.txt && \
pm2 start main.py --name python-api --interpreter $(pwd)/venv/bin/python && \
pm2 save && \
sleep 3 && \
curl http://localhost:8000/health
```
