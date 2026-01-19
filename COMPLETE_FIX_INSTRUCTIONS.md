# Complete Fix Instructions: main.py Indentation Error

## 📋 Summary
Your VPS has an indentation error in `main.py` at line 2350. This guide will help you:
1. ✅ Fix the problem on your VPS
2. ✅ Push the fix scripts to GitHub

---

## 🚀 STEP 1: Fix on Your VPS

### Option A: Quick One-Line Command (Copy-Paste This)

**On your VPS, copy and paste this entire command:**

```bash
cd /opt/petrodealhub/document-processor && cp main.py main.py.broken.$(date +%Y%m%d_%H%M%S) && git checkout HEAD -- main.py && source venv/bin/activate && python -m py_compile main.py && pm2 restart python-api && sleep 3 && curl http://localhost:8000/health || echo "API not responding - check logs: pm2 logs python-api --err --lines 50"
```

### Option B: Step-by-Step Commands (If Option A Doesn't Work)

**On your VPS, run these commands one by one:**

```bash
# 1. Navigate to document-processor directory
cd /opt/petrodealhub/document-processor

# 2. Backup current file
cp main.py main.py.broken.$(date +%Y%m%d_%H%M%S)

# 3. Restore from git (this fixes the indentation error)
git checkout HEAD -- main.py

# 4. Activate virtual environment
source venv/bin/activate

# 5. Verify syntax
python -m py_compile main.py

# 6. Restart API with PM2
pm2 restart python-api

# 7. Wait a few seconds
sleep 3

# 8. Test if API is working
curl http://localhost:8000/health

# 9. If API is not working, check logs
pm2 logs python-api --err --lines 50
```

### ✅ Verify It's Fixed

After running the commands, check:

1. **API responds:**
   ```bash
   curl http://localhost:8000/health
   ```
   Should return `{"status":"healthy"}` or similar.

2. **CMS loads in browser:**
   - Open your CMS URL
   - Should load without 502 error

3. **PM2 shows API as online:**
   ```bash
   pm2 status
   ```
   `python-api` should show as `online`.

---

## 📤 STEP 2: Push Fix Scripts to GitHub

### On Your Local Machine (Windows):

**Open PowerShell or Git Bash, then run:**

```powershell
# 1. Navigate to project directory
cd "d:\ia oile project prop\aivessel-trade-flow-main"

# 2. Check what files need to be added
git status

# 3. Add the VPS fix scripts
git add VPS_FIX_MAIN_PY_COMPLETE.sh
git add VPS_RESTORE_MAIN_PY.sh
git add VPS_RESTORE_MAIN_PY.md
git add VPS_VERIFY_AND_CHECK.sh
git add VPS_CHECK_API_LOGS_NOW.md
git add VPS_FIX_AND_PUSH_GITHUB.md
git add VPS_QUICK_FIX_COMMAND.txt
git add COMPLETE_FIX_INSTRUCTIONS.md

# 4. Commit the changes
git commit -m "Add VPS fix scripts for main.py indentation error"

# 5. Push to GitHub
git push origin main
```

**Or if your branch is `master`:**

```powershell
git push origin master
```

---

## 🔍 Troubleshooting

### If API Still Won't Start on VPS:

1. **Check PM2 logs:**
   ```bash
   pm2 logs python-api --err --lines 50
   ```

2. **Try starting manually to see the error:**
   ```bash
   cd /opt/petrodealhub/document-processor
   source venv/bin/activate
   python main.py
   ```
   Press `Ctrl+C` to stop after seeing the error.

3. **Check if file was restored correctly:**
   ```bash
   cd /opt/petrodealhub/document-processor
   git status
   # Should show "nothing to commit, working tree clean"
   ```

4. **Check if port 8000 is in use:**
   ```bash
   netstat -tulpn | grep 8000
   ```

### If Git Push Fails:

1. **Pull latest changes first:**
   ```powershell
   git pull origin main
   ```

2. **Resolve any conflicts, then push again:**
   ```powershell
   git push origin main
   ```

3. **If you need to force push (be careful!):**
   ```powershell
   git push origin main --force
   ```

---

## ✅ Success Checklist

- [ ] VPS: `main.py` restored from git
- [ ] VPS: Syntax check passed (`python -m py_compile main.py`)
- [ ] VPS: API restarted with PM2
- [ ] VPS: `curl http://localhost:8000/health` returns success
- [ ] VPS: CMS loads in browser without 502 error
- [ ] Local: Fix scripts added and committed
- [ ] Local: Changes pushed to GitHub

---

## 📝 Notes

- The fix restores `main.py` to the last committed version in git, removing any local modifications
- Your broken file is backed up as `main.py.broken.[timestamp]` before restoration
- If you had important local changes, you can check the backup file

---

## 🆘 Need Help?

If you're still having issues:

1. **Share the PM2 error logs:**
   ```bash
   pm2 logs python-api --err --lines 50
   ```

2. **Share the manual startup error:**
   ```bash
   cd /opt/petrodealhub/document-processor
   source venv/bin/activate
   python main.py
   ```

3. **Check if git is up to date on VPS:**
   ```bash
   cd /opt/petrodealhub/document-processor
   git pull origin master
   ```
