#!/bin/bash

echo "🧪 Testing Snappy Setup"
echo "======================="

# Test nginx frontend
echo "1. Testing nginx frontend (port 80)..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:80 | grep -q "200"; then
    echo "✅ Frontend accessible via nginx"
else
    echo "❌ Frontend not accessible via nginx"
fi

# Test backend directly
echo "2. Testing backend directly (port 3000)..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health | grep -q "200"; then
    echo "✅ Backend accessible directly"
else
    echo "❌ Backend not accessible directly"
fi

# Test backend via nginx
echo "3. Testing backend via nginx (/health)..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost/health | grep -q "200"; then
    echo "✅ Backend accessible via nginx"
else
    echo "❌ Backend not accessible via nginx"
fi

# Test container status
echo "4. Checking container status..."
docker-compose ps

echo ""
echo "🎉 Setup Test Complete!"
echo "======================"
echo "Frontend: http://localhost"
echo "Backend API: http://localhost:3000"
echo "Health Check: http://localhost/health"
echo ""
echo "For EC2 deployment:"
echo "Frontend: http://YOUR_EC2_IP"
echo "Backend API: http://YOUR_EC2_IP:3000"
echo "Health Check: http://YOUR_EC2_IP/health"
