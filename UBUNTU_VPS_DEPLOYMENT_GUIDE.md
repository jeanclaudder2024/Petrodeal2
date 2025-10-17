# 🚀 Ubuntu VPS Deployment Guide - AI Vessel Trade Flow

This guide will help you deploy both the React frontend and Python API on the same Ubuntu VPS server.

## 📋 Prerequisites

- Ubuntu 20.04+ VPS server
- Root or sudo access
- Domain name (optional, but recommended)
- Basic knowledge of Linux commands

## 🏗️ Architecture Overview

```
Ubuntu VPS
├── React App (Port 3000) - Frontend
├── Python API (Port 8000) - Backend
├── Nginx (Port 80/443) - Reverse Proxy
└── PM2/Systemd - Process Management
```

## 🚀 Quick Deployment (Automated)

### Step 1: Prepare Your VPS

1. **Connect to your VPS:**
   ```bash
   ssh root@your-vps-ip
   # or
   ssh ubuntu@your-vps-ip
   ```

2. **Update system:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

### Step 2: Upload Project Files

1. **Upload your project to the VPS:**
   ```bash
   # Using SCP (from your local machine)
   scp -r aivessel-trade-flow-main root@your-vps-ip:/root/
   
   # Or using Git (on the VPS)
   git clone https://github.com/your-username/your-repo.git
   ```

2. **Make deployment script executable:**
   ```bash
   chmod +x deploy-ubuntu.sh
   ```

### Step 3: Run Automated Deployment

```bash
# Run the automated deployment script
./deploy-ubuntu.sh
```

The script will:
- ✅ Install Node.js 18.x
- ✅ Install Python 3.11
- ✅ Install Nginx
- ✅ Install PM2
- ✅ Set up Python virtual environment
- ✅ Install all dependencies
- ✅ Build React app
- ✅ Configure Nginx
- ✅ Start both applications
- ✅ Set up firewall

## 🔧 Manual Deployment (Step by Step)

If you prefer manual setup or need to troubleshoot:

### Step 1: Install System Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python 3.11
sudo apt install -y python3.11 python3.11-venv python3.11-dev python3-pip

# Install system dependencies
sudo apt install -y build-essential libssl-dev libffi-dev python3-dev

# Install Nginx
sudo apt install -y nginx

# Install PM2
sudo npm install -g pm2
```

### Step 2: Set Up Project Structure

```bash
# Create application directory
sudo mkdir -p /opt/aivessel-trade-flow
sudo chown $USER:$USER /opt/aivessel-trade-flow

