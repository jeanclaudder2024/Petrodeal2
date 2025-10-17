#!/bin/bash

# Setup systemd services for AI Vessel Trade Flow
# This script installs and configures systemd services for both Python API and React app

set -e

echo "🔧 Setting up systemd services for AI Vessel Trade Flow"
echo "======================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root (use sudo)"
   exit 1
fi

# Get the current user (non-root user)
CURRENT_USER=$(logname)
if [ -z "$CURRENT_USER" ]; then
    CURRENT_USER="ubuntu"
fi

print_status "Setting up services for user: $CURRENT_USER"

# Update service files with correct user
print_status "Updating service files with correct user..."
sed -i "s/User=ubuntu/User=$CURRENT_USER/g" systemd-services/python-api.service
sed -i "s/Group=ubuntu/Group=$CURRENT_USER/g" systemd-services/python-api.service
sed -i "s/User=ubuntu/User=$CURRENT_USER/g" systemd-services/react-app.service
sed -i "s/Group=ubuntu/Group=$CURRENT_USER/g" systemd-services/react-app.service

# Copy service files to systemd directory
print_status "Installing systemd service files..."
cp systemd-services/python-api.service /etc/systemd/system/
cp systemd-services/react-app.service /etc/systemd/system/

# Set proper permissions
chmod 644 /etc/systemd/system/python-api.service
chmod 644 /etc/systemd/system/react-app.service

# Reload systemd daemon
print_status "Reloading systemd daemon..."
systemctl daemon-reload

# Enable services to start on boot
print_status "Enabling services to start on boot..."
systemctl enable python-api.service
systemctl enable react-app.service

# Start services
print_status "Starting services..."
systemctl start python-api.service
systemctl start react-app.service

# Wait a moment for services to start
sleep 5

# Check service status
print_status "Checking service status..."
echo ""
echo "📊 Service Status:"
echo "=================="

# Python API service
if systemctl is-active --quiet python-api.service; then
    print_success "Python API service is running"
else
    print_error "Python API service failed to start"
    echo "Service logs:"
    journalctl -u python-api.service --no-pager -n 10
fi

# React App service
if systemctl is-active --quiet react-app.service; then
    print_success "React App service is running"
else
    print_error "React App service failed to start"
    echo "Service logs:"
    journalctl -u react-app.service --no-pager -n 10
fi

echo ""
echo "🎉 Systemd services setup completed!"
echo "====================================="
echo ""
echo "📝 Useful commands:"
echo "   - Check status: systemctl status python-api react-app"
echo "   - View logs: journalctl -u python-api -f"
echo "   - Restart services: systemctl restart python-api react-app"
echo "   - Stop services: systemctl stop python-api react-app"
echo "   - Disable services: systemctl disable python-api react-app"
echo ""
echo "🌐 Your applications should now be accessible at:"
echo "   - React App: http://$(curl -s ifconfig.me)"
echo "   - Python API: http://$(curl -s ifconfig.me)/api/"
echo ""
print_success "Services are now configured to start automatically on boot!"
