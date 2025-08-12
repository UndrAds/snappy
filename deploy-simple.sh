#!/bin/bash

echo "🚀 Deploying Snappy with Nginx Frontend + Localhost Backend Communication"

# Create uploads directory
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
echo "Backend API: http://YOUR_EC2_IP:3000"
echo "Health Check: http://YOUR_EC2_IP/health"
echo ""
echo "How it works:"
echo "- Nginx serves frontend on port 80 (root path)"
echo "- Frontend communicates with backend via localhost:3000"
echo "- Backend is exposed on port 3000 for direct access"
echo ""
echo "Test commands:"
echo "  curl http://YOUR_EC2_IP/health"
echo "  curl http://YOUR_EC2_IP:3000/health"
echo ""
echo "Management:"
echo "  View logs: docker-compose logs -f"
echo "  Restart: docker-compose restart"
echo "  Stop: docker-compose down"
