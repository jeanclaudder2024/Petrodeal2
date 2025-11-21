# OpenAI AI-Powered Random Data Setup

## ✅ What Was Added

1. **OpenAI Integration**: Added OpenAI API support for AI-powered random data generation
2. **New Random Option**: Added "AI Generated" option in CMS editor for placeholders
3. **Smart Fallback**: If OpenAI is unavailable, falls back to standard random data generation

## 🔧 Setup Instructions

### 1. Install OpenAI Package

```bash
cd document-processor
pip install openai==1.3.0
# OR
pip install -r requirements.txt
```

### 2. Add API Key to Environment

Create or edit `.env` file in `document-processor/` directory:

```bash
# Add this line to your .env file:
OPENAI_API_KEY=sk-proj-YOUR-OPENAI-API-KEY-HERE
```

**⚠️ IMPORTANT**: 
- Never commit `.env` file to git (it's already in .gitignore)
- Keep your API key secure
- The API key provided is already added to the code, but you should add it to `.env` for production

### 3. Restart the Service

After adding the API key, restart the document-processor service:

```bash
# If using systemd:
sudo systemctl restart document-processor

# OR if using PM2:
pm2 restart document-processor

# OR if running manually:
# Stop the current process and restart
```

### 4. Verify Setup

Check the health endpoint to verify OpenAI is enabled:

```bash
curl http://localhost:8000/health
```

You should see:
```json
{
  "status": "healthy",
  "supabase": "connected",
  "openai": "enabled",
  ...
}
```

## 🎯 How to Use in CMS

1. **Open CMS Editor**: Navigate to `/cms/editor.html?template_id=<template_id>`

2. **Select Placeholder**: Click on any placeholder in the list

3. **Choose Source**: Select "Random" as the data source

4. **Select Random Mode**: In the "Random Mode" dropdown, you'll see three options:
   - **Auto** (different per vessel) - Standard random data, varies by vessel IMO
   - **Fixed** (same for all vessels) - Same random value for all vessels
   - **AI Generated** (using OpenAI) - ✨ **NEW!** Uses AI to generate realistic, context-aware data

5. **Save Settings**: Click "Save Settings" to apply

## 🤖 How AI Generation Works

When "AI Generated" is selected:
- The system uses OpenAI GPT-3.5-turbo to generate realistic values
- AI considers the placeholder name and context (vessel IMO if available)
- Generates professional, industry-appropriate data for oil trading/maritime documents
- Falls back to standard random data if OpenAI is unavailable or errors occur

## 📝 Example Use Cases

### Good for AI Generation:
- Company names
- Contact person names
- Addresses
- Descriptions
- Reference numbers
- Professional emails

### Better with Standard Random:
- Dates (formatted consistently)
- Percentages (specific ranges)
- Currency amounts (specific formats)
- Reference codes (specific patterns)

## 🔍 Troubleshooting

### OpenAI Not Enabled

**Check:**
1. Is `openai` package installed? `pip list | grep openai`
2. Is `OPENAI_API_KEY` set in `.env`?
3. Is the API key valid?

**Fix:**
```bash
# Install package
pip install openai==1.3.0

# Check .env file
cat document-processor/.env | grep OPENAI

# Restart service
sudo systemctl restart document-processor
```

### AI Generation Fails

The system automatically falls back to standard random data generation if:
- OpenAI API is unavailable
- API key is invalid
- Rate limits are exceeded
- Network errors occur

Check logs for details:
```bash
sudo journalctl -u document-processor -f
# OR
pm2 logs document-processor
```

## 💰 Cost Considerations

- OpenAI GPT-3.5-turbo is used (cost-effective)
- Each placeholder generates ~100 tokens
- Typical document: 10-50 placeholders = ~1000-5000 tokens
- Cost: ~$0.001-0.005 per document generation

Monitor usage at: https://platform.openai.com/usage

## 🔒 Security Notes

- API key is stored in `.env` file (not committed to git)
- API key is loaded from environment variables only
- Never hardcode API keys in source code
- Rotate API keys regularly

## ✅ Verification Checklist

- [ ] OpenAI package installed
- [ ] API key added to `.env` file
- [ ] Service restarted
- [ ] Health endpoint shows `"openai": "enabled"`
- [ ] CMS editor shows "AI Generated" option
- [ ] Test generation works with AI option selected

---

**Need Help?** Check the logs first, then verify all configuration is correct.

