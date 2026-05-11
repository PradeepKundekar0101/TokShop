# TokShop Platform Deployment Guide

Complete guide for deploying TokShop to DigitalOcean with custom domains.

## Choose Your Deployment Scenario

**Scenario 1: Admin Panel Only** (for Flutter mobile app)
- Deploy admin web dashboard at `admin.tokshoplive.com`
- Users shop via Flutter mobile app
- You manage platform via web admin panel

**Scenario 2: Full Web Platform** (admin + marketplace)
- Deploy admin panel at `admin.tokshoplive.com`
- Deploy marketplace/seller dashboard at `tokshoplive.com`
- Complete web-based platform (no mobile app needed)

---

## Prerequisites

- DigitalOcean account
- Domain name (e.g., `tokshoplive.com`)
- Basic terminal knowledge
- SSH access to your server

---

# Scenario 1: Admin Panel Only (for Flutter App)

> Use this if you have a Flutter mobile app and just need the admin web dashboard.

## What You'll Deploy

- **Admin Panel** at `admin.tokshoplive.com`
- **Port**: 5000
- **Package**: `packages/admin-for-flutter/`

### Step 1: Create DigitalOcean Droplet

1. Log in to DigitalOcean → **Create** → **Droplets**
2. Choose **Ubuntu 22.04 LTS**
3. Plan: **Basic $6-12/month** (2-4GB RAM recommended)
4. Choose datacenter region closest to your users
5. Add your SSH key or set root password
6. Click **Create Droplet**
7. Note your **Droplet IP address**

### Step 2: Configure DNS

**At Your Domain Registrar:**

Change nameservers to:
```
ns1.digitalocean.com
ns2.digitalocean.com
ns3.digitalocean.com
```

**In DigitalOcean (Networking → Domains):**

Add A record:
- Type: **A**
- Hostname: `admin`
- Will create: `admin.tokshoplive.com`
- Value: Your Droplet IP

Wait 1-2 hours for DNS propagation.

### Step 3: Install Server Software

