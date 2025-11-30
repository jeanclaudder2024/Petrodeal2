# 📧 Email System Documentation

## Overview

Complete SMTP/IMAP email integration system with email templates, placeholders, and AI-powered auto-reply functionality.

## Features

### ✅ SMTP Integration
- Configure SMTP server for sending emails
- Support for TLS/SSL encryption
- Test connection functionality
- From email and name configuration
- Auto-reply enable/disable

### ✅ IMAP Integration
- Configure IMAP server for receiving emails
- Automatic email syncing
- Configurable check interval
- TLS/SSL support
- Auto-reply enable/disable

### ✅ Email Templates
- Create reusable email templates
- Support for placeholders ({{variable_name}})
- Template categories
- Preview functionality
- Active/Inactive status

### ✅ Placeholder System
Available placeholders:
- **Author/User**: `{{author_name}}`, `{{user_email}}`, `{{member_id}}`
- **Manuscript**: `{{manuscript_title}}`, `{{manuscript_id}}`, `{{submission_id}}`, `{{doi}}`, `{{status}}`
- **Review**: `{{reviewer_name}}`, `{{review_link}}`, `{{deadline}}`, `{{decision}}`
- **Payment**: `{{amount}}`, `{{currency}}`, `{{invoice_number}}`, `{{transaction_id}}`, `{{payment_method}}`
- **Support**: `{{support_subject}}`, `{{support_id}}`, `{{ticket_url}}`
- **System**: `{{current_date}}`, `{{current_year}}`, `{{platform_name}}`, `{{platform_url}}`

### ✅ Auto-Reply System
- AI-powered automatic email responses
- Keyword-based rules
- Template-based responses
- Custom response options
- Priority-based rule matching
- Email sync and processing

## Files Created

### Frontend Components
1. **`src/pages/admin/EmailConfiguration.tsx`**
   - SMTP configuration interface
   - IMAP configuration interface
   - Connection testing

2. **`src/pages/admin/EmailTemplates.tsx`**
   - Template management
   - Placeholder insertion
   - Template preview
   - CRUD operations

3. **`src/pages/admin/AutoReplySystem.tsx`**
   - Auto-reply rule management
   - AI reply generation
   - Email sync interface
   - Incoming email display

4. **`src/utils/emailService.ts`**
   - Email sending utilities
   - Placeholder replacement
   - Template processing
   - Bulk email support

### Backend Services
1. **`document-processor/email_service.py`**
   - SMTP email sending
   - IMAP email receiving
   - AI reply generation
   - Placeholder replacement

### Database
1. **`supabase/migrations/20250127000000_email_system.sql`**
   - Email configurations table
   - Email templates table
   - Email logs table
   - Incoming emails table
   - Auto-reply rules table

## Setup Instructions

### 1. Run Database Migration

```bash
# Apply the migration to your Supabase database
# Via Supabase Dashboard or CLI:
supabase migration up
```

### 2. Configure Environment Variables

Add to your `.env` file:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Add API Endpoints to Backend

Add these routes to your FastAPI backend (`document-processor/main.py`):

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
    # Fetch template from database
    # Return template data
    pass
```

### 4. Install Python Dependencies

Add to `document-processor/requirements.txt`:
```
openai>=1.0.0
```

Then install:
```bash
cd document-processor
pip install -r requirements.txt
```

## Usage

### 1. Configure SMTP

1. Go to Admin Panel → Email Config
2. Fill in SMTP settings:
   - Host: `smtp.hostinger.com`
   - Port: `587`
   - Username: Your email
   - Password: Your email password
   - Enable TLS: Yes
   - From Email: Your email
   - From Name: Your company name
3. Click "Test Connection"
4. Click "Save Configuration"

### 2. Configure IMAP

1. Go to Admin Panel → Email Config → IMAP tab
2. Fill in IMAP settings:
   - Host: `imap.hostinger.com`
   - Port: `993`
   - Username: Your email
   - Password: Your email password
   - Enable TLS: Yes
   - Check Interval: 5 (minutes)
3. Click "Test Connection"
4. Click "Save Configuration"

### 3. Create Email Templates

1. Go to Admin Panel → Email Templates
2. Click "Create Template"
3. Fill in:
   - Template Name
   - Subject (use placeholders like `{{author_name}}`)
   - Body (use placeholders)
   - Category
4. Click placeholders to insert them
5. Click "Create Template"

### 4. Set Up Auto-Reply

1. Go to Admin Panel → Auto-Reply
2. Enable "AI Auto-Reply"
3. Click "Sync Emails" to fetch incoming emails
4. For each email, click "AI Reply" to generate and send auto-reply

## Example Email Template

**Subject:**
```
Welcome to {{platform_name}}!
```

**Body:**
```
Dear {{author_name}},

Welcome to {{platform_name}}! Your account has been created successfully.

Member ID: {{member_id}}
Email: {{user_email}}

Date: {{current_date}}
Year: {{current_year}}

Visit us at: {{platform_url}}

Best regards,
{{platform_name}} Team
```

## API Usage Examples

### Send Email with Template

```typescript
import { sendEmailWithTemplate } from '@/utils/emailService';

await sendEmailWithTemplate(
  'template-id-here',
  'user@example.com',
  {
    author_name: 'John Doe',
    member_id: 'MEM-12345',
    user_email: 'john@example.com'
  }
);
```

### Send Custom Email

```typescript
import { sendEmail } from '@/utils/emailService';

await sendEmail({
  to: 'user@example.com',
  subject: 'Custom Subject',
  body: 'Email body with {{platform_name}}',
  placeholders: {
    platform_name: 'PetroDealHub'
  }
});
```

## Security Notes

- Passwords are stored in database (should be encrypted in production)
- Use environment variables for sensitive data
- RLS policies restrict access to admin users only
- Email logs are stored for audit purposes

## Troubleshooting

### SMTP Connection Fails
- Check firewall settings
- Verify credentials
- Try different port (465 for SSL, 587 for TLS)
- Check if email provider allows SMTP

### IMAP Sync Not Working
- Verify IMAP is enabled in email settings
- Check credentials
- Ensure port 993 (SSL) or 143 (TLS) is open
- Check email provider IMAP settings

### AI Replies Not Generating
- Verify OpenAI API key is set
- Check API quota/limits
- Review error logs

## Next Steps

1. Run database migration
2. Configure SMTP/IMAP settings
3. Create email templates
4. Test email sending
5. Set up auto-reply rules
6. Monitor email logs

---

**Created:** January 27, 2025
**Version:** 1.0.0

