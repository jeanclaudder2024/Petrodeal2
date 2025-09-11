// PM2 Ecosystem Configuration
// This file is used if you need to run a Node.js backend server

module.exports = {
  apps: [{
    name: 'aivessel-backend',
    script: 'server.js', // Change this to your backend entry point
    instances: 'max',
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }],

  deploy: {
    production: {
      user: 'ubuntu',
      host: 'your-server-ip', // Replace with your server IP
      ref: 'origin/main',
      repo: 'your-git-repository', // Replace with your git repository
      path: '/var/www/aivessel-trade-flow',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};