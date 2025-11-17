# Quick VPS Update - Step by Step

## 🚀 Quick Update Commands

### Step 1: Update document-processor (Python API)
```bash
cd /opt/petrodealhub/document-processor
git pull origin master
sudo systemctl restart petrodealhub-api
```

### Step 2: Update main repository (Frontend)
```bash
cd /opt/petrodealhub
# Or wherever your main project is located
git pull origin main
```

### Step 3: Rebuild Frontend (if needed)
```bash
# If using Next.js/React
npm install
npm run build
# Or restart your frontend service
pm2 restart all
# Or
sudo systemctl restart your-frontend-service
```

### Step 4: Verify Everything Works
```bash
# Check API service
sudo systemctl status petrodealhub-api

# Check API logs
sudo journalctl -u petrodealhub-api -f --lines=50

# Test API endpoint
curl http://localhost:8000/health
```

## 📋 What Was Updated

### Backend (document-processor):
- ✅ Fixed placeholder replacement (handles split placeholders)
- ✅ Fixed CMS settings save (removed auth requirement)
- ✅ Added detailed logging for placeholder resolution
- ✅ Respects explicit CMS settings (doesn't override user choices)

### Frontend (VesselDocumentGenerator.tsx):
- ✅ Fixed display of template display_name
- ✅ Fixed display of template description
- ✅ Fixed display of plan information
- ✅ Improved locked template messaging

## 🔍 Quick Test

1. **Test API:**
   ```bash
   curl http://localhost:8000/templates
   ```

2. **Test CMS:**
   - Go to: `http://your-vps-ip:8000/cms/`
   - Edit a template
   - Save placeholder settings
   - Check browser console for success message

3. **Test Frontend:**
   - Go to vessel detail page
   - Check if templates show:
     - Display name (not just file name)
     - Description (if set)
     - Plan information
     - Locked button with upgrade message (if not in plan)

## ⚠️ If Something Goes Wrong

### API not starting?
```bash
cd /opt/petrodealhub/document-processor
python3 -m py_compile main.py  # Check for syntax errors
sudo journalctl -u petrodealhub-api -n 100  # Check logs
```

### Frontend not updating?
```bash
# Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
# Or hard refresh
```

### Database issues?
- Migrations should already be applied
- If needed, check: `VPS_UPDATE_INSTRUCTIONS.md` for migration details

## ✅ Done!

After running these commands, your VPS should be updated with all the latest fixes!

