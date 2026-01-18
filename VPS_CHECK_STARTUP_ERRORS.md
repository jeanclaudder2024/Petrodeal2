# Check What's Preventing API from Starting

## Problem:
- PM2 shows `python-api` as "online"
- But `curl http://localhost:8000/health` fails
- API crashes immediately after starting

## Step 1: Check PM2 Logs for Actual Error

```bash
# Check error logs
pm2 logs python-api --err --lines 50 --nostream

# Check all logs
pm2 logs python-api --lines 100 --nostream
```

**Look for:**
- Import errors (missing packages)
- Environment variable errors
- Database connection errors
- Port already in use
- Any Python traceback errors

## Step 2: Try Starting Manually to See Errors

```bash
cd /opt/petrodealhub/document-processor
source venv/bin/activate
python main.py
```

This will show you **exactly** what error prevents the API from starting.

**Common errors you might see:**

### Error 1: Missing Environment Variables
```
Error: SUPABASE_URL not found
```
**Fix:** Check `.env` file exists and has required variables

### Error 2: Database Connection Failed
```
Error: Could not connect to Supabase
```
**Fix:** Check Supabase credentials in `.env`

### Error 3: Port 8000 Already in Use
```
Error: Address already in use
```
**Fix:** `sudo lsof -i:8000` then kill the process

### Error 4: Missing Dependencies
```
ImportError: No module named 'xxx'
```
**Fix:** `pip install -r requirements.txt`

## Step 3: Check if .env File Exists

```bash
cd /opt/petrodealhub/document-processor
ls -la .env
cat .env | grep -E "SUPABASE|DATABASE"  # Don't show full content for security
```

## Step 4: Verify Python Syntax

```bash
cd /opt/petrodealhub/document-processor
source venv/bin/activate
python -m py_compile main.py
```

If no errors, syntax is OK. Problem is runtime (missing files, env vars, etc.)

---

## Most Important: Run This Command

```bash
cd /opt/petrodealhub/document-processor
source venv/bin/activate
python main.py 2>&1 | head -50
```

**This will show the exact error!** 🔍

Then share the error output so we can fix it.
