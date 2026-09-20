# SafeRoute — Production Deployment Guide
**Target Infrastructure**: Hostinger KVM 2 VPS (2 vCPU, 8 GB RAM, 100 GB NVMe Storage, Ubuntu 22.04 / 24.04 LTS)  
**Architecture**: Nginx (Reverse Proxy & SSL) + PM2 (Node.js Process Manager) + Express / Socket.IO + PostgreSQL 16 + PostGIS 3 + React Vite SPA

---

## Pre-Deployment Checklist

Before beginning VPS deployment on Hostinger KVM 2, ensure you have:
- [ ] A provisioned **Hostinger KVM 2 VPS** running fresh Ubuntu 22.04 or 24.04 LTS.
- [ ] Root SSH access to your VPS server IP.
- [ ] A registered domain name (e.g., `saferoute.polonoling.edu.ph` or `saferoute.example.com`).
- [ ] DNS **A Records** pointed to your VPS Public IP:
  - `A @ -> <YOUR_VPS_IP>`
  - `A www -> <YOUR_VPS_IP>`
- [ ] Firebase Service Account JSON (`serviceAccountKey.json`) from Firebase Console (for push notifications).
- [ ] Mobile app developers notified of the production API domain (`https://YOUR_DOMAIN/api`).

---

## 1. Server Provisioning & Base Ubuntu Setup

Connect to your VPS via SSH:
```bash
ssh root@YOUR_SERVER_IP
```

Update system packages and install essential utilities:
```bash
apt update && apt upgrade -y
apt install -y curl wget git ufw build-essential libpq-dev
```

Configure System Timezone (Philippines Standard Time - UTC+8):
```bash
timedatectl set-timezone Asia/Manila
```

---

## 2. Firewall Setup (UFW)

Lock down all ports except SSH, HTTP, and HTTPS. Keep Node.js (5000) and PostgreSQL (5432) strictly private:
```bash
# Allow SSH (ensure port matches your configured SSH port)
ufw allow 22/tcp

# Allow Web Traffic
ufw allow 80/tcp
ufw allow 443/tcp

# Deny Direct External Access to Private Services
ufw deny 5000/tcp
ufw deny 5432/tcp

# Enable Firewall
ufw enable
ufw status verbose
```

---

## 3. Node.js 20 LTS & PM2 Setup

Install Node.js 20 LTS via NodeSource:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verify Node.js & npm
node --version   # v20.x.x
npm --version    # 10.x.x

# Install PM2 Process Manager globally
npm install -g pm2
```

---

## 4. PostgreSQL 16 & PostGIS Setup

Install PostgreSQL and PostGIS extension:
```bash
apt install -y postgresql postgresql-contrib postgis postgresql-16-postgis-3
systemctl enable postgresql
systemctl start postgresql
```

### Create Application Database & Dedicated User:
```bash
sudo -u postgres psql
```

Execute SQL commands in PostgreSQL console:
```sql
-- 1. Create dedicated application user
CREATE USER saferoute_app WITH PASSWORD 'CHANGE_THIS_TO_STRONG_PASSWORD';

-- 2. Create production database owned by saferoute_app
CREATE DATABASE saferoute_db OWNER saferoute_app;

-- 3. Connect to saferoute_db and enable PostGIS
\c saferoute_db;
CREATE EXTENSION IF NOT EXISTS postgis;

-- 4. Grant required schema privileges
GRANT ALL ON SCHEMA public TO saferoute_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO saferoute_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO saferoute_app;

\q
```

---

## 5. Repository Cloning & File Structure

Set up web root directory:
```bash
mkdir -p /var/www/saferoute
cd /var/www/saferoute

# Clone repository
git clone https://github.com/CodeRVdev/SafeRoutre.git .
```

---

## 6. Backend Environment Configuration

```bash
cd /var/www/saferoute/backend

# Copy production template
cp .env.production.example .env
nano .env
```

Set the production values:
```env
NODE_ENV=production
HOST=127.0.0.1
PORT=5000

DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=saferoute_db
DB_USER=saferoute_app
DB_PASSWORD=YOUR_ACTUAL_STRONG_PASSWORD

# Generate with: openssl rand -base64 48
JWT_SECRET=PASTE_YOUR_SECURE_GENERATED_SECRET_HERE
JWT_EXPIRES_IN=24h

CORS_ORIGIN=https://YOUR_DOMAIN,https://www.YOUR_DOMAIN
UPLOAD_DIR=uploads/hazards
FIREBASE_SERVICE_ACCOUNT_PATH=config/serviceAccountKey.json
```

Place Firebase Service Account credentials:
```bash
mkdir -p /var/www/saferoute/backend/config
# Copy your serviceAccountKey.json into this directory
chmod 600 /var/www/saferoute/backend/config/serviceAccountKey.json
```

---

## 7. Backend Dependencies, Build & Database Migrations

```bash
cd /var/www/saferoute/backend

# Install dependencies
npm ci

# Compile TypeScript to dist/
npm run build

# Run idempotent database migrations and spatial indexes
npm run db:migrate:prod

# (Optional Initial Setup Only) Seed initial admin & coordinator accounts:
# npm run db:seed:prod
```

---

## 8. PM2 Process Initialization

Create logs folder and start backend with PM2:
```bash
cd /var/www/saferoute/backend
mkdir -p logs

