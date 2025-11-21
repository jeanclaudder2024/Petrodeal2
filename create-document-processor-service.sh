#!/bin/bash
# Create systemd service for document-processor
# Usage: sudo bash create-document-processor-service.sh

set -e

echo "🔧 Creating document-processor systemd service"
echo "=============================================="

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run as root (use sudo)"
   exit 1
fi

# Determine project directory
PROJECT_DIR="/opt/petrodealhub"
if [ ! -d "$PROJECT_DIR" ]; then
    PROJECT_DIR="$HOME/aivessel-trade-flow-main"
fi

if [ ! -d "$PROJECT_DIR/document-processor" ]; then
    echo "❌ Error: document-processor directory not found!"
    echo "   Expected: $PROJECT_DIR/document-processor"
    exit 1
fi

DOC_PROC_DIR="$PROJECT_DIR/document-processor"
VENV_PYTHON="$DOC_PROC_DIR/venv/bin/python"

# Check if venv exists
if [ ! -f "$VENV_PYTHON" ]; then
    echo "❌ Error: Virtual environment not found!"
    echo "   Expected: $VENV_PYTHON"
    echo "   Please create venv first: cd $DOC_PROC_DIR && python3 -m venv venv"
    exit 1
fi

# Create service file
SERVICE_FILE="/etc/systemd/system/document-processor.service"

echo "📝 Creating service file: $SERVICE_FILE"

cat > "$SERVICE_FILE" << EOF
[Unit]
Description=Petrodealhub Document Processor API
After=network.target
Wants=network.target

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=$DOC_PROC_DIR
Environment=PATH=$DOC_PROC_DIR/venv/bin:/usr/local/bin:/usr/bin:/bin
ExecStart=$VENV_PYTHON main.py
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
EOF

# Set permissions
chmod 644 "$SERVICE_FILE"

# Reload systemd
echo "🔄 Reloading systemd daemon..."
systemctl daemon-reload

# Enable service
echo "✅ Enabling service to start on boot..."
systemctl enable document-processor.service

# Check if service is already running (from PM2 or manual start)
echo "🛑 Stopping any existing processes on port 8000..."
lsof -ti:8000 | xargs kill -9 2>/dev/null || true

# Start service
echo "▶️  Starting document-processor service..."
systemctl start document-processor.service

# Wait a moment
sleep 3

# Check status
echo ""
echo "📊 Service Status:"
echo "=================="
systemctl status document-processor.service --no-pager -l

# Test API
echo ""
echo "🧪 Testing API..."
sleep 2
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ API is responding correctly!"
else
    echo "⚠️  API test failed, but service may still be starting..."
    echo "   Check logs: sudo journalctl -u document-processor -f"
fi

echo ""
echo "✅ Service created and started!"
echo ""
echo "📝 Useful commands:"
echo "   - Status: sudo systemctl status document-processor"
echo "   - Logs: sudo journalctl -u document-processor -f"
echo "   - Restart: sudo systemctl restart document-processor"
echo "   - Stop: sudo systemctl stop document-processor"
echo ""

