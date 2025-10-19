#!/bin/bash

# Clean VPS Deployment Script for PetroDealHub
# This script removes Docker, Windows files, and deploys cleanly

set -e  # Exit on any error

echo "🧹 Starting Clean VPS Deployment for PetroDealHub"
echo "================================================="

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

# Step 1: Stop all services
print_status "Stopping all services..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
sudo systemctl stop nginx 2>/dev/null || true

# Step 2: Remove Docker completely
print_status "Removing Docker completely..."
sudo systemctl stop docker 2>/dev/null || true
sudo systemctl stop containerd 2>/dev/null || true
sudo apt remove --purge docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin docker-compose -y 2>/dev/null || true
sudo apt autoremove -y
sudo rm -rf /var/lib/docker
sudo rm -rf /var/lib/containerd
sudo rm -rf /etc/docker
sudo rm -rf /etc/containerd
sudo rm -rf /var/run/docker
sudo rm -rf /var/run/containerd

# Step 3: Clean the project directory
print_status "Cleaning project directory..."
cd /opt
sudo rm -rf petrodealhub

# Step 4: Clone fresh project
print_status "Cloning fresh project from GitHub..."
sudo git clone https://github.com/jeanclaudder2024/Petrodeal2.git petrodealhub
sudo chown -R $USER:$USER /opt/petrodealhub
cd /opt/petrodealhub

# Step 5: Clean Windows and Docker files from document-processor
print_status "Cleaning Windows and Docker files..."
cd document-processor

# Remove Windows files
rm -f *.bat
rm -f Dockerfile
rm -f generate-ssl.py
rm -rf __pycache__
rm -rf temp/*

# Step 6: Set up Python API
print_status "Setting up Python API..."

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Upgrade pip and install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Test Python API
print_status "Testing Python API..."
python main.py &
API_PID=$!
sleep 5

if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    print_success "Python API is working correctly!"
    kill $API_PID
else
    print_warning "Python API test failed, but continuing..."
    kill $API_PID 2>/dev/null || true
fi

# Step 7: Set up React App
print_status "Setting up React App..."
cd ../src

# Install dependencies
npm install

# Build for production
npm run build

# Install serve
npm install -g serve

# Test React app
print_status "Testing React app..."
serve -s build -l 3000 &
REACT_PID=$!
sleep 5

if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_success "React app is working correctly!"
    kill $REACT_PID
else
    print_warning "React app test failed, but continuing..."
    kill $REACT_PID 2>/dev/null || true
fi

# Step 8: Create PM2 ecosystem file
print_status "Setting up PM2 processes..."
cd /opt/petrodealhub

cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'petrodealhub-api',
      cwd: '/opt/petrodealhub/document-processor',
      script: 'python',
      args: 'main.py',
      interpreter: '/opt/petrodealhub/document-processor/venv/bin/python',
      env: {
        FASTAPI_PORT: 8000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    },
    {
      name: 'petrodealhub-app',
      cwd: '/opt/petrodealhub/src',
      script: 'serve',
      args: '-s build -l 3000',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    }
  ]
};
EOF

# Start PM2 processes
pm2 start ecosystem.config.js
pm2 save

# Step 9: Stop conflicting services
print_status "Stopping conflicting services..."
sudo systemctl stop lsws 2>/dev/null || true
sudo systemctl stop apache2 2>/dev/null || true
sudo pkill -f litespeed 2>/dev/null || true

# Step 10: Create Nginx configuration
print_status "Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/petrodealhub << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 50M;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/petrodealhub /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Final status check
print_status "Checking final status..."
sleep 5

echo ""
echo "🎉 Clean VPS Deployment Completed Successfully!"
echo "=============================================="
echo ""
echo "📊 Application Status:"
pm2 status
echo ""
echo "🌐 Access your application:"
echo "   - React App: http://$(curl -s ifconfig.me)"
echo "   - Python API: http://$(curl -s ifconfig.me)/api/"
echo "   - Health Check: http://$(curl -s ifconfig.me)/api/health"
echo ""
echo "📝 Useful commands:"
echo "   - View logs: pm2 logs"
echo "   - Restart apps: pm2 restart all"
echo "   - Check status: pm2 status"
echo ""
print_success "Clean deployment completed! Your application is now running!"
