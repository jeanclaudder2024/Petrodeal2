# Fix Indentation Error at Line 2350

## Problem:
```
File "/opt/petrodealhub/document-processor/main.py", line 2350
    logger.warning(f"[permission-convert] Plan {idx}: EMPTY/NULL, skipping")
IndentationError: unexpected indent
```

**This line is NOT in the git repo** - it was manually added with wrong indentation.

## Quick Fix: Remove the Bad Line

### Option 1: Remove the Line (Recommended)

```bash
cd /opt/petrodealhub/document-processor

# Backup first
cp main.py main.py.backup

# Remove the bad line
sed -i '/logger\.warning.*\[permission-convert\].*Plan.*EMPTY.*NULL.*skipping/d' main.py

# Check syntax
python -m py_compile main.py

# Test it works
python main.py
# Should start without errors (press Ctrl+C to stop)
```

### Option 2: Edit Manually and Remove It

```bash
cd /opt/petrodealhub/document-processor
nano main.py
# Go to line 2350 (Ctrl+_ then type 2350)
# Delete the line: logger.warning(f"[permission-convert] Plan {idx}: EMPTY/NULL, skipping")
# Save (Ctrl+O, Enter, Ctrl+X)
```

### Option 3: Pull Clean Version from Git

```bash
cd /opt/petrodealhub
git checkout document-processor/main.py
# This restores the file to git version (removes the bad line)
```

### Option 4: Check What's Different and Fix

```bash
cd /opt/petrodealhub/document-processor

# View line 2350
sed -n '2345,2355p' main.py

# View with line numbers
sed -n '2345,2355p' main.py | nl -ba -v 2345
```

**Line 2350 should be a blank line or properly indented code.**

---

## After Fixing:

```bash
# Check syntax
cd /opt/petrodealhub/document-processor
source venv/bin/activate
python -m py_compile main.py

# Test it starts
python main.py
# Should start without errors (press Ctrl+C to stop)

# Then restart with PM2
pm2 restart python-api
sleep 3
curl http://localhost:8000/health
```

---

## Quick One-Liner Fix:

```bash
cd /opt/petrodealhub/document-processor && \
cp main.py main.py.backup && \
sed -i '/logger\.warning.*\[permission-convert\].*Plan.*EMPTY.*NULL.*skipping/d' main.py && \
python -m py_compile main.py && \
echo "✅ Fixed! Now test: python main.py"
```