# Copy project files
cp -r aivessel-trade-flow-main/* /opt/aivessel-trade-flow/
cd /opt/aivessel-trade-flow
```

### Step 3: Set Up Python API

```bash
cd document-processor

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Test the API
python main.py
# Should show: "🚀 Starting Document Processor API..."
```

### Step 4: Set Up React App

```bash
cd ../src

# Install dependencies
npm install

# Build for production
npm run build

# Install serve
npm install -g serve

# Test the app
serve -s build -l 3000
# Should show: "Accepting connections at http://localhost:3000"
```

### Step 5: Configure PM2

```bash
# Copy PM2 configuration
cp ecosystem.config.js /opt/aivessel-trade-flow/

# Start applications
pm2 start /opt/aivessel-trade-flow/ecosystem.config.js

# Save PM2 configuration
pm2 save

# Set up PM2 startup
pm2 startup
# Follow the instructions shown
```

### Step 6: Configure Nginx

```bash
# Copy Nginx configuration
sudo cp nginx-config.conf /etc/nginx/sites-available/aivessel-trade-flow

# Enable the site
sudo ln -s /etc/nginx/sites-available/aivessel-trade-flow /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 7: Configure Firewall

```bash
# Allow necessary ports
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw --force enable
```

## 🔒 SSL Certificate Setup (Optional but Recommended)

### Using Let's Encrypt (Free SSL)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### Manual SSL Setup

If you have your own SSL certificates:

```bash
# Copy certificates to Nginx directory
sudo cp your-cert.pem /etc/nginx/ssl/
sudo cp your-key.pem /etc/nginx/ssl/

# Update Nginx configuration
sudo nano /etc/nginx/sites-available/aivessel-trade-flow
# Uncomment and configure the HTTPS server block
```

## 🎯 Testing Your Deployment

### 1. Check Application Status

```bash
# Check PM2 status
pm2 status

# Check Nginx status
sudo systemctl status nginx

# Check if ports are listening
sudo netstat -tlnp | grep -E ':(80|3000|8000)'
```

### 2. Test Endpoints

```bash
# Test React app
curl http://your-vps-ip/

# Test Python API
curl http://your-vps-ip/api/health

# Test document processing
curl -X POST http://your-vps-ip/api/process-document \
  -F "template_file=@your-template.docx" \
  -F "vessel_imo=1234567"
```

### 3. Check Logs

```bash
# PM2 logs
pm2 logs

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logs
journalctl -u nginx -f
```

## 🛠️ Troubleshooting

### Common Issues and Solutions

#### 1. Python API Not Starting

```bash
# Check Python API logs
pm2 logs python-api

# Check if port 8000 is in use
sudo lsof -i :8000

# Restart Python API
pm2 restart python-api
```

#### 2. React App Not Loading

```bash
# Check React app logs
pm2 logs react-app

# Check if port 3000 is in use
sudo lsof -i :3000

# Rebuild React app
cd /opt/aivessel-trade-flow/src
npm run build
pm2 restart react-app
```

#### 3. Nginx Configuration Issues

```bash
# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

#### 4. Permission Issues

```bash
# Fix ownership
sudo chown -R $USER:$USER /opt/aivessel-trade-flow

# Fix permissions
chmod -R 755 /opt/aivessel-trade-flow
```

#### 5. docx2pdf Not Working

```bash
# Check if LibreOffice is installed
sudo apt install libreoffice

# Test docx2pdf
cd /opt/aivessel-trade-flow/document-processor
source venv/bin/activate
python -c "import docx2pdf; print('docx2pdf working!')"
```

## 📊 Monitoring and Maintenance

### 1. Monitor Application Performance

```bash
# PM2 monitoring
pm2 monit

# System resources
htop
df -h
free -h
```

### 2. Log Rotation

```bash
# Set up log rotation for PM2
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 3. Backup Strategy

```bash
# Create backup script
cat > /opt/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf /opt/backup_$DATE.tar.gz /opt/aivessel-trade-flow
find /opt/backup_*.tar.gz -mtime +7 -delete
EOF

chmod +x /opt/backup.sh

# Add to crontab for daily backups
crontab -e
# Add: 0 2 * * * /opt/backup.sh
```

## 🔄 Updates and Maintenance

### 1. Update Application

```bash
# Stop applications
pm2 stop all

# Update code
cd /opt/aivessel-trade-flow
git pull origin main

# Update Python dependencies
cd document-processor
source venv/bin/activate
pip install -r requirements.txt --upgrade

# Rebuild React app
cd ../src
npm install
npm run build

# Restart applications
pm2 restart all
```

### 2. System Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Restart services if needed
sudo systemctl restart nginx
pm2 restart all
```

## 📝 Useful Commands

### PM2 Commands
```bash
pm2 status              # Check status
pm2 logs                # View logs
pm2 restart all         # Restart all apps
pm2 stop all            # Stop all apps
pm2 delete all          # Delete all apps
pm2 monit               # Monitor resources
```

### Nginx Commands
```bash
sudo nginx -t           # Test configuration
sudo systemctl reload nginx    # Reload configuration
sudo systemctl restart nginx   # Restart Nginx
sudo systemctl status nginx    # Check status
```

### System Commands
```bash
sudo systemctl status python-api    # Check Python API service
sudo systemctl status react-app     # Check React app service
journalctl -u python-api -f         # Follow Python API logs
journalctl -u react-app -f          # Follow React app logs
```

## 🎉 Success!

Your AI Vessel Trade Flow application is now deployed on Ubuntu VPS!

### Access Your Application:
- **React App**: `http://your-vps-ip` or `https://yourdomain.com`
- **Python API**: `http://your-vps-ip/api/` or `https://yourdomain.com/api/`

### Next Steps:
1. ✅ Configure your domain name
2. ✅ Set up SSL certificates
3. ✅ Test all functionality
4. ✅ Set up monitoring
5. ✅ Configure backups

## 🆘 Support

If you encounter any issues:

1. Check the logs: `pm2 logs`
2. Verify services: `pm2 status`
3. Test endpoints: `curl http://your-vps-ip/api/health`
4. Check Nginx: `sudo nginx -t`

**Your AI Vessel Trade Flow is now ready for production! 🚀**
