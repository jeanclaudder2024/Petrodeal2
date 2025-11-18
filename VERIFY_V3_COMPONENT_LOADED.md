# How to Verify v3.0 Component is Loaded

## ✅ What You Should See:

### 1. **Visual Markers on Page:**
- 🔴 **Red border** (5px solid red) around the entire document section
- 🔴 **Red banner** at the top: "🚨 NEW VERSION v3.0 LOADED - OLD COMPONENT REMOVED! 🚨"
- 🟡 **Yellow banner**: "✅ This is the UPDATED VesselDocumentGenerator component!"
- 🟡 **Yellow background** for the entire section

### 2. **Browser Console Logs:**
Open browser console (F12) and look for:
```
🚨🚨🚨 VesselDocumentGenerator v3.0 FORCE RELOAD - NEW VERSION LOADED 🚨🚨🚨
   Component Version: v3.0-FORCE-RELOAD
   vesselImo: [your IMO]
   vesselName: [vessel name]
   If you see this, the NEW component is working!
```

Plus a styled red console message:
```
🚨 NEW COMPONENT v3.0 LOADED! 🚨
```

### 3. **Network Tab:**
- API call to: `https://petrodealhub.com/api/templates`
- Status: 200 OK
- Response: `{templates: Array(4)}`

## ❌ If You DON'T See These:

### Old Component Still Showing:
1. **Check if you see the console logs** - If NO console logs with "v3.0", the old component is loaded
2. **Check the build on VPS:**
   ```bash
   cd /opt/petrodealhub
   grep "v3.0-FORCE-RELOAD" dist/assets/*.js
   ```
   - If NO output → Build didn't include new code
   - If output found → Browser cache issue

3. **Force browser cache clear:**
   - Chrome: `Ctrl+Shift+Delete` → Clear cached images and files
   - Or: `Ctrl+Shift+R` (hard refresh)
   - Or: Open in Incognito mode

### If Build Doesn't Have v3.0:
```bash
cd /opt/petrodealhub

# Pull latest
git pull origin main

# Verify source has v3.0
grep "v3.0-FORCE-RELOAD" src/components/VesselDocumentGenerator.tsx
# Should show output

# Clean rebuild
rm -rf dist node_modules/.vite .vite .cache
npm run build

# Verify build has v3.0
grep "v3.0-FORCE-RELOAD" dist/assets/*.js
# MUST show output!

# Restart nginx
sudo systemctl restart nginx
```

## 🔍 Quick Check Commands:

```bash
# On VPS - Check if source has v3.0
grep -n "v3.0-FORCE-RELOAD" src/components/VesselDocumentGenerator.tsx

# On VPS - Check if build has v3.0
grep -l "v3.0-FORCE-RELOAD" dist/assets/*.js

# On VPS - Check VesselDetail import
grep -A 3 "File Download Section" src/pages/VesselDetail.tsx
```

## 📸 What to Report:

If still not working, please provide:
1. ✅ Do you see the red border and banners? (Yes/No)
2. ✅ Do you see the console logs with "v3.0"? (Yes/No)
3. ✅ Output of: `grep "v3.0-FORCE-RELOAD" dist/assets/*.js` on VPS
4. ✅ Screenshot of the page (if possible)

