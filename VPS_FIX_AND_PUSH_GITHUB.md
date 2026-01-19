# Complete Fix: main.py Indentation Error + Push to GitHub

This guide will help you:
1. Fix the `main.py` indentation error on your VPS
2. Push the fix scripts to GitHub

---

## Step 1: Fix the Problem on Your VPS

### Option A: Use the Complete Fix Script (Recommended)

1. **Copy the script to your VPS:**

   On your **local machine**, you should have the file `VPS_FIX_MAIN_PY_COMPLETE.sh`.

2. **On your VPS, run:**

   ```bash
   cd /opt/petrodealhub/document-processor
   
   # Download and run the fix script
   # (You can copy-paste the script content, or upload it via scp)
   
   # Make it executable
   chmod +x VPS_FIX_MAIN_PY_COMPLETE.sh
   
   # Run it
   ./VPS_FIX_MAIN_PY_COMPLETE.sh
   ```

### Option B: Run Commands Manually

If you prefer to run commands manually, execute these on your VPS:

```bash
cd /opt/petrodealhub/document-processor

# 1. Backup current file
cp main.py main.py.broken.$(date +%Y%m%d_%H%M%S)

# 2. Restore from git
git checkout HEAD -- main.py

# 3. Activate venv and verify syntax
source venv/bin/activate
python -m py_compile main.py

# 4. Restart API
pm2 restart python-api

# 5. Wait a few seconds
sleep 3

# 6. Test API
curl http://localhost:8000/health

# 7. Check logs if not working
pm2 logs python-api --err --lines 50
```

---

## Step 2: Push Fix Scripts to GitHub

### On Your Local Machine:

1. **Navigate to your project directory:**

   ```bash
   cd "D:\ia oile project prop\aivessel-trade-flow-main"
   ```

2. **Check what files need to be added:**

   ```bash
   git status
   ```

3. **Add the fix scripts:**

   ```bash
   git add VPS_FIX_MAIN_PY_COMPLETE.sh
   git add VPS_RESTORE_MAIN_PY.sh
   git add VPS_RESTORE_MAIN_PY.md
   git add VPS_VERIFY_AND_CHECK.sh
   git add VPS_CHECK_API_LOGS_NOW.md
   git add VPS_FIX_AND_PUSH_GITHUB.md
   ```

4. **Commit the changes:**

   ```bash
   git commit -m "Add VPS fix scripts for main.py indentation error"
   ```

5. **Push to GitHub:**

   ```bash
   git push origin main
   ```

   Or if your branch is `master`:
   
   ```bash
   git push origin master
   ```

---

## Step 3: Verify Everything Works

### On Your VPS:

1. **Check API is running:**
   ```bash
   curl http://localhost:8000/health
   ```

2. **Check PM2 status:**
   ```bash
   pm2 status
   ```

3. **Test CMS in browser:**
   - Open your CMS URL
   - Should load without 502 error

---

## Troubleshooting

### If API Still Won't Start:

1. **Check PM2 logs:**
   ```bash
   pm2 logs python-api --err --lines 50
   ```

2. **Try starting manually:**
   ```bash
   cd /opt/petrodealhub/document-processor
   source venv/bin/activate
   python main.py
   ```
   This will show you the exact error.

3. **Check if port 8000 is in use:**
   ```bash
   netstat -tulpn | grep 8000
   ```

4. **Check file permissions:**
   ```bash
   ls -la main.py
   ```

### If Git Push Fails:

1. **Check your branch:**
   ```bash
   git branch
   ```

2. **Pull latest changes first:**
   ```bash
   git pull origin main
   ```

3. **Resolve conflicts if any, then push again**

---

## Summary

✅ **On VPS:** Run the fix script to restore `main.py` and restart the API  
✅ **On Local:** Add, commit, and push the fix scripts to GitHub  
✅ **Verify:** Check that API is responding and CMS loads correctly
