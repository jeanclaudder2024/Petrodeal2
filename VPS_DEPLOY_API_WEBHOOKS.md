# VPS Deployment Guide - API & Webhooks System

## Domain: https://petrodealhub.com/

### Quick Deployment Steps

#### 1. SSH into your VPS
```bash
ssh root@your-vps-ip
```

#### 2. Navigate to project directory
```bash
cd /opt/petrodealhub
```

#### 3. Pull latest changes
```bash
git pull origin main
```

#### 4. Install Python dependency (aiohttp for webhooks)
```bash
cd document-processor
pip install aiohttp==3.9.1
cd ..
```

#### 5. Rebuild frontend
```bash
npm install
npm run build
```

#### 6. Restart services
```bash
pm2 restart all
```

#### 7. Check service status
```bash
pm2 status
pm2 logs --lines 50
```

### Database Migration (CRITICAL!)

**You MUST run the database migration in Supabase:**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor**
4. Copy and paste the contents of `supabase/migrations/20250128000000_api_webhooks.sql`
5. Click **Run**

Or use Supabase CLI:
```bash
supabase db push
```

### Verify Deployment

1. **Check API & Webhooks page:**
   - Visit: https://petrodealhub.com/admin#api-webhooks
   - You should see the new "API & Webhooks" tab

2. **Test API endpoint:**
   ```bash
   # First, generate an API key from the admin panel
   # Then test:
   curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://petrodealhub.com/api/v1/vessels
   ```

3. **Check backend logs:**
   ```bash
   pm2 logs python-api --lines 100
   ```

### Troubleshooting

#### If frontend doesn't update:
```bash
# Clear build cache and rebuild
rm -rf dist
npm run build
sudo systemctl restart nginx  # If using nginx
```

#### If backend errors:
```bash
# Check Python dependencies
cd document-processor
pip list | grep aiohttp

# Restart backend
pm2 restart python-api
pm2 logs python-api
```

#### If database migration fails:
- Check Supabase logs for errors
- Ensure you have admin permissions
- Verify RLS policies are correct

### One-Line Deployment (if script is uploaded)

```bash
chmod +x VPS_DEPLOY_API_WEBHOOKS.sh && ./VPS_DEPLOY_API_WEBHOOKS.sh
```

### Files Changed
- ✅ Database migration: `supabase/migrations/20250128000000_api_webhooks.sql`
- ✅ Frontend: `src/pages/admin/ApiWebhooks.tsx`
- ✅ Backend: `document-processor/main.py` (API endpoints added)
- ✅ Admin Panel: Added API & Webhooks tab
- ✅ Sidebar: Added navigation link

### Next Steps After Deployment

1. ✅ Run database migration
2. ✅ Generate your first API key from Admin Panel
3. ✅ Create a test webhook
4. ✅ Test API endpoints with your API key
5. ✅ Verify webhook delivery logs

---

**Need help?** Check PM2 logs: `pm2 logs`

