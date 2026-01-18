# Fix Python Indentation Error at Line 2350

## Problem:
```
File "/opt/petrodealhub/document-processor/main.py", line 2350
    logger.warning(f"[permission-convert] Plan {idx}: EMPTY/NULL, skipping")
IndentationError: unexpected indent
```

## Solution Options:

### Option 1: Pull Latest Code from Git (Recommended)

If you have the code in a git repo:

```bash
cd /opt/petrodealhub
git stash  # Save any local changes
git pull   # Get latest code
cd document-processor
source venv/bin/activate
python main.py  # Test if it works
```

### Option 2: Check and Fix Indentation Manually

```bash
cd /opt/petrodealhub/document-processor

# Check syntax error
source venv/bin/activate
python -m py_compile main.py

# Check around line 2350
sed -n '2340,2360p' main.py | cat -A
# Look for tabs/spaces mixed - tabs show as ^I

# Or view with line numbers
sed -n '2340,2360p' main.py | nl -ba
```

### Option 3: Fix the Specific Line

The error is at line 2350. Open the file:

```bash
nano /opt/petrodealhub/document-processor/main.py
# Go to line 2350 (Ctrl+_ then type 2350)
```

Check:
1. **Is it indented correctly?** - Should match the block it's in
2. **Are there tabs mixed with spaces?** - Python requires consistent indentation
3. **Is there a missing closing block above it?** - Check the previous lines

The line should probably look like:
```python
                        logger.warning(f"[permission-convert] Plan {idx}: EMPTY/NULL, skipping")
```

### Option 4: Use Python's autopep8 to Fix

```bash
cd /opt/petrodealhub/document-processor
source venv/bin/activate
pip install autopep8
autopep8 --in-place --select=E117 main.py
python main.py  # Test
```

---

## Quick Test After Fix:

```bash
cd /opt/petrodealhub/document-processor
source venv/bin/activate
python main.py
# Should start without errors (press Ctrl+C to stop)
```

Then restart with PM2:
```bash
pm2 restart python-api
curl http://localhost:8000/health
```

---

## Common Causes:
1. **Mixed tabs and spaces** - Use only spaces (4 spaces per indent)
2. **Wrong indentation level** - Line should match its block
3. **Missing closing bracket/parenthesis above** - Check previous lines
4. **Copy-paste error** - Extra spaces at start of line
