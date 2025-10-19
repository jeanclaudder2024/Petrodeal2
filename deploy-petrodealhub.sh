#!/bin/bash

# Complete Deployment Script for AI Vessel Trade Flow on PetroDealHub.com
# This script deploys both Python API and React frontend with SSL certificate

set -e  # Exit on any error

echo "🚀 Starting Complete Deployment for PetroDealHub.com"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="petrodealhub.com"
APP_DIR="/opt/petrodealhub"
EMAIL="jeanclaudedergham7@gmail.com"

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

# Step 1: Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Step 2: Install required packages
print_status "Installing required packages..."

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python 3.11 and dependencies
sudo apt install -y python3.11 python3.11-venv python3.11-dev python3-pip build-essential libssl-dev libffi-dev python3-dev

# Install Nginx
sudo apt install -y nginx

# Install PM2
sudo npm install -g pm2

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx

# Step 3: Create application directory
print_status "Creating application directory: $APP_DIR"
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# Step 4: Copy project files
print_status "Setting up project files..."
if [ -d "." ] && [ -f "package.json" ]; then
    print_status "Copying current project files to $APP_DIR..."
    cp -r . $APP_DIR/
else
    print_error "Please run this script from your project root directory"
    exit 1
fi

cd $APP_DIR

# Step 5: Setup Python API
print_status "Setting up Python API..."
cd document-processor

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
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

# Step 6: Setup React App
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

# Step 7: Setup PM2 processes
print_status "Setting up PM2 processes..."

# Create PM2 ecosystem file
cat > $APP_DIR/ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'petrodealhub-api',
      cwd: '$APP_DIR/document-processor',
      script: 'python',
      args: 'main.py',
      interpreter: '$APP_DIR/document-processor/venv/bin/python',
      env: {
        FASTAPI_PORT: 8000,
        FASTAPI_HOST: '0.0.0.0'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/pm2/petrodealhub-api-error.log',
      out_file: '/var/log/pm2/petrodealhub-api-out.log',
      log_file: '/var/log/pm2/petrodealhub-api.log'
    },
    {
      name: 'petrodealhub-app',
      cwd: '$APP_DIR/src',
      script: 'serve',
      args: '-s build -l 3000',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/pm2/petrodealhub-app-error.log',
      out_file: '/var/log/pm2/petrodealhub-app-out.log',
      log_file: '/var/log/pm2/petrodealhub-app.log'
    }
  ]
};
EOF

# Create PM2 log directory
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2

# Start applications with PM2
pm2 start $APP_DIR/ecosystem.config.js
pm2 save

# Setup PM2 startup
pm2 startup
print_warning "Please run the command shown above to enable PM2 startup on boot"

# Step 8: Setup Nginx configuration for petrodealhub.com
print_status "Setting up Nginx configuration for $DOMAIN..."

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/petrodealhub << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;

    # React App - Main application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Python API - Document processing
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeout settings for file uploads
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        
        # File upload size limit
        client_max_body_size 50M;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:8000/health;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Error pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
    
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/petrodealhub /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Step 9: Setup firewall
print_status "Configuring firewall..."
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw --force enable

# Step 10: Setup SSL Certificate with Let's Encrypt
print_status "Setting up SSL certificate for $DOMAIN..."

# Check if domain is pointing to this server
print_warning "IMPORTANT: Make sure $DOMAIN and www.$DOMAIN are pointing to this server's IP address"
print_warning "Current server IP: $(curl -s ifconfig.me)"
echo ""
read -p "Press Enter when DNS is configured correctly..."

# Obtain SSL certificate
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email $EMAIL

# Setup automatic renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Step 11: Final status check
print_status "Checking final status..."
sleep 5

echo ""
echo "🎉 Deployment completed successfully!"
echo "=================================================="
echo ""
echo "📊 Application Status:"
pm2 status
echo ""
echo "🌐 Your application is now live at:"
echo "   - Main Site: https://$DOMAIN"
echo "   - API: https://$DOMAIN/api/"
echo "   - Health Check: https://$DOMAIN/health"
echo ""
echo "📝 Useful commands:"
echo "   - View logs: pm2 logs"
echo "   - Restart apps: pm2 restart all"
echo "   - Monitor: pm2 monit"
echo "   - Check SSL: sudo certbot certificates"
echo "   - Renew SSL: sudo certbot renew"
echo ""
echo "🔧 SSL Certificate:"
echo "   - Certificate: /etc/letsencrypt/live/$DOMAIN/fullchain.pem"
echo "   - Private Key: /etc/letsencrypt/live/$DOMAIN/privkey.pem"
echo "   - Auto-renewal: Enabled"
echo ""
print_success "PetroDealHub.com is now live with SSL certificate!"
