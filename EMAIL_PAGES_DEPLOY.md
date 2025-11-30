# 📧 Email Pages Deployment Guide

## ✅ Files Added to Admin Panel

The following email system pages have been added to the admin panel:

1. **Email Configuration** (`src/pages/admin/EmailConfiguration.tsx`)
   - SMTP configuration
   - IMAP configuration
   - Email settings

2. **Email Templates** (`src/pages/admin/EmailTemplates.tsx`)
   - Create and manage email templates
   - Placeholder system

3. **Auto-Reply System** (`src/pages/admin/AutoReplySystem.tsx`)
   - AI-powered auto-reply
   - Email sync and control

## 📍 Where to Find Them

In the Admin Panel, you'll see 3 new tabs:
- **Email Config** (Mail icon)
- **Email Templates** (Send icon)
- **Auto-Reply** (Inbox icon)

## 🚀 Deploy to VPS

### Step 1: Pull Latest Code

```bash
cd /opt/petrodealhub
git pull origin main
```

### Step 2: Rebuild Frontend

```bash
npm install
npm run build
```

### Step 3: Restart Services

```bash
pm2 restart all
```

### Step 4: Clear Browser Cache

1. Open your browser
2. Press `Ctrl+Shift+Delete`
3. Clear cache
4. Hard refresh: `Ctrl+F5`

## ✅ Verification

After deployment, go to Admin Panel and you should see:
- Email Config tab
- Email Templates tab
- Auto-Reply tab

If you don't see them:
1. Check browser console for errors
2. Verify files exist: `ls -la src/pages/admin/Email*.tsx`
3. Check AdminPanel imports: `grep -i email src/components/admin/AdminPanel.tsx`

## 📁 Related Files

- `src/utils/emailService.ts` - Email utilities
- `document-processor/email_service.py` - Backend email service
- `supabase/migrations/20250127000000_email_system.sql` - Database tables

---

**All files have been committed and pushed to GitHub!** ✅

