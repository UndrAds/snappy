#!/bin/bash

# Simple deployment script for Snappy with nginx container routing

set -e

echo "🚀 Deploying Snappy Application with Nginx Container Routing"

# Create uploads directory if it doesn't exist
mkdir -p uploads

# Stop existing containers
echo "📦 Stopping existing containers..."
docker-compose down

# Build and start containers
echo "🔨 Building and starting containers..."
docker-compose build
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Run database migrations
echo "🗄️ Running database migrations..."
docker-compose exec -T backend npx prisma migrate deploy || {
    echo "⚠️ Migration failed, trying to reset database..."
    docker-compose exec -T backend npx prisma migrate reset --force
}

# Check service status
echo "📊 Checking service status..."
docker-compose ps

echo ""
echo "🎉 Deployment Complete!"
echo "======================"
echo "Frontend: http://YOUR_EC2_IP"
echo "Backend API: http://YOUR_EC2_IP/api"
echo "Health Check: http://YOUR_EC2_IP/health"
echo ""
echo "Management Commands:"
echo "  View logs: docker-compose logs -f"
echo "  Restart: docker-compose restart"
echo "  Stop: docker-compose down"
echo "  Start: docker-compose up -d"
echo ""
echo "Test the application:"
echo "  curl http://YOUR_EC2_IP/health"
