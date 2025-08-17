#!/bin/bash

echo "🚀 Setting up Seya Media Hub..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your configuration before starting services"
else
    echo "✅ .env file already exists"
fi

# Generate Prisma client
echo "🗄️  Setting up database..."
cd packages/db
npm run generate
cd ../..

echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Run 'npm run start' to start database and Redis"
echo "3. Run 'npm run db:migrate' to run database migrations"
echo "4. Run 'npm run dev' to start development servers"
echo ""
echo "Visit http://localhost:3000 to access the dashboard"
