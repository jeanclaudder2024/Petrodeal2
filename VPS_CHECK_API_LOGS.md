# Check Why API Still Not Working

## Problem:
- PM2 shows `python-api` as "online"
- But `curl http://localhost:8000/health` fails
- API crashes immediately after starting

## Solution: Check PM2 Logs

Run this on your VPS to see what error is preventing the API from starting:

```bash
# Check recent logs (most recent errors)
pm2 logs python-api --lines 50

# Check error logs only
pm2 logs python-api --err --lines 50

# Or check all logs without streaming
pm2 logs python-api --lines 100 --nostream
```

**Look for:**
- Python errors (ImportError, SyntaxError, etc.)
- Port already in use
- Missing environment variables
- Database connection errors

---

## Quick Diagnostic Commands:

```bash
# 1. Check if port 8000 is being used
sudo lsof -i:8000

# 2. Check PM2 logs
pm2 logs python-api --lines 50

# 3. Check if Python process is actually running
ps aux | grep python | grep main.py

# 4. Try starting manually to see errors directly
cd /opt/petrodealhub/document-processor
source venv/bin/activate
python main.py
# This will show you the EXACT error preventing startup
```

---

## Common Issues:

### Issue 1: Port 8000 Already in Use
```bash
sudo lsof -i:8000
# Kill the process:
sudo kill -9 <PID>
# Then restart:
pm2 restart python-api
```

### Issue 2: Missing Dependencies
```bash
cd /opt/petrodealhub/document-processor
source venv/bin/activate
pip install -r requirements.txt
```

### Issue 3: Missing .env File
```bash
cd /opt/petrodealhub/document-processor
ls -la .env
# If missing, create it with necessary variables
```

### Issue 4: Database Connection Error
Check logs for Supabase connection errors
May need to update .env with correct credentials

---

## Most Important: Check Logs First!

```bash
pm2 logs python-api --lines 50
```

This will tell you **exactly** what's wrong! 🔍
