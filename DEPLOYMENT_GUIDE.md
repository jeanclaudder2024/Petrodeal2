# 🚀 Complete Deployment Guide for PetroDealHub.com

## 📋 Pre-Deployment Checklist

### 1. DNS Configuration (CRITICAL)
Before starting deployment, make sure your domain is properly configured:

```bash
# Check if domain points to your VPS
nslookup petrodealhub.com
nslookup www.petrodealhub.com
```

**Required DNS Records:**
- `petrodealhub.com` → Your VPS IP address
- `www.petrodealhub.com` → Your VPS IP address

### 2. VPS Requirements
- Ubuntu 20.04+ or Debian 11+
- At least 2GB RAM
- At least 20GB storage
- Root access or sudo privileges

### 3. Project Files
- Make sure you're in the project root directory
- Verify `package.json` and `document-processor/requirements.txt` exist

## 🚀 Step-by-Step Deployment

### Step 1: Connect to Your VPS
```bash
ssh root@your-vps-ip
# or
ssh your-username@your-vps-ip
```

### Step 2: Upload Project Files
```bash
# Option A: Using SCP (from your local machine)
scp -r . root@your-vps-ip:/tmp/aivessel-trade-flow

# Option B: Using Git (on VPS)
git clone https://github.com/your-repo/aivessel-trade-flow.git
cd aivessel-trade-flow
```

### Step 3: Make Script Executable
```bash
chmod +x deploy-petrodealhub.sh
```

### Step 4: Run Deployment Script
```bash
./deploy-petrodealhub.sh
```

**The script will:**
1. ✅ Update system packages
2. ✅ Install Node.js 18.x, Python 3.11, Nginx, PM2, Certbot
3. ✅ Create application directory `/opt/petrodealhub`
4. ✅ Copy project files
5. ✅ Setup Python API with virtual environment
6. ✅ Setup React app and build for production
7. ✅ Configure PM2 processes
8. ✅ Setup Nginx reverse proxy
9. ✅ Configure firewall (ports 22, 80, 443)
10. ✅ Obtain SSL certificate from Let's Encrypt
11. ✅ Setup automatic SSL renewal

### Step 5: Follow PM2 Startup Instructions
After the script runs, you'll see a command like:
```bash
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u your-username --hp /home/your-username
```
**Run this command exactly as shown!**

### Step 6: Verify Deployment
```bash
# Check PM2 processes
pm2 status

# Check Nginx status
sudo systemctl status nginx

# Check SSL certificate
sudo certbot certificates

# Test your site
curl -I https://petrodealhub.com
```

## 🌐 Final Result

After successful deployment, your application will be available at:

- **Main Site**: `https://petrodealhub.com`
- **API Endpoints**: `https://petrodealhub.com/api/`
- **Health Check**: `https://petrodealhub.com/health`

## 📝 Useful Commands

### PM2 Management
```bash
pm2 status              # Check process status
pm2 logs                # View all logs
pm2 logs petrodealhub-api    # View API logs
pm2 logs petrodealhub-app    # View React app logs
pm2 restart all         # Restart all processes
pm2 stop all           # Stop all processes
pm2 monit              # Monitor processes
```

### Nginx Management
```bash
sudo systemctl status nginx    # Check Nginx status
sudo systemctl restart nginx   # Restart Nginx
sudo nginx -t                  # Test Nginx configuration
sudo tail -f /var/log/nginx/error.log  # View Nginx errors
```

### SSL Certificate Management
```bash
sudo certbot certificates      # List certificates
sudo certbot renew            # Renew certificates
sudo certbot renew --dry-run  # Test renewal
```

## 🔧 Troubleshooting

### Common Issues

#### 1. DNS Not Propagated
```bash
# Check if domain points to your server
dig petrodealhub.com
# Wait for DNS propagation (can take up to 48 hours)
```

#### 2. SSL Certificate Failed
```bash
# Check Nginx configuration
sudo nginx -t

# Check if ports 80 and 443 are open
sudo ufw status

# Manually obtain certificate
sudo certbot --nginx -d petrodealhub.com -d www.petrodealhub.com
```

#### 3. PM2 Processes Not Starting
```bash
# Check logs
pm2 logs

# Restart processes
pm2 restart all

# Check if ports are in use
sudo netstat -tlnp | grep :3000
sudo netstat -tlnp | grep :8000
```

#### 4. API Not Responding
```bash
# Check if Python API is running
curl http://localhost:8000/health

# Check PM2 logs
pm2 logs petrodealhub-api

# Restart API
pm2 restart petrodealhub-api
```

#### 5. React App Not Loading
```bash
# Check if React app is running
curl http://localhost:3000

# Check PM2 logs
pm2 logs petrodealhub-app

# Restart React app
pm2 restart petrodealhub-app
```

## 🔒 Security Notes

1. **Firewall**: Only ports 22 (SSH), 80 (HTTP), and 443 (HTTPS) are open
2. **SSL**: Automatic renewal is configured
3. **Updates**: System packages are updated during deployment
4. **Process Management**: PM2 handles process restarts and monitoring

## 📊 Monitoring

### Health Checks
- **API Health**: `https://petrodealhub.com/health`
- **Main Site**: `https://petrodealhub.com`

### Log Locations
- **PM2 Logs**: `/var/log/pm2/`
- **Nginx Logs**: `/var/log/nginx/`
- **System Logs**: `journalctl -u nginx`

## 🆘 Support

If you encounter issues:

1. Check the logs: `pm2 logs`
2. Verify DNS: `nslookup petrodealhub.com`
3. Test locally: `curl http://localhost:3000` and `curl http://localhost:8000/health`
4. Check Nginx: `sudo nginx -t`

## 🎉 Success!

Once deployed successfully, you'll have:
- ✅ Secure HTTPS website
- ✅ Automatic SSL certificate renewal
- ✅ Process monitoring with PM2
- ✅ Reverse proxy with Nginx
- ✅ Python API + React frontend
- ✅ File upload capabilities
- ✅ Health monitoring

Your AI Vessel Trade Flow application is now live on PetroDealHub.com! 🚀