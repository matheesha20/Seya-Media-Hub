#!/bin/bash

echo "🚀 Setting up Seya Media Hub..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install

# Copy environment files
if [ ! -f .env ]; then
    echo "📝 Creating server .env file..."
    cp .env.example .env
    echo "⚠️  Please update server/.env with your configuration"
fi

cd ..

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client
npm install

# Copy environment files
if [ ! -f .env ]; then
    echo "📝 Creating client .env file..."
    cp .env.example .env
    echo "⚠️  Please update client/.env with your configuration"
fi

cd ..

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update server/.env with your MongoDB, Hetzner, and Cloudflare credentials"
echo "2. Update client/.env with your API endpoints"
echo "3. Start the development servers:"
echo "   - Backend: cd server && npm run dev"
echo "   - Frontend: cd client && npm start"
echo ""
echo "📚 Check README.md for detailed setup instructions"
