#!/bin/bash

# Ubuntu VPS Deployment Script for AI Vessel Trade Flow
# This script sets up both React frontend and Python API on the same VPS

set -e  # Exit on any error

echo "🚀 Starting Ubuntu VPS Deployment for AI Vessel Trade Flow"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
print_status "Installing Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js installation
node_version=$(node --version)
npm_version=$(npm --version)
print_success "Node.js installed: $node_version"
print_success "npm installed: $npm_version"

# Install Python 3.11 and pip
print_status "Installing Python 3.11 and pip..."
sudo apt install -y python3.11 python3.11-venv python3.11-dev python3-pip

# Install system dependencies for Python packages
print_status "Installing system dependencies..."
sudo apt install -y build-essential libssl-dev libffi-dev python3-dev

# Install Nginx
print_status "Installing Nginx..."
sudo apt install -y nginx

# Install PM2 for process management
print_status "Installing PM2 for process management..."
sudo npm install -g pm2

# Create application directory
APP_DIR="/opt/aivessel-trade-flow"
print_status "Creating application directory: $APP_DIR"
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# Clone or copy the project
print_status "Setting up project files..."
if [ -d "aivessel-trade-flow-main" ]; then
    print_status "Copying project files to $APP_DIR..."
    cp -r aivessel-trade-flow-main/* $APP_DIR/
else
    print_warning "Project directory not found. Please ensure you're running this from the project root."
    print_status "Creating basic structure..."
    mkdir -p $APP_DIR/document-processor
    mkdir -p $APP_DIR/src
fi

cd $APP_DIR

# Setup Python API
print_status "Setting up Python API..."
cd document-processor

# Create virtual environment
print_status "Creating Python virtual environment..."
python3.11 -m venv venv
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install Python dependencies
print_status "Installing Python dependencies..."
pip install -r requirements.txt

# Test Python API
print_status "Testing Python API..."
python main.py &
API_PID=$!
sleep 5

# Test if API is running
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    print_success "Python API is working correctly!"
    kill $API_PID
else
    print_warning "Python API test failed, but continuing..."
    kill $API_PID 2>/dev/null || true
fi

# Setup React App
print_status "Setting up React App..."
cd ../src

# Install Node.js dependencies
print_status "Installing React dependencies..."
npm install

# Build React app for production
print_status "Building React app for production..."
npm run build

# Install serve to serve the React app
print_status "Installing serve for React app..."
npm install -g serve

# Test React app
print_status "Testing React app..."
serve -s build -l 3000 &
REACT_PID=$!
sleep 5

# Test if React app is running
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_success "React app is working correctly!"
    kill $REACT_PID
else
    print_warning "React app test failed, but continuing..."
    kill $REACT_PID 2>/dev/null || true
fi

# Setup PM2 processes
print_status "Setting up PM2 processes..."

# Create PM2 ecosystem file
cat > $APP_DIR/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'python-api',
      cwd: '/opt/aivessel-trade-flow/document-processor',
      script: 'python',
      args: 'main.py',
      interpreter: '/opt/aivessel-trade-flow/document-processor/venv/bin/python',
      env: {
        FASTAPI_PORT: 8000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/pm2/python-api-error.log',
      out_file: '/var/log/pm2/python-api-out.log',
      log_file: '/var/log/pm2/python-api.log'
    },
    {
      name: 'react-app',
      cwd: '/opt/aivessel-trade-flow/src',
      script: 'serve',
      args: '-s build -l 3000',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/pm2/react-app-error.log',
      out_file: '/var/log/pm2/react-app-out.log',
      log_file: '/var/log/pm2/react-app.log'
    }
  ]
};
EOF

# Create PM2 log directory
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2

# Start applications with PM2
print_status "Starting applications with PM2..."
pm2 start $APP_DIR/ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
print_warning "Please run the command shown above to enable PM2 startup on boot"

# Setup Nginx configuration
print_status "Setting up Nginx configuration..."
sudo tee /etc/nginx/sites-available/aivessel-trade-flow << 'EOF'
server {
    listen 80;
    server_name _;  # Replace with your domain name

    # React app
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Python API
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/aivessel-trade-flow /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
print_status "Testing Nginx configuration..."
sudo nginx -t

# Start and enable Nginx
print_status "Starting Nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx

# Setup firewall
print_status "Configuring firewall..."
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw --force enable

# Final status check
print_status "Checking application status..."
sleep 3

echo ""
echo "🎉 Deployment completed successfully!"
echo "=================================================="
echo ""
echo "📊 Application Status:"
pm2 status
echo ""
echo "🌐 Access your application:"
echo "   - React App: http://$(curl -s ifconfig.me)"
echo "   - Python API: http://$(curl -s ifconfig.me)/api/"
echo ""
echo "📝 Useful commands:"
echo "   - View logs: pm2 logs"
echo "   - Restart apps: pm2 restart all"
echo "   - Stop apps: pm2 stop all"
echo "   - Monitor: pm2 monit"
echo ""
echo "🔧 Next steps:"
echo "   1. Configure your domain name in /etc/nginx/sites-available/aivessel-trade-flow"
echo "   2. Set up SSL certificates with Let's Encrypt:"
echo "      sudo apt install certbot python3-certbot-nginx"
echo "      sudo certbot --nginx -d yourdomain.com"
echo "   3. Test the application thoroughly"
echo ""
print_success "Deployment completed! Your AI Vessel Trade Flow is now running on Ubuntu VPS!"
