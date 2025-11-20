#!/bin/bash

# Quick script to check API logs and diagnose connection issues

echo "=========================================="
echo "🔍 Checking API Service Status"
echo "=========================================="
echo ""

# Check service status
echo "📋 Service Status:"
sudo systemctl status petrodealhub-api --no-pager -l | head -20
echo ""

# Check recent logs
echo "📋 Recent Logs (last 50 lines):"
echo "----------------------------------------"
sudo journalctl -u petrodealhub-api -n 50 --no-pager | tail -30
echo "----------------------------------------"
echo ""

# Check if port is listening
echo "📋 Port 8000 Status:"
if netstat -tuln 2>/dev/null | grep -q ":8000 " || ss -tuln 2>/dev/null | grep -q ":8000 "; then
    echo "✓ Port 8000 is in use"
    netstat -tuln 2>/dev/null | grep ":8000 " || ss -tuln 2>/dev/null | grep ":8000 "
else
    echo "✗ Port 8000 is NOT in use - API is not listening"
fi
echo ""

# Check if process is running
echo "📋 Python Process:"
ps aux | grep -E "python.*main\.py|uvicorn" | grep -v grep || echo "No Python API process found"
echo ""

# Test API endpoint
echo "📋 Testing API:"
echo "   Testing http://localhost:8000/health..."
curl -s -w "\n   HTTP Status: %{http_code}\n" http://localhost:8000/health || echo "   Connection failed"
echo ""

# Check service file path
echo "📋 Service Configuration:"
if [ -f "/etc/systemd/system/petrodealhub-api.service" ]; then
    echo "✓ Service file exists"
    echo "   WorkingDirectory:"
    grep "WorkingDirectory" /etc/systemd/system/petrodealhub-api.service || echo "   Not found"
    echo "   ExecStart:"
    grep "ExecStart" /etc/systemd/system/petrodealhub-api.service || echo "   Not found"
else
    echo "✗ Service file not found at /etc/systemd/system/petrodealhub-api.service"
fi
echo ""

echo "=========================================="
echo "✅ Diagnostic Complete"
echo "=========================================="

