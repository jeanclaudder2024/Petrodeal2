# How to Restart API Without PM2 (Using systemd or Manual)

Since you don't have PM2, here are the correct ways to restart the API:

## 🔍 Step 1: Find How Your API is Running

Run this command to find your API:

```bash
# Check systemd services
sudo systemctl list-units --type=service | grep -i "document\|python\|api"

# Check what's running on port 8000
sudo lsof -i :8000

# Check for Python processes
ps aux | grep "[p]ython.*main.py"
```

## 🔄 Step 2: Restart Based on What You Find

### **Option A: If using systemd service**

```bash
# Check service name (common names):
sudo systemctl status document-processor
sudo systemctl status petrodealhub-api
sudo systemctl status python-api

# Restart the service (use the actual name):
sudo systemctl restart document-processor
# OR
sudo systemctl restart petrodealhub-api

# Check status:
sudo systemctl status document-processor

# View logs:
sudo journalctl -u document-processor -f
```

### **Option B: If running as a process (not systemd)**

```bash
# Find the process
PID=$(lsof -ti:8000)
echo "API PID: $PID"

# Kill it
kill -9 $PID

# Find the project directory
cd /opt/petrodealhub/document-processor
# OR
cd ~/aivessel-trade-flow-main/document-processor

# Restart it
# If you have venv:
source venv/bin/activate
nohup python main.py > /tmp/api.log 2>&1 &

# OR without venv:
nohup python3 main.py > /tmp/api.log 2>&1 &

# Check if it started:
sleep 3
ps aux | grep "[p]ython.*main.py"
curl http://localhost:8000/health
```

### **Option C: Use the automated script**

I've created a script that finds and restarts your API automatically:

```bash
cd document-processor
bash find-and-restart-api.sh
```

## 📋 Quick Commands Reference

```bash
# Find API process
sudo lsof -i :8000
ps aux | grep "[p]ython.*main.py"

# Check systemd services
sudo systemctl list-units | grep -i document

# Restart if systemd
sudo systemctl restart document-processor

# Restart if manual process
PID=$(lsof -ti:8000) && kill -9 $PID
cd /opt/petrodealhub/document-processor
nohup venv/bin/python main.py > /tmp/api.log 2>&1 &

# Test API
curl http://localhost:8000/health
```

## 🔧 If API is Not Running at All

If the API is not running, start it:

```bash
# Navigate to project
cd /opt/petrodealhub/document-processor
# OR
cd ~/aivessel-trade-flow-main/document-processor

# Activate venv (if exists)
source venv/bin/activate

# Start API
python main.py
# OR in background:
nohup python main.py > /tmp/api.log 2>&1 &
```

## ✅ Verify API is Working

After restarting, test it:

```bash
# Test health endpoint
curl http://localhost:8000/health

# Check if port is listening
netstat -tlnp | grep 8000
# OR
ss -tlnp | grep 8000
```

## 🆘 Still Having Issues?

1. **Check nginx configuration** - nginx might be proxying to the API:
   ```bash
   sudo cat /etc/nginx/sites-enabled/* | grep -i "8000\|api"
   ```

2. **Check if API is behind nginx reverse proxy**:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

3. **View API logs**:
   ```bash
   # If systemd:
   sudo journalctl -u document-processor -f
   
   # If manual:
   tail -f /tmp/api.log
   ```


