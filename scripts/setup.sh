#!/bin/bash

# Setup script for Snappy monorepo
echo "🔧 Setting up Snappy monorepo..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL first."
    echo "   On macOS: brew install postgresql"
    echo "   On Ubuntu: sudo apt-get install postgresql postgresql-contrib"
    exit 1
fi

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo "⚠️  PostgreSQL is not running. Starting PostgreSQL..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew services start postgresql
    else
        sudo systemctl start postgresql
    fi
fi

# Create database if it doesn't exist
echo "🗄️  Setting up database..."
psql -U postgres -c "CREATE DATABASE snappy_db;" 2>/dev/null || echo "Database already exists"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build shared types
echo "🔧 Building shared types..."
cd packages/shared-types
npm run build
cd ../..

# Generate Prisma client
echo "🔧 Generating Prisma client..."
cd apps/backend
npm run db:generate

# Run database migrations
echo "🔄 Running database migrations..."
npm run db:migrate

cd ../..

echo "✅ Setup complete! You can now run:"
echo "   npm run dev"
echo ""
echo "Backend will be available at: http://localhost:3000"
echo "Frontend will be available at: http://localhost:5173" 