# Start using ecosystem configuration
pm2 start ecosystem.config.js

# Save PM2 process list and configure auto-restart on system reboot
pm2 save
pm2 startup systemd
# (Copy and execute the sudo env command printed by pm2 startup)
```

Verify backend process status:
```bash
pm2 status
pm2 logs saferoute-backend --lines 20
```

---

## 9. Web Admin Production Build

```bash
cd /var/www/saferoute/web-admin

# Copy production env template
cp .env.production.example .env
nano .env
```

Ensure `.env` contains:
```env
VITE_API_URL=/api
VITE_SOCKET_URL=https://YOUR_DOMAIN
```

Install and build:
```bash
npm ci
npm run build
```
Verify build output exists:
```bash
ls -la /var/www/saferoute/web-admin/dist
```

---

## 10. Nginx Reverse Proxy Setup

Copy the configuration template:
```bash
cp /var/www/saferoute/nginx/saferoute.conf /etc/nginx/sites-available/saferoute.conf
nano /etc/nginx/sites-available/saferoute.conf
```
*Replace `YOUR_DOMAIN` with your actual domain (e.g., `saferoute.polonoling.edu.ph`).*

Enable the site and remove default Nginx config:
```bash
ln -s /etc/nginx/sites-available/saferoute.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx syntax
nginx -t
systemctl reload nginx
```

---

## 11. Let's Encrypt SSL via Certbot

Install Certbot for Nginx:
```bash
apt install -y certbot python3-certbot-nginx

# Obtain and install SSL certificates automatically
certbot --nginx -d YOUR_DOMAIN -d www.YOUR_DOMAIN
```
*Certbot will automatically update `/etc/nginx/sites-available/saferoute.conf` with valid SSL cert directives.*

Test automatic certificate renewal:
```bash
certbot renew --dry-run
```

---

## 12. Flutter Mobile Production Configuration

When building release binaries for Android/iOS:
```bash
cd mobile-app

# Production Release Build with dynamic API & Socket URLs
flutter build apk --release \
  --dart-define=API_BASE_URL=https://YOUR_DOMAIN/api \
  --dart-define=SOCKET_URL=https://YOUR_DOMAIN
```

---

## 13. Automated Database Backup Setup

Make scripts executable:
```bash
chmod +x /var/www/saferoute/scripts/backup_db.sh
chmod +x /var/www/saferoute/scripts/restore_db.sh
```

Configure a daily cron job at 2:00 AM:
```bash
crontab -e
```
Add the following line:
```cron
0 2 * * * PGPASSWORD='YOUR_DB_PASSWORD' /var/www/saferoute/scripts/backup_db.sh >> /var/log/saferoute_backup.log 2>&1
```

---

## 14. Zero-Downtime Safe Application Updates

To deploy new code updates in the future:
```bash
cd /var/www/saferoute

# 1. Pull latest git changes
git pull origin main

# 2. Update backend and run migrations
cd backend
npm ci --omit=dev
npm run build
npm run db:migrate:prod
pm2 reload saferoute-backend

# 3. Update web admin
cd ../web-admin
npm ci
npm run build

echo "✅ SafeRoute updated successfully!"
```

---

## Post-Deployment Smoke Test Checklist

Test each endpoint from your terminal or browser:
- [ ] **Health Endpoint**:
  ```bash
  curl -i https://YOUR_DOMAIN/api/health
  # Expected: HTTP 200 OK {"status":"ok","service":"SafeRoute Backend API","database":"connected",...}
  ```
- [ ] **Web Admin Access**: Navigate to `https://YOUR_DOMAIN` in browser. Map should load satellite imagery and buildings.
- [ ] **SSL Security**: Verify browser padlock shows valid Let's Encrypt certificate.
- [ ] **Socket.IO Real-Time Connection**: Open Developer Tools -> Network -> WS. Verify `101 Switching Protocols` on `/socket.io/`.
- [ ] **Login Test**: Login as admin or coordinator.
- [ ] **Hazard Pinning & Routing**: Pin a test hazard. Check that the hazard badge appears and that A* routing dynamically recalculates around the hazard radius.
- [ ] **Mobile App**: Launch Flutter app on real device. Confirm active alert broadcast arrives via WebSocket.

---

## Troubleshooting Guide

| Issue | Root Cause | Solution |
|---|---|---|
| **502 Bad Gateway** | Backend PM2 process is down or port mismatch | Check `pm2 status` and `pm2 logs saferoute-backend`. Ensure backend is listening on `127.0.0.1:5000`. |
| **CORS Blocked** | Browser blocked request because `CORS_ORIGIN` does not match domain | Check `backend/.env`. Ensure `CORS_ORIGIN=https://YOUR_DOMAIN` matches the browser address exactly. |
| **Socket Connection Error** | Nginx missing WebSocket upgrade headers | Verify `proxy_set_header Upgrade $http_upgrade;` and `proxy_set_header Connection "upgrade";` in `/etc/nginx/sites-available/saferoute.conf`. |
| **Database Connection Refused** | PostgreSQL service stopped or invalid password | Run `systemctl status postgresql`. Verify password in `backend/.env` against `psql -U saferoute_app -d saferoute_db`. |
| **Hazard Photos 404** | Uploads directory permission issue | Run `chmod -R 755 /var/www/saferoute/backend/uploads`. |
