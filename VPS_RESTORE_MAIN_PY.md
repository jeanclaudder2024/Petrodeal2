# Fix Indentation Error - Restore main.py from Git

The `main.py` file on your VPS has been corrupted with incorrect indentation. The easiest fix is to restore it from git.

## Quick Fix

Run this on your VPS:

```bash
cd /opt/petrodealhub/document-processor

# Backup the broken file first
cp main.py main.py.broken.$(date +%Y%m%d_%H%M%S)

# Restore from git
git checkout HEAD -- main.py

# Verify it works
python -m py_compile main.py

# If syntax check passes, restart the API
pm2 restart python-api

# Verify API is running
curl http://localhost:8000/health
```

## Alternative: Manual Fix

If you can't restore from git, you need to check line 2350 and fix the indentation. The error says there's a `continue` statement with wrong indentation. 

Check what's actually on line 2350:
```bash
sed -n '2345,2355p' main.py
```

The correct structure around line 2350 should be:
- Line 2349: `logger.warning(...)` (inside the except block)
- Line 2350: Empty line
- Line 2351: `if update_data:` (aligned with the previous if statements)

If there's a `continue` statement, it shouldn't be there - remove it.
