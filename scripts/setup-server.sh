#!/bin/bash

echo "🚀 Setting up Seya Media Hub on Server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

echo "✅ Prerequisites check passed"

# Create .env.example if it doesn't exist
if [ ! -f .env.example ]; then
    echo "📝 Creating .env.example file..."
    cat > .env.example << 'EOF'
NODE_ENV=development
PORT=8080

# Postgres
DATABASE_URL=postgres://mediahub:mediahub@localhost:5432/mediahub

# Redis
REDIS_URL=redis://localhost:6379

# Storage (S3 compatible)
S3_ENDPOINT=https://s3.backblazeb2.com
S3_REGION=auto
S3_BUCKET=seya-media
S3_ACCESS_KEY=your_access_key_here
S3_SECRET_KEY=your_secret_key_here

# CDN
CDN_PUBLIC_HOST=cdn.seya.media

# JWT
JWT_SECRET=your_jwt_secret_here_change_in_production

# FFmpeg
FFMPEG_PATH=/usr/bin/ffmpeg

# Optional billing/webhooks
WEBHOOK_SIGNING_SECRET=whsec_your_webhook_secret_here

# Rate limiting
RATE_LIMIT_REQUESTS_PER_SECOND=50
RATE_LIMIT_BURST_SIZE=100

# Transform limits
MAX_IMAGE_DIMENSION=6000
MAX_IMAGE_QUALITY=95
MAX_OUTPUT_SIZE_MB=25
EOF
fi

# Copy .env.example to .env if .env doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your configuration before starting services"
fi

# Install dependencies in each package
echo "📦 Installing dependencies..."

# Install root dependencies
npm install

# Install database package dependencies
cd packages/db
npm install
cd ../..

# Install API package dependencies
cd apps/api
npm install
cd ../..

# Install dashboard package dependencies
cd apps/dashboard
npm install
cd ../..

echo "🗄️  Setting up database..."

# Install Prisma CLI globally
npm install -g prisma

# Generate Prisma client
cd packages/db
npx prisma generate
cd ../..

echo "🎉 Server setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your BunnyCDN configuration"
echo "2. Run 'npm run start' to start database and Redis"
echo "3. Run 'npm run db:migrate' to run database migrations"
echo "4. Run 'npm run dev' to start development servers"
echo ""
echo "For production deployment:"
echo "1. Set NODE_ENV=production in .env"
echo "2. Configure your domain and SSL certificates"
echo "3. Set up reverse proxy (nginx) if needed"
echo ""
echo "Visit http://localhost:3000 to access the dashboard"
