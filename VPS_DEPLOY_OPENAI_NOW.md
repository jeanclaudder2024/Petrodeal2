# VPS Deployment - OpenAI Integration (Current Status)

## Current Status
- ✅ Health endpoint working
- ❌ Service not using systemd (probably PM2 or manual)
- ❌ OpenAI not showing in health (code not updated yet)

## Step-by-Step Deployment

### 1. Check How Service is Running

```bash
# Check if using PM2
pm2 list

# Check if running manually
ps aux | grep "python.*main.py"
ps aux | grep "uvicorn"

# Check if using screen/tmux
screen -ls
tmux ls
```

### 2. Navigate to Project and Pull Updates

```bash
cd /opt/petrodealhub
git pull origin main
git submodule update --init --recursive
cd document-processor
git pull origin master
```

### 3. Install OpenAI Package

```bash
cd /opt/petrodealhub/document-processor

# If using virtual environment (you have venv active)
pip install openai==1.3.0

# OR if not using venv
source venv/bin/activate
pip install openai==1.3.0
```

### 4. Add OpenAI API Key to .env

```bash
cd /opt/petrodealhub/document-processor

# Check if .env exists
ls -la .env

# Add API key
echo "" >> .env
echo "# OpenAI Configuration (for AI-powered random data generation)" >> .env
echo "OPENAI_API_KEY=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" >> .env

# Verify
grep OPENAI .env
```

### 5. Restart Service

#### Option A: If using PM2
```bash
pm2 restart document-processor
# OR
pm2 restart all
pm2 logs document-processor
```

#### Option B: If running manually
```bash
# Find the process
ps aux | grep "python.*main.py" | grep -v grep

# Kill it (replace PID with actual process ID)
kill <PID>

# Restart (adjust path and command as needed)
cd /opt/petrodealhub/document-processor
source venv/bin/activate
python main.py &
# OR
uvicorn main:app --host 0.0.0.0 --port 8000 &
```

#### Option C: If using screen/tmux
```bash
# Attach to screen/tmux session
screen -r
# OR
tmux attach

# Inside the session, stop (Ctrl+C) and restart
cd /opt/petrodealhub/document-processor
source venv/bin/activate
python main.py
# OR
uvicorn main:app --host 0.0.0.0 --port 8000
```

### 6. Verify Deployment

```bash
# Check health endpoint (should now show openai: enabled)
curl http://localhost:8000/health

# Expected output:
# {"status":"healthy","supabase":"connected","openai":"enabled","templates_dir":"...","storage_dir":"..."}
```

### 7. Check Logs

```bash
# If using PM2
pm2 logs document-processor

# If running manually, check output or logs
tail -f /opt/petrodealhub/document-processor/logs/*.log
# OR check process output
```

---

## Quick All-in-One Commands

```bash
# Navigate and pull
cd /opt/petrodealhub && git pull origin main && git submodule update --init --recursive && cd document-processor && git pull origin master

# Install OpenAI
source venv/bin/activate && pip install openai==1.3.0

# Add API key
echo "" >> .env && echo "# OpenAI Configuration" >> .env && echo "OPENAI_API_KEY=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" >> .env

# Restart (choose one):
# PM2: pm2 restart document-processor
# Manual: kill $(ps aux | grep "python.*main.py" | grep -v grep | awk '{print $2}') && cd /opt/petrodealhub/document-processor && source venv/bin/activate && nohup python main.py > /dev/null 2>&1 &

# Verify
curl http://localhost:8000/health
```

---

## Troubleshooting

### If OpenAI still shows "disabled" after restart:

1. **Check if package is installed:**
   ```bash
   source venv/bin/activate
   pip list | grep openai
   ```

2. **Check if API key is in .env:**
   ```bash
   grep OPENAI /opt/petrodealhub/document-processor/.env
   ```

3. **Check Python can import OpenAI:**
   ```bash
   source venv/bin/activate
   python -c "from openai import OpenAI; print('OpenAI imported successfully')"
   ```

4. **Check logs for errors:**
   ```bash
   pm2 logs document-processor
   # OR check process output
   ```

### If service won't start:

1. **Check Python version:**
   ```bash
   python --version
   # Should be Python 3.8+
   ```

2. **Check dependencies:**
   ```bash
   cd /opt/petrodealhub/document-processor
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Try running manually to see errors:**
   ```bash
   cd /opt/petrodealhub/document-processor
   source venv/bin/activate
   python main.py
   ```

---

## Expected Final Result

After deployment, `curl http://localhost:8000/health` should return:

```json
{
  "status": "healthy",
  "supabase": "connected",
  "openai": "enabled",
  "templates_dir": "/opt/petrodealhub/document-processor/templates",
  "storage_dir": "/opt/petrodealhub/document-processor/storage"
}
```

Then you can use "AI Generated" option in CMS for random data generation!

