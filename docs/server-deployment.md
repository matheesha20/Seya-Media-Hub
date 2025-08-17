# Server Deployment Guide for Seya Media Hub

This guide will help you deploy the Seya Media Hub on your server.

## 🚀 **Quick Start (Recommended)**

### **1. Run the Automated Setup**

```bash
# Clone the repository
git clone <your-repo-url>
cd Seya-Media-Hub

# Run the automated setup script
npm run setup:server
```

This script will:
- ✅ Install Node.js 18
- ✅ Install Docker & Docker Compose
- ✅ Create necessary files
- ✅ Install all dependencies
- ✅ Set up Prisma

### **2. Configure Environment**

Edit the `.env` file with your BunnyCDN settings:

```env
NODE_ENV=production
PORT=8080

# Database
DATABASE_URL=postgres://mediahub:mediahub@localhost:5432/mediahub

# Redis
REDIS_URL=redis://localhost:6379

# Storage (BunnyCDN)
S3_ENDPOINT=https://storage.bunnycdn.com
S3_REGION=auto
S3_BUCKET=seya-mediahub
S3_ACCESS_KEY=seya-mediahub
S3_SECRET_KEY=your_api_key_here

# CDN
CDN_PUBLIC_HOST=seya-mediahub.b-cdn.net

# JWT (Change this!)
JWT_SECRET=your-super-secret-jwt-key-change-this
```

### **3. Start Services**

```bash
# Start database and Redis
npm run start

# Run database migrations
npm run db:migrate

# Start the API server
cd apps/api && npm run dev
```

### **4. Test the Setup**

```bash
# Test BunnyCDN connection
./scripts/test-bunnycdn-curl.sh

# Test API health
curl http://localhost:8080/healthz
```

## 🔧 **Manual Setup (Alternative)**

If the automated script doesn't work, follow these steps:

### **1. Install Prerequisites**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
rm get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install FFmpeg
sudo apt install -y ffmpeg

# Logout and login again for Docker group to take effect
```

### **2. Install Dependencies**

```bash
# Install root dependencies
npm install

# Install API dependencies
cd apps/api
npm install
cd ../..

# Install dashboard dependencies
cd apps/dashboard
npm install
cd ../..

# Install database dependencies
cd packages/db
npm install
cd ../..
```

### **3. Set Up Database**

```bash
# Install Prisma CLI
npm install -g prisma

# Generate Prisma client
cd packages/db
npx prisma generate
cd ../..

# Start database
npm run start

# Run migrations
npm run db:migrate
```

## 🌐 **Production Deployment**

### **1. Domain & SSL Setup**

```bash
# Install nginx
sudo apt install nginx

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx
```

### **2. Nginx Configuration**

Create `/etc/nginx/sites-available/seya-media-hub`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:8080/;
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

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/seya-media-hub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### **3. SSL Certificate**

```bash
sudo certbot --nginx -d your-domain.com
```

### **4. PM2 Process Manager**

```bash
# Install PM2
npm install -g pm2

# Start API with PM2
cd apps/api
pm2 start "npm run dev" --name "seya-api"

# Start dashboard with PM2
cd ../dashboard
pm2 start "npm run dev" --name "seya-dashboard"

# Save PM2 configuration
pm2 save
pm2 startup
```

## 📊 **Monitoring & Maintenance**

### **1. Logs**

```bash
# View API logs
pm2 logs seya-api

# View dashboard logs
pm2 logs seya-dashboard

# View Docker logs
docker-compose logs -f
```

### **2. Database Backup**

```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec seya-media-hub-db-1 pg_dump -U mediahub mediahub > backup_$DATE.sql
gzip backup_$DATE.sql
EOF

chmod +x backup.sh

# Add to crontab for daily backups
echo "0 2 * * * /path/to/backup.sh" | crontab -
```

### **3. Updates**

```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Restart services
pm2 restart all
```

## 🔒 **Security Checklist**

- [ ] Change default JWT secret
- [ ] Set up firewall (UFW)
- [ ] Configure SSL certificates
- [ ] Set up database backups
- [ ] Enable rate limiting
- [ ] Configure proper file permissions
- [ ] Set up monitoring and alerts

### **Firewall Setup**

```bash
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## 🚨 **Troubleshooting**

### **Common Issues**

**1. Docker Permission Error**
```bash
sudo usermod -aG docker $USER
# Logout and login again
```

**2. Port Already in Use**
```bash
# Check what's using the port
sudo netstat -tulpn | grep :8080

# Kill the process
sudo kill -9 <PID>
```

**3. Database Connection Error**
```bash
# Check if database is running
docker ps | grep postgres

# Restart database
docker-compose restart db
```

**4. Prisma Generate Error**
```bash
# Install Prisma CLI globally
npm install -g prisma

# Generate client
cd packages/db && npx prisma generate
```

## 📈 **Performance Optimization**

### **1. Database Optimization**

```sql
-- Add indexes for better performance
CREATE INDEX idx_assets_account_id ON assets(account_id);
CREATE INDEX idx_usage_events_account_id ON usage_events(account_id);
CREATE INDEX idx_usage_events_at ON usage_events(at);
```

### **2. Redis Configuration**

Edit `docker-compose.yml` to add Redis configuration:

```yaml
redis:
  image: redis:7-alpine
  command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
  ports: ["6379:6379"]
```

### **3. Nginx Caching**

Add to nginx configuration:

```nginx
# Cache static assets
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Cache API responses
location /api/ {
    proxy_cache_valid 200 1h;
    proxy_cache_valid 404 1m;
}
```

## 🎯 **Production Checklist**

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] SSL certificates installed
- [ ] Domain configured
- [ ] Firewall enabled
- [ ] Monitoring set up
- [ ] Backups configured
- [ ] Process manager (PM2) running
- [ ] Logs being collected
- [ ] Performance optimized

Your Seya Media Hub is now ready for production use! 🚀
