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
docker-compose build --no-cache
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

# Initialize admin user
echo "👤 Initializing admin user..."
# Wait a bit more to ensure backend is fully ready
sleep 5
if docker-compose ps backend | grep -q "Up"; then
    if docker-compose exec -T backend npx tsx apps/backend/scripts/init-admin.ts; then
        echo "✅ Admin user initialization completed"
    else
        echo "⚠️ Admin user initialization failed, but continuing deployment..."
    fi
else
    echo "⚠️ Backend container is not running, skipping admin initialization..."
fi

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
