#!/bin/bash

# Fix SSL Certificate Deployment for AI Vessel Trade Flow
# This script resolves SSL certificate issues and port conflicts

set -e  # Exit on any error

echo "🔧 Fixing SSL Certificate Deployment Issues"
echo "=========================================="

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

# Step 1: Check for port conflicts
print_status "Checking for port conflicts..."

# Check if port 8000 is being used by Docker or other services
if sudo lsof -i :8000 > /dev/null 2>&1; then
    print_warning "Port 8000 is already in use. Checking what's using it..."
    sudo lsof -i :8000
    
    # Check if it's Docker
    if sudo lsof -i :8000 | grep -q docker; then
        print_warning "Docker is using port 8000. Stopping conflicting containers..."
        sudo docker ps | grep :8000 | awk '{print $1}' | xargs -r sudo docker stop
    fi
    
    # Check if it's another Python process
    if sudo lsof -i :8000 | grep -q python; then
        print_warning "Another Python process is using port 8000. Stopping it..."
        sudo pkill -f "python.*main.py" || true
    fi
else
    print_success "Port 8000 is available"
fi

# Check if port 3000 is being used
if sudo lsof -i :3000 > /dev/null 2>&1; then
    print_warning "Port 3000 is already in use. Checking what's using it..."
    sudo lsof -i :3000
else
    print_success "Port 3000 is available"
fi

# Step 2: Stop all services to avoid conflicts
print_status "Stopping all services to avoid conflicts..."

# Stop PM2 processes
pm2 stop all 2>/dev/null || true

# Stop Nginx
sudo systemctl stop nginx 2>/dev/null || true

# Step 3: Install Certbot if not installed
print_status "Installing Certbot for SSL certificates..."
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# Step 4: Get domain name from user
echo ""
print_status "SSL Certificate Setup"
echo "========================"
echo "Please provide your domain name (e.g., yourdomain.com)"
read -p "Enter your domain name: " DOMAIN_NAME

if [ -z "$DOMAIN_NAME" ]; then
    print_error "Domain name is required for SSL certificate setup"
    exit 1
fi

# Step 5: Update Nginx configuration with domain name
print_status "Updating Nginx configuration with domain name: $DOMAIN_NAME"

# Create SSL-enabled Nginx configuration
sudo tee /etc/nginx/sites-available/aivessel-trade-flow << EOF
# HTTP server - redirect to HTTPS
server {
    listen 80;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;
    
    # Redirect all HTTP traffic to HTTPS
    return 301 https://\$server_name\$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;

    # SSL Configuration (will be updated by Certbot)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_session_tickets off;
    
    # HSTS (HTTP Strict Transport Security)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' https: data: blob: 'unsafe-inline'" always;

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

# Step 6: Enable the site
print_status "Enabling Nginx site..."
sudo ln -sf /etc/nginx/sites-available/aivessel-trade-flow /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Step 7: Test Nginx configuration
print_status "Testing Nginx configuration..."
sudo nginx -t

# Step 8: Start Nginx
print_status "Starting Nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx

# Step 9: Get SSL certificate
print_status "Getting SSL certificate for $DOMAIN_NAME..."
print_warning "Make sure your domain $DOMAIN_NAME points to this server's IP address!"

# Get SSL certificate with Nginx plugin
sudo certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME --non-interactive --agree-tos --email admin@$DOMAIN_NAME

# Step 10: Start PM2 processes
print_status "Starting PM2 processes..."
pm2 start /opt/aivessel-trade-flow/ecosystem.config.js

# Step 11: Save PM2 configuration
pm2 save

# Step 12: Test SSL certificate
print_status "Testing SSL certificate..."
sleep 5

# Test HTTP redirect
if curl -I http://$DOMAIN_NAME 2>/dev/null | grep -q "301\|302"; then
    print_success "HTTP to HTTPS redirect is working"
else
    print_warning "HTTP to HTTPS redirect might not be working"
fi

# Test HTTPS
if curl -I https://$DOMAIN_NAME 2>/dev/null | grep -q "200"; then
    print_success "HTTPS is working correctly"
else
    print_warning "HTTPS might not be working correctly"
fi

# Step 13: Set up automatic certificate renewal
print_status "Setting up automatic certificate renewal..."
sudo crontab -l 2>/dev/null | grep -v certbot | sudo crontab -
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -

# Final status check
print_status "Checking final status..."
sleep 3

echo ""
echo "🎉 SSL Certificate Setup Completed!"
echo "=================================="
echo ""
echo "📊 Application Status:"
pm2 status
echo ""
echo "🌐 Access your application:"
echo "   - HTTP (redirects to HTTPS): http://$DOMAIN_NAME"
echo "   - HTTPS: https://$DOMAIN_NAME"
echo "   - API: https://$DOMAIN_NAME/api/"
echo "   - Health Check: https://$DOMAIN_NAME/api/health"
echo ""
echo "📝 Useful commands:"
echo "   - View logs: pm2 logs"
echo "   - Restart apps: pm2 restart all"
echo "   - Check SSL certificate: sudo certbot certificates"
echo "   - Test SSL: curl -I https://$DOMAIN_NAME"
echo ""
echo "🔧 Troubleshooting:"
echo "   - If SSL doesn't work, check: sudo nginx -t"
echo "   - Check certificate: sudo certbot certificates"
echo "   - Check PM2 status: pm2 status"
echo "   - Check Nginx logs: sudo tail -f /var/log/nginx/error.log"
echo ""
print_success "SSL Certificate setup completed! Your application is now running with HTTPS!"
