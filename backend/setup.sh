#!/bin/bash

# Setup script for Habit Track Backend

echo "🚀 Habit Track Backend Setup"
echo "============================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
DOCKER_COMPOSE_CMD=""
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
else
    echo "❌ Docker Compose is not installed. Please install Docker/Docker Compose first."
    exit 1
fi

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo "❌ Java is not installed. Please install Java 17 or higher."
    exit 1
fi

# Check if Maven is installed
if ! command -v mvn &> /dev/null; then
    echo "❌ Maven is not installed. Please install Maven."
    exit 1
fi

echo "✅ All prerequisites are installed"
echo ""

# Start MongoDB
echo "📦 Starting MongoDB..."
$DOCKER_COMPOSE_CMD up -d

echo "⏳ Waiting for MongoDB to start..."
sleep 5

echo "✅ MongoDB is running"
echo "   - MongoDB: localhost:27017"
echo "   - Mongo Express UI: http://localhost:8081"
echo ""

# Build the project
echo "🔨 Building Spring Boot application..."
mvn clean package -DskipTests

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
    echo ""
    echo "🎉 Setup complete!"
    echo ""
    echo "To start the application:"
    echo "  mvn spring-boot:run"
    echo ""
    echo "API will be available at: http://localhost:8080"
    echo "MongoDB data: http://localhost:8081"
else
    echo "❌ Build failed. Please check the error messages above."
    exit 1
fi
