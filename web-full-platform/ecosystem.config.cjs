// ============================================
// TokShop PM2 Ecosystem Configuration
// ============================================
// 
// TO CHANGE YOUR API URL:
// 1. Edit the BASE_URL value below
// 2. Run: pm2 restart all
//
// ⚠️ IMPORTANT: Set your API domain below
// ============================================

module.exports = {
  apps: [
    {
      name: 'tokshop-admin',
      cwd: './admin-app',
      script: 'dist/server.js',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        // ⚠️ CHANGE THIS to your API server URL
        BASE_URL: 'https://api.yourdomain.com'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    },
    {
      name: 'tokshop-marketplace',
      cwd: './marketplace-app',
      script: 'dist/server.js',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        PORT: 5001,
        // ⚠️ CHANGE THIS to your API server URL
        BASE_URL: 'https://api.yourdomain.com'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    }
  ]
};
