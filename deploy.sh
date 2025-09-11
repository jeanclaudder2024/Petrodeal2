#!/bin/bash

# Deployment script for Ubuntu server
# Make this file executable: chmod +x deploy.sh

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="aivessel-trade-flow"
APP_DIR="/var/www/$APP_NAME"
NGINX_CONFIG="/etc/nginx/sites-available/$APP_NAME"
DOMAIN="your-domain.com"  # Change this to your actual domain

echo -e "${GREEN}🚀 Starting deployment for $APP_NAME${NC}"

# Function to print status
print_status() {
    echo -e "${YELLOW}📋 $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y
print_success "System updated"

# Install Node.js if not installed
if ! command -v node &> /dev/null; then
    print_status "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    print_success "Node.js installed"
else
    print_success "Node.js already installed: $(node --version)"
fi

# Install PM2 if not installed
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2..."
    sudo npm install -g pm2
    print_success "PM2 installed"
else
    print_success "PM2 already installed"
fi

# Install Nginx if not installed
if ! command -v nginx &> /dev/null; then
    print_status "Installing Nginx..."
    sudo apt install nginx -y
    sudo systemctl start nginx
    sudo systemctl enable nginx
    print_success "Nginx installed and started"
else
    print_success "Nginx already installed"
fi

# Create application directory
print_status "Setting up application directory..."
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR
print_success "Application directory ready"

# Copy project files (assuming script is run from project root)
print_status "Copying project files..."
cp -r . $APP_DIR/
cd $APP_DIR
print_success "Project files copied"

# Install dependencies
print_status "Installing dependencies..."
npm install
print_success "Dependencies installed"

# Copy environment file
if [ -f ".env.production" ]; then
    print_status "Setting up environment variables..."
    cp .env.production .env
    print_success "Environment variables configured"
else
    print_error "Warning: .env.production file not found"
fi

# Build the application
print_status "Building application..."
npm run build
print_success "Application built successfully"

# Configure Nginx
print_status "Configuring Nginx..."
sudo tee $NGINX_CONFIG > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    root $APP_DIR/dist;
    index index.html;
    
    # Handle client-side routing
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg)\$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
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
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
EOF

# Enable the site
sudo ln -sf $NGINX_CONFIG /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
print_success "Nginx configured and reloaded"

# Configure firewall
print_status "Configuring firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
print_success "Firewall configured"

# Create update script
print_status "Creating update script..."
sudo tee $APP_DIR/update.sh > /dev/null <<EOF
#!/bin/bash
set -e

echo "🔄 Updating $APP_NAME..."

cd $APP_DIR

# Pull latest changes (if using git)
if [ -d ".git" ]; then
    git pull origin main
fi

# Install dependencies
npm install

# Build application
npm run build

# Reload Nginx
sudo systemctl reload nginx

echo "✅ Update completed!"
EOF

chmod +x $APP_DIR/update.sh
print_success "Update script created"

print_success "🎉 Deployment completed successfully!"
echo ""
echo -e "${GREEN}Your application is now available at:${NC}"
echo -e "${YELLOW}http://$DOMAIN${NC}"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "1. Update DNS records to point $DOMAIN to this server"
echo "2. Install SSL certificate: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo "3. Test your application"
echo ""
echo -e "${GREEN}Useful commands:${NC}"
echo "- Update app: $APP_DIR/update.sh"
echo "- Check Nginx: sudo systemctl status nginx"
echo "- View logs: sudo tail -f /var/log/nginx/error.log"
echo "- Check disk space: df -h"