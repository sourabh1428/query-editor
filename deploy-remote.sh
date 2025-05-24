#!/bin/bash
set -e

echo "🚀 Starting GitHub Actions Deployment"
echo "======================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

# Navigate to application directory
APP_DIR="/home/ubuntu/query-editor"
cd "$APP_DIR" || {
    print_error "Application directory not found. Running initial setup..."
    cd /home/ubuntu || {
        print_error "Failed to access /home/ubuntu directory"
        exit 1
    }
    git clone https://github.com/sourabh1428/query-editor.git
    cd query-editor || {
        print_error "Failed to access cloned repository"
        exit 1
    }
}

# Install Docker if not installed
if ! command -v docker &> /dev/null; then
    print_status "Installing Docker..."
    sudo apt-get update
    sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
    sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io
    sudo usermod -aG docker ubuntu
fi

# Install Docker Compose if not installed
if ! command -v docker-compose &> /dev/null; then
    print_status "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Pull latest changes
print_status "Pulling latest changes from GitHub..."
git fetch origin
git reset --hard origin/main

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    print_error "Docker is not running. Starting Docker..."
    sudo systemctl start docker
    sleep 5
fi

# Generate production environment if it doesn't exist
if [ ! -f .env.production ]; then
    print_status "Creating production environment file..."
    
    PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    JWT_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    
    cat > .env.production << EOL
# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=${DB_PASSWORD}
POSTGRES_DB=sqlanalytics

# Backend Configuration  
JWT_SECRET=${JWT_SECRET}
FLASK_ENV=production
DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@db:5432/sqlanalytics

# Frontend Configuration
VITE_API_URL=http://${PUBLIC_IP}:5000
NODE_ENV=production

# CORS Configuration
FRONTEND_URL=http://${PUBLIC_IP}:3000
EOL
fi

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose down || true

# Remove old images to force rebuild
print_status "Cleaning up old images..."
docker-compose -f docker-compose.yml -f docker-compose.production.yml pull || true
docker system prune -f || true

# Build and start containers
print_status "Building and starting containers..."
docker-compose -f docker-compose.yml -f docker-compose.production.yml up -d --build

# Wait for services to be ready
print_status "Waiting for services to be ready..."

# Wait for backend
for i in {1..30}; do
    if curl -s http://localhost:5000/api/health >/dev/null 2>&1; then
        print_status "Backend is ready"
        break
    fi
    echo "Waiting for backend... attempt $i/30"
    sleep 10
done

# Wait for frontend  
for i in {1..20}; do
    if curl -s http://localhost:3000/health >/dev/null 2>&1; then
        print_status "Frontend is ready"
        break
    fi
    echo "Waiting for frontend... attempt $i/20"
    sleep 5
done

# Show status
print_status "Deployment completed!"
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "📱 Application URLs:"
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
echo "Frontend: http://${PUBLIC_IP}:3000"
echo "Backend API: http://${PUBLIC_IP}:5000"
echo "API Health: http://${PUBLIC_IP}:5000/api/health"
echo "API Docs: http://${PUBLIC_IP}:5000/api-docs/"

print_status "GitHub Actions deployment completed successfully! 🎉" 