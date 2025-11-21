# How to Add OpenAI API Key to .env and Deploy to VPS

## Step 1: Add OpenAI API Key to .env File

### Option A: Using PowerShell (Windows)

```powershell
# Navigate to document-processor directory
cd document-processor

# Check if .env exists
if (Test-Path .env) {
    Write-Host ".env file exists"
} else {
    Write-Host ".env file does not exist - creating from env.example"
    Copy-Item env.example .env
}

# Add OpenAI API key to .env file
$openaiKey = "sk-proj-YOUR-OPENAI-API-KEY-HERE"

# Check if OPENAI_API_KEY already exists
$envContent = Get-Content .env
if ($envContent -match "OPENAI_API_KEY") {
    # Replace existing key
    $envContent = $envContent -replace "OPENAI_API_KEY=.*", "OPENAI_API_KEY=$openaiKey"
    $envContent | Set-Content .env
    Write-Host "✅ Updated existing OPENAI_API_KEY in .env"
} else {
    # Add new key
    Add-Content .env "`n# OpenAI Configuration (for AI-powered random data generation)`nOPENAI_API_KEY=$openaiKey"
    Write-Host "✅ Added OPENAI_API_KEY to .env"
}

# Verify
Write-Host "`nVerifying .env file:"
Get-Content .env | Select-String "OPENAI"
```

### Option B: Manual Edit

1. Open `document-processor/.env` file in a text editor
2. Add or update this line:
   ```
   OPENAI_API_KEY=sk-proj-YOUR-OPENAI-API-KEY-HERE
   ```
3. Save the file

**⚠️ IMPORTANT**: The `.env` file is in `.gitignore`, so it won't be committed to git. This is good for security!

---

## Step 2: Push Updates to Git

### 1. Check what files changed:

```powershell
cd ..
git status
```

### 2. Add changed files:

```powershell
# Add all changes (except .env which is ignored)
git add document-processor/requirements.txt
git add document-processor/main.py
git add document-processor/cms/editor.js
git add document-processor/env.example
git add OPENAI_SETUP_INSTRUCTIONS.md
git add ADD_ENV_AND_DEPLOY.md
```

### 3. Commit changes:

```powershell
git commit -m "Add OpenAI integration for AI-powered random data generation in CMS"
```

### 4. Push to git:

```powershell
# Push document-processor submodule first
cd document-processor
git add .
git commit -m "Add OpenAI integration for AI random data generation"
git push origin master
cd ..

# Push main repository
git add document-processor
git commit -m "Update document-processor: Add OpenAI AI random data feature"
git push origin main
```

---

## Step 3: Deploy to VPS

### Quick Deployment Script

SSH into your VPS and run:

```bash
#!/bin/bash
# deploy-openai-update.sh

echo "🚀 Starting deployment with OpenAI integration..."

# Navigate to project
cd /path/to/aivessel-trade-flow-main

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Update submodule
echo "📦 Updating submodule..."
git submodule update --init --recursive
cd document-processor
git pull origin master
cd ..

# Install/update OpenAI package
echo "📦 Installing OpenAI package..."
cd document-processor
pip install openai==1.3.0
cd ..

# Add OpenAI API key to .env (if not exists)
echo "🔑 Adding OpenAI API key to .env..."
cd document-processor
if ! grep -q "OPENAI_API_KEY" .env 2>/dev/null; then
    echo "" >> .env
    echo "# OpenAI Configuration (for AI-powered random data generation)" >> .env
    echo "OPENAI_API_KEY=sk-proj-YOUR-OPENAI-API-KEY-HERE" >> .env
    echo "✅ Added OPENAI_API_KEY to .env"
else
    echo "⚠️  OPENAI_API_KEY already exists in .env"
fi
cd ..

# Restart service
echo "🔄 Restarting document-processor service..."
sudo systemctl restart document-processor
# OR if using PM2:
# pm2 restart document-processor

echo "✅ Deployment complete!"
echo ""
echo "🔍 Verifying deployment..."
sleep 2
curl http://localhost:8000/health | grep -i openai
```

### Manual Deployment Steps

1. **SSH into VPS:**
   ```bash
   ssh your-user@your-vps-ip
   ```

2. **Navigate to project:**
   ```bash
   cd /path/to/aivessel-trade-flow-main
   ```

3. **Pull latest changes:**
   ```bash
   git pull origin main
   git submodule update --init --recursive
   cd document-processor
   git pull origin master
   cd ..
   ```

4. **Install OpenAI package:**
   ```bash
   cd document-processor
   pip install openai==1.3.0
   # OR if using virtual environment:
   # source venv/bin/activate
   # pip install openai==1.3.0
   ```

5. **Add OpenAI API key to .env:**
   ```bash
   cd document-processor
   # Edit .env file
   nano .env
   # OR add directly:
   echo "" >> .env
   echo "# OpenAI Configuration" >> .env
   echo "OPENAI_API_KEY=sk-proj-YOUR-OPENAI-API-KEY-HERE" >> .env
   ```

6. **Restart service:**
   ```bash
   # If using systemd:
   sudo systemctl restart document-processor
   
   # OR if using PM2:
   pm2 restart document-processor
   
   # OR if running manually:
   # Find process:
   ps aux | grep "python.*main.py"
   # Kill it:
   kill <PID>
   # Restart:
   cd document-processor
   python main.py &
   ```

7. **Verify deployment:**
   ```bash
   # Check health endpoint
   curl http://localhost:8000/health
   
   # Should show:
   # "openai": "enabled"
   ```

---

## Step 4: Verify Everything Works

### 1. Check Service Status:
```bash
sudo systemctl status document-processor
# OR
pm2 status
```

### 2. Check Health Endpoint:
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "supabase": "connected",
  "openai": "enabled",
  ...
}
```

### 3. Test in CMS:
1. Open CMS: `http://your-vps-ip:8000/cms/`
2. Go to editor for any template
3. Select a placeholder
4. Choose "Random" source
5. Select "AI Generated (using OpenAI)" from dropdown
6. Save and test document generation

---

## Troubleshooting

### OpenAI Not Enabled After Deployment

**Check:**
```bash
# 1. Check if package is installed
pip list | grep openai

# 2. Check if API key is in .env
cat document-processor/.env | grep OPENAI

# 3. Check logs
sudo journalctl -u document-processor -f
# OR
pm2 logs document-processor
```

**Fix:**
```bash
# Install package
pip install openai==1.3.0

# Verify .env
cat document-processor/.env

# Restart service
sudo systemctl restart document-processor
```

### Service Won't Start

**Check logs:**
```bash
sudo journalctl -u document-processor -n 50
```

**Common issues:**
- Missing dependencies: `pip install -r requirements.txt`
- Port already in use: `lsof -i :8000`
- Permission issues: Check file permissions

---

## Quick Command Reference

```bash
# Local: Add to .env
cd document-processor
echo "OPENAI_API_KEY=sk-proj-..." >> .env

# Local: Push to git
git add .
git commit -m "Add OpenAI integration"
git push

# VPS: Pull and deploy
git pull && git submodule update
cd document-processor && pip install openai==1.3.0
echo "OPENAI_API_KEY=sk-proj-..." >> .env
sudo systemctl restart document-processor

# Verify
curl http://localhost:8000/health
```

---

**✅ Done!** Your OpenAI integration is now deployed and ready to use in the CMS!

