#!/bin/bash

# Check Port Conflicts for AI Vessel Trade Flow
# This script checks what's using ports 3000 and 8000

echo "🔍 Checking Port Conflicts"
echo "========================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check port 3000
print_status "Checking port 3000..."
if sudo lsof -i :3000 > /dev/null 2>&1; then
    print_warning "Port 3000 is in use:"
    sudo lsof -i :3000
    
    # Check if it's our React app
    if sudo lsof -i :3000 | grep -q "serve\|node"; then
        print_status "Port 3000 is being used by our React app (this is expected)"
    else
        print_warning "Port 3000 is being used by something else"
    fi
else
    print_success "Port 3000 is available"
fi

echo ""

# Check port 8000
print_status "Checking port 8000..."
if sudo lsof -i :8000 > /dev/null 2>&1; then
    print_warning "Port 8000 is in use:"
    sudo lsof -i :8000
    
    # Check if it's Docker
    if sudo lsof -i :8000 | grep -q docker; then
        print_error "Docker is using port 8000! This is the problem."
        echo ""
        print_status "Docker containers using port 8000:"
        sudo docker ps | grep :8000 || echo "No Docker containers found with port 8000"
        echo ""
        print_status "To fix this, run:"
        echo "sudo docker ps | grep :8000 | awk '{print \$1}' | xargs -r sudo docker stop"
        echo ""
    elif sudo lsof -i :8000 | grep -q python; then
        print_status "Port 8000 is being used by our Python API (this is expected)"
    else
        print_warning "Port 8000 is being used by something else"
    fi
else
    print_success "Port 8000 is available"
fi

echo ""

# Check Docker containers
print_status "Checking Docker containers..."
if command -v docker > /dev/null 2>&1; then
    if sudo docker ps | grep -q :8000; then
        print_warning "Docker containers using port 8000:"
        sudo docker ps | grep :8000
        echo ""
        print_status "To stop these containers:"
        echo "sudo docker stop \$(sudo docker ps | grep :8000 | awk '{print \$1}')"
    else
        print_success "No Docker containers using port 8000"
    fi
else
    print_status "Docker is not installed"
fi

echo ""

# Check PM2 processes
print_status "Checking PM2 processes..."
if command -v pm2 > /dev/null 2>&1; then
    pm2 status
else
    print_warning "PM2 is not installed or not in PATH"
fi

echo ""

# Check Nginx status
print_status "Checking Nginx status..."
if sudo systemctl is-active --quiet nginx; then
    print_success "Nginx is running"
else
    print_warning "Nginx is not running"
fi

echo ""

# Summary
echo "📋 Summary:"
echo "==========="
echo "1. Check what's using port 8000 (this is likely the SSL issue)"
echo "2. If Docker is using port 8000, stop those containers"
echo "3. Make sure your Python API is running on port 8000"
echo "4. Make sure your React app is running on port 3000"
echo "5. Run the SSL fix script: ./fix-ssl-deployment.sh"
echo ""
echo "🔧 Quick fixes:"
echo "==============="
echo "# Stop Docker containers using port 8000"
echo "sudo docker stop \$(sudo docker ps | grep :8000 | awk '{print \$1}')"
echo ""
echo "# Stop any Python processes using port 8000"
echo "sudo pkill -f 'python.*main.py'"
echo ""
echo "# Restart PM2 processes"
echo "pm2 restart all"
echo ""
echo "# Restart Nginx"
echo "sudo systemctl restart nginx"
