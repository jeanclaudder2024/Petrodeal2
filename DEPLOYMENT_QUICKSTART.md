# 🚀 Quick Deployment Guide

## Option 1: Automated Deployment (Recommended)

### Prerequisites
- Ubuntu server (18.04+)
- SSH access to your server
- Domain name (optional)

### Steps:

1. **Upload project to your server:**
   ```bash
   # Option A: Using SCP
   scp -r /path/to/project/* user@your-server-ip:/home/user/aivessel-trade-flow/
   
   # Option B: Using Git (recommended)
   ssh user@your-server-ip
   git clone <your-repository-url> aivessel-trade-flow
   cd aivessel-trade-flow
   ```

2. **Run the deployment script:**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

3. **Update domain in script (before running):**
   Edit `deploy.sh` and change `DOMAIN="your-domain.com"` to your actual domain.

4. **Set up SSL (after deployment):**
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d your-domain.com -d www.your-domain.com
   ```

## Option 2: Manual Deployment

Follow the detailed guide in `deploy-ubuntu.md`

## Option 3: Using PM2 Deploy (Advanced)

1. **Configure ecosystem.config.js:**
   - Update `user`, `host`, and `repo` fields
   - Set your server IP and Git repository

2. **Deploy:**
   ```bash
   pm2 deploy production setup
   pm2 deploy production
   ```

## Files Created for Deployment:

- 📄 `deploy-ubuntu.md` - Complete step-by-step guide
- 🚀 `deploy.sh` - Automated deployment script
- ⚙️ `.env.production` - Production environment variables
- 🔧 `ecosystem.config.js` - PM2 configuration
- 📋 `DEPLOYMENT_QUICKSTART.md` - This quick guide

## Post-Deployment:

1. **Test your application:** Visit `http://your-domain.com`
2. **Monitor logs:** `sudo tail -f /var/log/nginx/error.log`
3. **Update application:** Run `/var/www/aivessel-trade-flow/update.sh`

## Troubleshooting:

- **502 Bad Gateway:** Check if all services are running
- **Permission denied:** Check file ownership: `sudo chown -R $USER:$USER /var/www/aivessel-trade-flow`
- **Build fails:** Ensure environment variables are set correctly

## Security Checklist:

- ✅ Firewall configured (UFW)
- ✅ SSL certificate installed
- ✅ Security headers added
- ✅ Gzip compression enabled
- ⚠️ Consider installing fail2ban: `sudo apt install fail2ban`

## Performance Tips:

- Use a CDN for static assets
- Monitor server resources with `htop`
- Set up log rotation
- Regular backups

---

**Need help?** Check the detailed guide in `deploy-ubuntu.md` or contact support.