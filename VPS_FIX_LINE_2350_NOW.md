# Fix Line 2350 Indentation Error - Step by Step

The git restore worked but there's still a syntax error. Let's fix it manually.

---

## Option 1: Quick Fix - Download and Run Diagnostic Script

**On your VPS, run:**

```bash
cd /opt/petrodealhub/document-processor && curl -O https://raw.githubusercontent.com/jeanclaudder2024/Petrodeal2/main/VPS_DIAGNOSE_AND_FIX_LINE_2350.sh && chmod +x VPS_DIAGNOSE_AND_FIX_LINE_2350.sh && ./VPS_DIAGNOSE_AND_FIX_LINE_2350.sh
```

This will:
1. Show what's on line 2350
2. Fix it automatically
3. Verify syntax

---

## Option 2: Manual Fix - Remove Bad Line

**On your VPS, run these commands:**

```bash
cd /opt/petrodealhub/document-processor

# 1. Show what's on line 2350
echo "Current line 2350:"
sed -n '2350p' main.py | cat -A
echo ""
echo "Lines 2348-2352:"
sed -n '2348,2352p' main.py | cat -n

# 2. Backup
cp main.py main.py.before_fix.$(date +%Y%m%d_%H%M%S)

# 3. Remove any continue statement on line 2350 (replace with empty line)
sed -i '2350s/.*/                /' main.py

# 4. Verify it's fixed
echo ""
echo "Fixed line 2350:"
sed -n '2350p' main.py | cat -A

# 5. Check syntax
source venv/bin/activate
python3 -m py_compile main.py || python -m py_compile main.py

# 6. If syntax check passes, restart API
pm2 restart python-api
sleep 3
curl http://localhost:8000/health
```

---

## Option 3: Check What's Actually Wrong

**First, let's see what's on line 2350:**

```bash
cd /opt/petrodealhub/document-processor

# Show the problematic area
sed -n '2345,2355p' main.py | cat -n

# Show with special characters visible
sed -n '2345,2355p' main.py | cat -A

# Check git status
git status

# Check if there are local changes
git diff main.py | head -50
```

This will show you exactly what's wrong, then you can fix it.

---

## Option 4: Use Python 3 Explicitly

**The issue might be the Python version check. Try:**

```bash
cd /opt/petrodealhub/document-processor

# Download the python3 fix script
curl -O https://raw.githubusercontent.com/jeanclaudder2024/Petrodeal2/main/VPS_USE_PYTHON3_TO_FIX.sh
chmod +x VPS_USE_PYTHON3_TO_FIX.sh
./VPS_USE_PYTHON3_TO_FIX.sh
```

---

## Quick Command - Try This First

**Copy and paste this complete command to your VPS:**

```bash
cd /opt/petrodealhub/document-processor && sed -n '2345,2355p' main.py | cat -n && echo "---" && sed -n '2350p' main.py | cat -A && cp main.py main.py.fix_backup && sed -i '2350s/.*/                /' main.py && source venv/bin/activate && python3 -m py_compile main.py && echo "✅ Syntax OK" && pm2 restart python-api && sleep 3 && curl http://localhost:8000/health || echo "Check logs: pm2 logs python-api --err --lines 50"
```

This will:
1. Show lines 2345-2355
2. Show line 2350 with special chars
3. Backup the file
4. Fix line 2350 (make it empty)
5. Check syntax with python3
6. Restart API
7. Test it

---

## If Still Not Working

Run this to get more details:

```bash
cd /opt/petrodealhub/document-processor
source venv/bin/activate

# Show exact error
python3 -m py_compile main.py 2>&1 | head -20

# Show line 2350 in context
sed -n '2348,2352p' main.py | cat -n -A
```

Then share the output so we can fix it properly.
