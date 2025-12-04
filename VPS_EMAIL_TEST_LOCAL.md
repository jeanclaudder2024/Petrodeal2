# Email Testing on VPS - Using Python Backend Locally

## Overview

The email configuration test now uses your **Python backend locally on your VPS** instead of requiring Supabase Edge Functions. This is more reliable and faster since it runs on the same server.

## How It Works

When you click "Test Connection" in the Email Configuration page:

1. **First**: Tries to use your Python backend at `/api/email/test-smtp` or `/api/email/test-imap`
   - ✅ Fast (runs locally)
   - ✅ No external dependencies
   - ✅ Works even if Supabase Edge Functions are unavailable

2. **Fallback**: If Python backend is not running, automatically uses Supabase Edge Function
   - Acts as a backup option
   - Works for development/testing

## Requirements

Your Python backend already has these endpoints built-in:
- `POST /api/email/test-smtp` - Test SMTP connection
- `POST /api/email/test-imap` - Test IMAP connection

Just make sure your **Python backend is running** on port 8000.

## Verify Backend is Running

```bash
# Check if backend is running
curl http://localhost:8000/health

# Should return: {"status": "healthy"}
```

## Start Backend if Needed

**Option 1: Using systemd (Recommended for VPS)**
```bash
sudo systemctl start python-api.service
sudo systemctl status python-api.service
```

**Option 2: Using PM2**
```bash
cd document-processor
pm2 start main.py --name email-api --interpreter python3 -- -m uvicorn main:app --host 0.0.0.0 --port 8000
pm2 save
```

**Option 3: Manual start (Development)**
```bash
cd document-processor
source venv/bin/activate
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

## Benefits

✅ **Faster** - No network latency to Supabase  
✅ **More reliable** - No dependency on Supabase Edge Functions  
✅ **Local control** - All processing happens on your VPS  
✅ **Automatic fallback** - Still works if backend is down (uses Supabase)

## Configuration

The frontend automatically detects which method to use. No configuration needed!

The API URL is configured via:
- Environment variable: `VITE_API_URL` (defaults to `/api`)
- Nginx proxy should route `/api/*` to `http://localhost:8000/*`

## Testing

1. Make sure Python backend is running
2. Go to Admin Panel → Email Configuration
3. Fill in SMTP/IMAP settings
4. Click "Test Connection"
5. Should see: "✅ Using Python backend (VPS)" in browser console

## Troubleshooting

**Backend not found?**
- Check if backend is running: `curl http://localhost:8000/health`
- Check nginx config routes `/api/*` to backend
- Check firewall allows port 8000

**Still using Supabase?**
- Backend might not be reachable from frontend
- Check browser console for errors
- Verify `VITE_API_URL` environment variable

