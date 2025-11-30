# Fix Nginx Cache Issue

## Problem
Browser is loading old cached JS files (`index-CWso2qzf.js`) instead of new build (`index-BlLrJfrv.js`).

## Solution

### Step 1: Disable Nginx Cache for HTML/JS/CSS Files

Edit nginx config:

```bash
sudo nano /etc/nginx/sites-enabled/petrodealhub
```

Add these cache headers inside the `server` block or `location /` block:

```nginx
location / {
    # ... existing config ...
    
    # Disable cache for HTML files
    location ~* \.html$ {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }
    
    # Disable cache for JS and CSS files
    location ~* \.(js|css)$ {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }
}
```

Or add at the server level:

```nginx
server {
    # ... existing config ...
    
    # Disable cache for all assets
    add_header Cache-Control "no-cache, no-store, must-revalidate" always;
    add_header Pragma "no-cache" always;
    add_header Expires "0" always;
    
    # ... rest of config ...
}
```

### Step 2: Test and Reload Nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Step 3: Clear Browser Cache Completely

1. Open DevTools (F12)
2. Right-click on refresh button
3. Select "Empty Cache and Hard Reload"
4. Or: Ctrl+Shift+Delete → Clear all cached files

### Step 4: Check for Service Worker

In browser console, run:
```javascript
navigator.serviceWorker.getRegistrations().then(registrations => {
    console.log('Service Workers:', registrations);
    registrations.forEach(reg => reg.unregister());
});
```

Then reload the page.





