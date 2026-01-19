# How to Get Scripts from GitHub to Your VPS

The fix scripts have been pushed to GitHub. Here are **3 easy ways** to get them on your VPS:

---

## Method 1: Pull from Git (Easiest - If you have the repo cloned)

**If your VPS already has the main project cloned, just pull:**

```bash
# Navigate to your main project directory on VPS
cd /opt/petrodealhub

# Pull the latest changes from GitHub
git pull origin main

# Now the scripts will be in the root directory
ls -la VPS_*.sh

# Run the fix script
chmod +x VPS_FIX_MAIN_PY_COMPLETE.sh
./VPS_FIX_MAIN_PY_COMPLETE.sh
```

---

## Method 2: Download Script Directly from GitHub (Quick)

**Download and run the fix script directly:**

```bash
# Navigate to where you want to save the script
cd /opt/petrodealhub/document-processor

# Download the fix script from GitHub
curl -O https://raw.githubusercontent.com/jeanclaudder2024/Petrodeal2/main/VPS_FIX_MAIN_PY_COMPLETE.sh

# Make it executable
chmod +x VPS_FIX_MAIN_PY_COMPLETE.sh

# Run it
./VPS_FIX_MAIN_PY_COMPLETE.sh
```

**Or download to a specific location:**

```bash
# Download to /opt/petrodealhub
cd /opt/petrodealhub
curl -O https://raw.githubusercontent.com/jeanclaudder2024/Petrodeal2/main/VPS_FIX_MAIN_PY_COMPLETE.sh
chmod +x VPS_FIX_MAIN_PY_COMPLETE.sh
./VPS_FIX_MAIN_PY_COMPLETE.sh
```

---

## Method 3: Clone Repository to Temp Location (If you don't have it)

**If you don't have the repo on your VPS, clone it temporarily:**

```bash
# Create a temp directory
mkdir -p /tmp/vps-fix
cd /tmp/vps-fix

# Clone just to get the script (or clone full repo if needed)
git clone https://github.com/jeanclaudder2024/Petrodeal2.git

# Copy the script to where you need it
cp Petrodeal2/VPS_FIX_MAIN_PY_COMPLETE.sh /opt/petrodealhub/document-processor/

# Navigate and run
cd /opt/petrodealhub/document-processor
chmod +x VPS_FIX_MAIN_PY_COMPLETE.sh
./VPS_FIX_MAIN_PY_COMPLETE.sh

# Clean up temp directory (optional)
rm -rf /tmp/vps-fix
```

---

## 🚀 Recommended: Method 2 (Download Directly)

**Copy and paste this complete command on your VPS:**

```bash
cd /opt/petrodealhub/document-processor && curl -O https://raw.githubusercontent.com/jeanclaudder2024/Petrodeal2/main/VPS_FIX_MAIN_PY_COMPLETE.sh && chmod +x VPS_FIX_MAIN_PY_COMPLETE.sh && ./VPS_FIX_MAIN_PY_COMPLETE.sh
```

This will:
1. ✅ Download the script
2. ✅ Make it executable
3. ✅ Run it automatically to fix your problem

---

## 📋 All Available Scripts on GitHub

You can download any of these scripts using the same method:

```bash
# Main fix script (recommended)
curl -O https://raw.githubusercontent.com/jeanclaudder2024/Petrodeal2/main/VPS_FIX_MAIN_PY_COMPLETE.sh

# Alternative restore script
curl -O https://raw.githubusercontent.com/jeanclaudder2024/Petrodeal2/main/VPS_RESTORE_MAIN_PY.sh

# Verification script
curl -O https://raw.githubusercontent.com/jeanclaudder2024/Petrodeal2/main/VPS_VERIFY_AND_CHECK.sh
```

**After downloading, make executable and run:**
```bash
chmod +x VPS_FIX_MAIN_PY_COMPLETE.sh
./VPS_FIX_MAIN_PY_COMPLETE.sh
```

---

## 🔧 Alternative: If GitHub URL Doesn't Work

If you get a 404 error, the repository might be private or the branch name might be different. Try:

1. **Check your actual repository URL:**
   ```bash
   # Replace 'main' with 'master' if that's your branch
   curl -O https://raw.githubusercontent.com/jeanclaudder2024/Petrodeal2/master/VPS_FIX_MAIN_PY_COMPLETE.sh
   ```

2. **Or use git pull if you have the repo:**
   ```bash
   cd /opt/petrodealhub
   git pull origin main
   # or
   git pull origin master
   ```

---

## ✅ Verify Script Downloaded Correctly

After downloading, verify the script:

```bash
# Check if file exists
ls -lh VPS_FIX_MAIN_PY_COMPLETE.sh

# View first few lines to confirm it downloaded
head -20 VPS_FIX_MAIN_PY_COMPLETE.sh

# Check it's executable
ls -l VPS_FIX_MAIN_PY_COMPLETE.sh
# Should show: -rwxr-xr-x (x = executable)
```

---

## 📝 Quick Summary

**Easiest way - Copy this to your VPS:**

```bash
cd /opt/petrodealhub/document-processor && curl -O https://raw.githubusercontent.com/jeanclaudder2024/Petrodeal2/main/VPS_FIX_MAIN_PY_COMPLETE.sh && chmod +x VPS_FIX_MAIN_PY_COMPLETE.sh && ./VPS_FIX_MAIN_PY_COMPLETE.sh
```

That's it! The script will automatically fix your problem. 🎉
