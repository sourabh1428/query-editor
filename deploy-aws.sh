#!/bin/bash

# AWS EC2 Deployment Script for SQL Analytics Platform
# This script automates the deployment process on EC2

set -e  # Exit on any error

echo "🚀 Starting AWS EC2 Deployment for SQL Analytics Platform"
echo "========================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running on EC2
check_ec2() {
    print_status "Checking if running on EC2..."
    if curl -s http://169.254.169.254/latest/meta-data/instance-id &>/dev/null; then
        print_status "Running on EC2 instance"
        INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
        PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
        echo "Instance ID: $INSTANCE_ID"
        echo "Public IP: $PUBLIC_IP"
    else
        print_error "Not running on EC2 instance!"
        exit 1
    fi
}

# Update system
update_system() {
    print_status "Updating system packages..."
    sudo yum update -y
}

# Install Docker
install_docker() {
    print_status "Installing Docker..."
    if ! command -v docker &> /dev/null; then
        sudo yum install -y docker
        sudo systemctl start docker
        sudo systemctl enable docker
        sudo usermod -a -G docker ubuntu
        print_status "Docker installed successfully"
    else
        print_status "Docker already installed"
    fi
}

# Install Docker Compose
install_docker_compose() {
    print_status "Installing Docker Compose..."
    if ! command -v docker-compose &> /dev/null; then
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        print_status "Docker Compose installed successfully"
    else
        print_status "Docker Compose already installed"
    fi
}

# Install Git
install_git() {
    print_status "Installing Git..."
    if ! command -v git &> /dev/null; then
        sudo yum install -y git
        print_status "Git installed successfully"
    else
        print_status "Git already installed"
    fi
}

# Clone repository
clone_repository() {
    print_status "Cloning repository..."
    if [ -d "query-editor" ]; then
        print_warning "Repository already exists, pulling latest changes..."
        cd query-editor
        git pull origin main
    else
        git clone https://github.com/sourabh1428/query-editor.git
        cd query-editor
    fi
}

# Generate secure passwords
generate_secrets() {
    print_status "Generating secure secrets..."
    
    # Generate random passwords
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    JWT_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    
    echo "Generated secure passwords ✅"
}

# Create production environment file
create_env_file() {
    print_status "Creating production environment file..."
    
    cat > .env.production << EOF
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
EOF

    print_status "Environment file created"
}

# Create production docker-compose override
create_production_compose() {
    print_status "Creating production docker-compose configuration..."
    
    cat > docker-compose.production.yml << EOF
version: '3.8'

services:
  db:
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: sqlanalytics
    volumes:
      - postgres_data:/var/lib/postgresql/data
      
  backend:
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@db:5432/sqlanalytics
      JWT_SECRET: ${JWT_SECRET}
      FLASK_ENV: production
      PORT: 5000
      FRONTEND_URL: http://${PUBLIC_IP}:3000
    depends_on:
      - db
      
  frontend:
    restart: unless-stopped
    environment:
      VITE_API_URL: http://${PUBLIC_IP}:5000
      NODE_ENV: production
    depends_on:
      - backend

volumes:
  postgres_data:
    external: false
EOF

    print_status "Production docker-compose configuration created"
}

# Start application
start_application() {
    print_status "Starting SQL Analytics Platform..."
    
    # Stop any existing containers
    docker-compose down &>/dev/null || true
    
    # Remove old volumes if they exist (optional, comment out to preserve data)
    # docker volume rm query-editor_postgres_data &>/dev/null || true
    
    # Start the application
    docker-compose -f docker-compose.yml -f docker-compose.production.yml up -d
    
    print_status "Application started successfully"
}

# Wait for services to be ready
wait_for_services() {
    print_status "Waiting for services to be ready..."
    
    echo "Waiting for backend to be ready..."
    for i in {1..30}; do
        if curl -s http://localhost:5000/api/health &>/dev/null; then
            print_status "Backend is ready"
            break
        fi
        echo "Attempt $i/30 - Backend not ready yet, waiting..."
        sleep 10
    done
    
    echo "Waiting for frontend to be ready..."
    for i in {1..20}; do
        if curl -s http://localhost:3000/health &>/dev/null; then
            print_status "Frontend is ready"
            break
        fi
        echo "Attempt $i/20 - Frontend not ready yet, waiting..."
        sleep 5
    done
}

# Check service status
check_services() {
    print_status "Checking service status..."
    
    echo ""
    echo "📊 Service Status:"
    docker-compose ps
    
    echo ""
    echo "🔍 Service Logs (last 10 lines):"
    echo "Backend logs:"
    docker-compose logs --tail=10 backend
    
    echo ""
    echo "Frontend logs:"
    docker-compose logs --tail=10 frontend
}

# Setup firewall (if UFW is available)
setup_firewall() {
    if command -v ufw &> /dev/null; then
        print_status "Setting up firewall..."
        sudo ufw allow 22    # SSH
        sudo ufw allow 80    # HTTP
        sudo ufw allow 443   # HTTPS
        sudo ufw allow 3000  # Frontend
        sudo ufw allow 5000  # Backend
        sudo ufw --force enable
        print_status "Firewall configured"
    else
        print_warning "UFW not available, make sure Security Group allows necessary ports"
    fi
}

# Create systemd service for auto-start
create_systemd_service() {
    print_status "Creating systemd service for auto-start..."
    
    cat > /tmp/sql-analytics.service << EOF
[Unit]
Description=SQL Analytics Platform
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ubuntu/query-editor
ExecStart=/usr/local/bin/docker-compose -f docker-compose.yml -f docker-compose.production.yml up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0
User=ubuntu

[Install]
WantedBy=multi-user.target
EOF

    sudo mv /tmp/sql-analytics.service /etc/systemd/system/
    sudo systemctl enable sql-analytics.service
    print_status "Systemd service created and enabled"
}

# Main deployment function
main() {
    echo "Starting deployment process..."
    
    check_ec2
    update_system
    install_docker
    install_docker_compose
    install_git
    clone_repository
    generate_secrets
    create_env_file
    create_production_compose
    start_application
    wait_for_services
    check_services
    setup_firewall
    create_systemd_service
    
    echo ""
    echo "🎉 Deployment completed successfully!"
    echo "======================================="
    echo ""
    echo "📱 Application URLs:"
    echo "Frontend: http://${PUBLIC_IP}:3000"
    echo "Backend API: http://${PUBLIC_IP}:5000"
    echo "API Health: http://${PUBLIC_IP}:5000/api/health"
    echo "API Docs: http://${PUBLIC_IP}:5000/api-docs/"
    echo ""
    echo "🔑 Database Credentials:"
    echo "Username: postgres"
    echo "Password: ${DB_PASSWORD}"
    echo ""
    echo "🛡️  Security Notes:"
    echo "- Make sure your Security Group allows ports 3000 and 5000"
    echo "- Consider setting up SSL/HTTPS for production"
    echo "- Database password is stored in .env.production file"
    echo ""
    echo "📊 To view logs:"
    echo "docker-compose logs -f"
    echo ""
    echo "🔄 To restart services:"
    echo "docker-compose restart"
    echo ""
    echo "🛑 To stop services:"
    echo "docker-compose down"
}

# Check if script is run with sudo (it shouldn't be)
if [ "$EUID" -eq 0 ]; then 
    print_error "Please run this script as regular user (ubuntu), not as root"
    exit 1
fi

# Run main function
main 