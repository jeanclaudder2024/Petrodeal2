# Ubuntu Server Deployment Guide

This guide will help you deploy your React application to an Ubuntu server step by step.

## Prerequisites
- Ubuntu server (18.04 or later)
- Root or sudo access
- Domain name (optional but recommended)

## Step 1: Update Ubuntu Server

```bash
sudo apt update
sudo apt upgrade -y
```

## Step 2: Install Node.js and npm

```bash
# Install Node.js 18.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

## Step 3: Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

## Step 4: Install Nginx

```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

## Step 5: Create Application Directory

```bash
sudo mkdir -p /var/www/aivessel-trade-flow
sudo chown -R $USER:$USER /var/www/aivessel-trade-flow
```

## Step 6: Upload Your Project Files

### Option A: Using Git (Recommended)
```bash
cd /var/www/aivessel-trade-flow
git clone <your-repository-url> .
```

### Option B: Using SCP/SFTP
```bash
# From your local machine
scp -r /path/to/your/project/* user@your-server-ip:/var/www/aivessel-trade-flow/
```

## Step 7: Install Dependencies and Build

```bash
cd /var/www/aivessel-trade-flow
npm install

# Copy production environment file
cp .env.production .env

# Build the application
npm run build
```

## Step 8: Configure Nginx

Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/aivessel-trade-flow
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;  # Replace with your domain
    
    root /var/www/aivessel-trade-flow/dist;
    index index.html;
    
    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/aivessel-trade-flow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Step 9: Set Up SSL with Let's Encrypt (Optional but Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo crontab -e
# Add this line:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## Step 10: Configure Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## Step 11: Set Up PM2 for Process Management (If using Node.js backend)

If you have a backend server:

```bash
# Create PM2 ecosystem file
nano ecosystem.config.js
```

Add:

```javascript
module.exports = {
  apps: [{
    name: 'aivessel-backend',
    script: 'server.js', // Your backend entry point
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

Start with PM2:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Step 12: Monitor and Maintain

```bash
# Check Nginx status
sudo systemctl status nginx

# Check PM2 processes
pm2 status

# View logs
pm2 logs
sudo tail -f /var/log/nginx/error.log
```

## Deployment Script

Create an automated deployment script:

```bash
nano deploy.sh
```

Add:

```bash
#!/bin/bash
set -e

echo "Starting deployment..."

# Navigate to project directory
cd /var/www/aivessel-trade-flow

# Pull latest changes (if using git)
git pull origin main

# Install dependencies
npm install

# Build application
npm run build

# Restart services
sudo systemctl reload nginx

echo "Deployment completed successfully!"
```

Make it executable:

```bash
chmod +x deploy.sh
```

## Troubleshooting

### Common Issues:

1. **Permission denied**: Check file ownership and permissions
2. **Nginx 502 error**: Check if backend service is running
3. **Build fails**: Ensure all environment variables are set
4. **SSL issues**: Verify domain DNS settings

### Useful Commands:

```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check running processes
ps aux | grep node

# Check open ports
sudo netstat -tlnp
```

## Security Best Practices

1. Keep system updated: `sudo apt update && sudo apt upgrade`
2. Use strong passwords and SSH keys
3. Configure fail2ban: `sudo apt install fail2ban`
4. Regular backups
5. Monitor logs regularly

## Performance Optimization

1. Enable Gzip compression (already in Nginx config)
2. Use CDN for static assets
3. Optimize images
4. Enable browser caching
5. Monitor with tools like htop, iotop

Your application should now be accessible at your domain or server IP address!