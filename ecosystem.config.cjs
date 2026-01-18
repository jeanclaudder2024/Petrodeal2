module.exports = {
  apps: [
    {
      name: 'python-api',
      cwd: '/opt/petrodealhub/document-processor',
      script: 'python',
      args: 'main.py',
      interpreter: '/opt/petrodealhub/document-processor/venv/bin/python',
      env: {
        FASTAPI_PORT: 8000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/pm2/python-api-error.log',
      out_file: '/var/log/pm2/python-api-out.log',
      log_file: '/var/log/pm2/python-api.log'
    },
    {
      name: 'react-app',
      cwd: '/opt/petrodealhub/src',
      script: 'serve',
      args: '-s build -l 3000',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/pm2/react-app-error.log',
      out_file: '/var/log/pm2/react-app-out.log',
      log_file: '/var/log/pm2/react-app.log'
    }
  ]
};