```bash
# Connect to droplet
ssh root@YOUR_DROPLET_IP

# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PM2 and Nginx
npm install -g pm2
apt install -y nginx

# Configure firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

### Step 4: Upload Package

```bash
# Upload package to server
scp -r packages/admin-for-flutter/ root@YOUR_DROPLET_IP:/var/www/
```

### Step 5: Configure Your API URL

**🎯 IMPORTANT:** Configure your API URL BEFORE running the installation.

```bash
cd /var/www/admin-for-flutter
nano ecosystem.config.cjs
```

Find this line:
```javascript
BASE_URL: 'https://api.tokshoplive.com'
```

**Change it to your actual API server URL**, for example:
```javascript
BASE_URL: 'https://api.tokshoplive.com'
```

**Save and exit:**
- Press `Ctrl + X`
- Press `Y` to confirm
- Press `Enter` to save

### Step 6: Install & Build

```bash
cd /var/www/admin-for-flutter
chmod +x install.sh
./install.sh
```

The installation script will:
- ✅ Install all dependencies
- ✅ Build the admin app

### Step 7: Start with PM2

```bash
cd /var/www/admin-for-flutter
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup systemd
# Run the command it shows you
```

### Step 7: Configure Nginx

```bash
nano /etc/nginx/sites-available/admin.tokshoplive.com
```

Paste (replace `admin.tokshoplive.com`):
```nginx
server {
    listen 80;
    server_name admin.tokshoplive.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
rm /etc/nginx/sites-enabled/default
ln -s /etc/nginx/sites-available/admin.tokshoplive.com /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Step 8: Add SSL Certificate

```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d admin.tokshoplive.com
# Choose option 2 (redirect HTTP to HTTPS)
certbot renew --dry-run
```

### ✅ Test Deployment

Visit: **https://admin.tokshoplive.com**

---

# Scenario 2: Full Web Platform (Admin + Marketplace)

> Use this for complete web platform with both admin and marketplace.

## What You'll Deploy

- **Admin Panel** at `admin.tokshoplive.com` (Port 5000)
- **Marketplace** at `tokshoplive.com` (Port 5001)
- **Package**: `packages/web-full-platform/`

### Step 1: Create DigitalOcean Droplet

1. Log in to DigitalOcean → **Create** → **Droplets**
2. Choose **Ubuntu 22.04 LTS**
3. Plan: **Basic $12-24/month** (4GB RAM recommended for both apps)
4. Choose datacenter region closest to your users
5. Add your SSH key or set root password
6. Click **Create Droplet**
7. Note your **Droplet IP address**

### Step 2: Configure DNS

**At Your Domain Registrar:**

Change nameservers to:
```
ns1.digitalocean.com
ns2.digitalocean.com
ns3.digitalocean.com
```

**In DigitalOcean (Networking → Domains):**

Add these A records:
- Type: **A**, Hostname: `@`, Value: Your Droplet IP (creates `tokshoplive.com`)
- Type: **A**, Hostname: `www`, Value: Your Droplet IP (creates `www.tokshoplive.com`)
- Type: **A**, Hostname: `admin`, Value: Your Droplet IP (creates `admin.tokshoplive.com`)

Wait 1-2 hours for DNS propagation.

### Step 3: Install Server Software

```bash
# Connect to droplet
ssh root@YOUR_DROPLET_IP

# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PM2 and Nginx
npm install -g pm2
apt install -y nginx

# Configure firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

### Step 4: Upload Package

```bash
# Upload package to server
scp -r packages/web-full-platform/ root@YOUR_DROPLET_IP:/var/www/
```

### Step 5: Configure Your API URL

**🎯 IMPORTANT:** Configure your API URL BEFORE running the installation.

```bash
cd /var/www/web-full-platform
nano ecosystem.config.cjs
```

You'll see **TWO apps** in the file. Find these lines and change **BOTH**:

```javascript
// Admin app (around line 15)
{
  name: 'tokshop-admin',
  ...
  env: {
    BASE_URL: 'https://api.tokshoplive.com'  // ⚠️ CHANGE THIS
  }
}

// Marketplace app (around line 28)
{
  name: 'tokshop-marketplace',
  ...
  env: {
    BASE_URL: 'https://api.tokshoplive.com'  // ⚠️ CHANGE THIS TOO
  }
}
```

**Change both to your actual API server URL**, for example:
```javascript
BASE_URL: 'https://api.tokshoplive.com'
```

**Make sure both apps use the SAME API URL!**

**Save and exit:**
- Press `Ctrl + X`
- Press `Y` to confirm
- Press `Enter` to save

### Step 6: Install & Build Both Apps

```bash
cd /var/www/web-full-platform
chmod +x install-all.sh
./install-all.sh
```

The installation script will:
- ✅ Install all dependencies for both apps
- ✅ Build admin and marketplace apps

### Step 7: Start Both Apps with PM2

```bash
cd /var/www/web-full-platform
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup systemd
# Run the command it shows you
```

### Step 7: Configure Nginx for Both Apps

**Admin Panel Configuration:**

```bash
nano /etc/nginx/sites-available/admin.tokshoplive.com
```

Paste (replace `admin.tokshoplive.com`):
```nginx
server {
    listen 80;
    server_name admin.tokshoplive.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Marketplace Configuration:**

```bash
nano /etc/nginx/sites-available/tokshoplive.com
```

Paste (replace `tokshoplive.com`):
```nginx
server {
    listen 80;
    server_name tokshoplive.com www.tokshoplive.com;

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Enable Both Sites:**

```bash
rm /etc/nginx/sites-enabled/default
ln -s /etc/nginx/sites-available/admin.tokshoplive.com /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/tokshoplive.com /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Step 8: Add SSL Certificates

```bash
apt install certbot python3-certbot-nginx -y

# Get SSL for Admin
certbot --nginx -d admin.tokshoplive.com

# Get SSL for Marketplace
certbot --nginx -d tokshoplive.com -d www.tokshoplive.com

# Choose option 2 (redirect HTTP to HTTPS) for both
certbot renew --dry-run
```

### ✅ Test Deployment

Visit both sites:
- **Admin Panel**: https://admin.tokshoplive.com
- **Marketplace**: https://tokshoplive.com

---

## Changing Your API URL

Both apps connect to an external API server. You need to configure your API URL before deploying.

### To Change the API URL:

The apps use PM2 ecosystem configuration for environment variables. This is better than `.env` files for production.

**Edit `ecosystem.config.cjs`:**

```bash
cd /var/www/web-full-platform  # or admin-for-flutter
nano ecosystem.config.cjs
```

Find the `BASE_URL` lines and change them to your API:

```javascript
// ⚠️ CHANGE THIS to point to your API server
BASE_URL: 'https://your-api-server.com'  // Change this!
```

**Restart the apps:**

```bash
pm2 delete all
pm2 start ecosystem.config.cjs
pm2 save
```

That's it! Your apps will now connect to your new API server.

---

## Environment Variables Reference

All apps use these environment variables (configured in `ecosystem.config.cjs`):

| Variable | Description | Example |
|----------|-------------|---------|
| `BASE_URL` | Your API server endpoint | `https://api.tokshoplive.com` |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | App port number | `5000` (admin) or `5001` (marketplace) |

**Note**: The new installation process automatically creates `ecosystem.config.cjs` with clear comments on how to change the BASE_URL.

---

## Useful Commands

### Check App Status
```bash
pm2 status
pm2 logs tokshop-admin
pm2 logs tokshop-marketplace
```

### Restart Apps
```bash
pm2 restart tokshop-admin
pm2 restart tokshop-marketplace
pm2 restart all
```

### Update Apps
```bash
cd /var/www/web-full-platform  # or admin-for-flutter

# For Admin
cd admin-app
git pull  # if using git
npm run build
cd ..

# For Marketplace (web-full-platform only)
cd marketplace-app
npm run build
cd ..

pm2 restart all
```

### Check Nginx
```bash
nginx -t  # Test configuration
systemctl status nginx
systemctl reload nginx
tail -f /var/log/nginx/error.log
```

---

## Troubleshooting

### Apps Not Starting

```bash
pm2 logs  # Check error messages

# Common fixes:
cd /var/www/web-full-platform/admin-app  # or marketplace-app
npm install  # Reinstall dependencies
npm run build  # Rebuild
pm2 restart tokshop-admin  # or tokshop-marketplace
```

### 502 Bad Gateway

```bash
pm2 status  # Apps must show "online"
nginx -t  # Test Nginx config
tail -f /var/log/nginx/error.log  # Check errors
```

### Environment Variable Issues

```bash
# Verify .env file exists and is correct
cat /var/www/web-full-platform/admin-app/.env
cat /var/www/web-full-platform/marketplace-app/.env

# .env must contain:
# BASE_URL=https://api.tokshoplive.com
# SESSION_SECRET=your-secret-here
# PORT=5000 (or 5001)

pm2 restart all  # Restart after fixing
```

### DNS Not Working

```bash
# Check DNS propagation
dig admin.tokshoplive.com
dig tokshoplive.com

# Wait up to 48 hours for full propagation
```

### SSL Certificate Issues

```bash
certbot certificates  # List certificates
certbot renew  # Manually renew
systemctl status certbot.timer  # Check auto-renewal
```

---

## Server Requirements

### Admin Only (Scenario 1)
- **Minimum**: 1GB RAM, 1 CPU, 25GB SSD ($6/month)
- **Recommended**: 2GB RAM, 1 CPU, 50GB SSD ($12/month)

### Full Platform (Scenario 2)
- **Minimum**: 2GB RAM, 1 CPU, 50GB SSD ($12/month)
- **Recommended**: 4GB RAM, 2 CPU, 80GB SSD ($24/month)
- **High Traffic**: 8GB RAM, 4 CPU, 160GB SSD ($48/month)

---

## Architecture Diagrams

### Scenario 1: Admin Only (with Flutter App)

```
┌─────────────────────┐
│  Flutter Mobile App │  ← Users shop here
│  (iOS + Android)    │
└──────────┬──────────┘
           │
           │ Both connect to same API
           │
           ↓
┌──────────────────────┐
│ External Backend API │
│ api.tokshoplive.com  │
└──────────┬───────────┘
           │
           ↑
┌──────────┴──────────┐
│   Admin Web Panel   │  ← You manage here
│ admin.tokshoplive.com │
│      Port 5000      │
└─────────────────────┘
```

### Scenario 2: Full Web Platform

```
┌─────────────────────────────────────────┐
│         Your Domains                    │
│                                         │
│  admin.tokshoplive.com  tokshoplive.com     │
└──────────────┬──────────────────────────┘
               │
               ↓
┌──────────────────────────────────────────┐
│          Nginx (Port 80/443)             │
│      Routes traffic by domain            │
└───────────┬─────────────┬────────────────┘
            │             │
    admin → │             │ ← marketplace
            ↓             ↓
┌───────────────┐  ┌─────────────────┐
│  Admin App    │  │ Marketplace App │
│  Port 5000    │  │  Port 5001      │
└───────────────┘  └─────────────────┘
            │             │
            └─────┬───────┘
                  ↓
         ┌────────────────┐
         │ External API   │
         │ tokshoplive.com   │
         └────────────────┘
```

---

## Support

For issues or questions:
1. Check PM2 logs: `pm2 logs`
2. Check Nginx logs: `tail -f /var/log/nginx/error.log`
3. Verify environment variables in `.env` files
4. Ensure DNS is properly configured
5. Confirm apps are running: `pm2 status`
