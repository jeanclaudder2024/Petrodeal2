# 🚀 VPS Deployment Guide - Email System

## ✅ Changes Pushed to GitHub

Complete SMTP/IMAP email system with:
- Email configuration (SMTP/IMAP)
- Email templates with placeholders
- AI-powered auto-reply system
- Backend email service

## 📋 Deployment Steps

### Step 1: SSH into VPS

```bash
ssh your-username@your-vps-ip
```

### Step 2: Navigate to Project

```bash
cd /opt/petrodealhub
# OR your project directory
```

### Step 3: Pull Latest Changes

```bash
git pull origin main
```

### Step 4: Run Database Migration

```bash
# Apply email system migration to Supabase
# Option 1: Via Supabase Dashboard
# - Go to SQL Editor
# - Run the migration file: supabase/migrations/20250127000000_email_system.sql

# Option 2: Via Supabase CLI (if installed)
supabase migration up
```

### Step 5: Install Python Dependencies

```bash
cd document-processor
source venv/bin/activate  # or: python3 -m venv venv && source venv/bin/activate
pip install openai
pip install -r requirements.txt
cd ..
```

### Step 6: Add Email API Endpoints to Backend

Edit `document-processor/main.py` and add these routes:

```python
from email_service import EmailService

@app.post("/api/email/test-smtp")
async def test_smtp(config: dict):
    result = EmailService.test_smtp_connection(config)
    return result

@app.post("/api/email/test-imap")
async def test_imap(config: dict):
    result = EmailService.test_imap_connection(config)
    return result

@app.post("/api/email/send")
async def send_email(email_data: dict):
    result = EmailService.send_email(
        to=email_data.get('to'),
        subject=email_data.get('subject'),
        body=email_data.get('body'),
        from_email=email_data.get('from_email'),
        from_name=email_data.get('from_name'),
        template_id=email_data.get('template_id'),
        placeholders=email_data.get('placeholders')
    )
    return result

@app.post("/api/email/sync-imap")
async def sync_imap():
    result = EmailService.sync_imap_emails()
    return result

@app.post("/api/email/ai-reply")
async def ai_reply(email_data: dict):
    result = EmailService.generate_ai_reply(email_data)
    return result

@app.get("/api/email/templates/{template_id}")
async def get_template(template_id: str):
    # Fetch from Supabase
    result = supabase.table('email_templates').select('*').eq('id', template_id).execute()
    if result.data:
        return result.data[0]
    return {"error": "Template not found"}
```

### Step 7: Update Environment Variables

Add to `.env` file:

```bash
# In document-processor/.env
OPENAI_API_KEY=your_openai_api_key_here
```

### Step 8: Rebuild Frontend

```bash
npm install
npm run build
```

### Step 9: Restart Services

```bash
# Restart PM2 processes
pm2 restart all

# OR if using systemd
sudo systemctl restart document-processor
sudo systemctl restart petrodealhub-frontend
```

### Step 10: Reload Nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 🔍 Verification

### 1. Check Database Tables

Verify tables were created:
- `email_configurations`
- `email_templates`
- `email_logs`
- `incoming_emails`
- `auto_reply_rules`

### 2. Test Email Configuration

1. Go to Admin Panel → Email Config
2. Configure SMTP settings
3. Click "Test Connection"
4. Should show "Connection Successful"

### 3. Test Email Templates

1. Go to Admin Panel → Email Templates
2. Create a test template
3. Use placeholders like `{{platform_name}}`
4. Preview should show replaced values

### 4. Test Auto-Reply

1. Go to Admin Panel → Auto-Reply
2. Enable "AI Auto-Reply"
3. Click "Sync Emails"
4. Test with an incoming email

## 📝 Quick Deployment Command

```bash
cd /opt/petrodealhub && \
git pull origin main && \
cd document-processor && \
source venv/bin/activate && \
pip install openai && \
cd .. && \
npm install && \
npm run build && \
pm2 restart all && \
sudo systemctl reload nginx
```

## 🐛 Troubleshooting

### Migration Fails
- Check Supabase connection
- Verify SQL syntax
- Check RLS policies

### Email Service Not Working
- Verify OpenAI API key is set
- Check SMTP/IMAP credentials
- Review backend logs: `pm2 logs petrodealhub-api`

### Frontend Not Loading
- Check build completed: `npm run build`
- Verify dist folder exists
- Check browser console for errors

### API Endpoints Not Found
- Verify routes added to `main.py`
- Restart backend service
- Check API base URL in frontend

## 📚 Documentation

See `EMAIL_SYSTEM_DOCUMENTATION.md` for:
- Complete feature list
- API usage examples
- Placeholder reference
- Security notes

---

**Ready to Deploy!** 🚀

