# Fix Document Processor Service on VPS

## Problem
The `document-processor.service` doesn't exist. You need to either:
1. Find the existing service name, OR
2. Create the systemd service

## Solution 1: Check Existing Services

Run these commands on your VPS to find the actual service name:

```bash
# Check all systemd services
sudo systemctl list-units --type=service | grep -i "python\|api\|document\|petrodeal"

# Check PM2 processes (if using PM2)
pm2 list

# Check running Python processes
ps aux | grep "python.*main.py"

# Check what's listening on port 8000
sudo lsof -i :8000
```

## Solution 2: Create Systemd Service

If no service exists, create one:

### Step 1: Create Service File

```bash
sudo nano /etc/systemd/system/document-processor.service
```

### Step 2: Paste This Content

```ini
[Unit]
Description=Petrodealhub Document Processor API
After=network.target
Wants=network.target

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=/opt/petrodealhub/document-processor
Environment=PATH=/opt/petrodealhub/document-processor/venv/bin:/usr/local/bin:/usr/bin:/bin
ExecStart=/opt/petrodealhub/document-processor/venv/bin/python main.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=document-processor

# Security settings
NoNewPrivileges=true
PrivateTmp=true

# Resource limits
LimitNOFILE=65536
MemoryMax=1G

[Install]
WantedBy=multi-user.target
```

### Step 3: Save and Enable

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable document-processor

# Start the service
sudo systemctl start document-processor

# Check status
sudo systemctl status document-processor
```

## Solution 3: Quick Restart (If Service Exists with Different Name)

Try these common service names:

```bash
# Try python-api
sudo systemctl restart python-api

# Try petrodealhub-api
sudo systemctl restart petrodealhub-api

# Try petrodealhub-cms
sudo systemctl restart petrodealhub-cms
```

## Solution 4: Manual Restart (If No Systemd Service)

If the service doesn't exist, manually restart:

```bash
# Find and kill existing process
ps aux | grep "python.*main.py" | grep -v grep | awk '{print $2}' | xargs kill -9

# Start manually in background
cd /opt/petrodealhub/document-processor
source venv/bin/activate
nohup python main.py > /tmp/document-processor.log 2>&1 &

# Or use PM2
pm2 restart petrodealhub-api
# OR
pm2 restart python-api
```

## Verify It's Working

```bash
# Check if API is responding
curl http://localhost:8000/health

# Check service status
sudo systemctl status document-processor

# Check logs
sudo journalctl -u document-processor -f
```

## Recommended: Use the Service Creation Script

I'll create a script to set this up automatically. Run:

```bash
cd /opt/petrodealhub
# After pulling latest code
chmod +x create-document-processor-service.sh
sudo bash create-document-processor-service.sh
```

