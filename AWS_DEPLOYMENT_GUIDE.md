# AWS Deployment Guide - SQL Analytics Platform

This guide provides multiple options to deploy your SQL Analytics Platform to AWS.

## 🏗️ **Deployment Options**

### **Option 1: EC2 with Docker (Recommended)**
- **Best for**: Full control, cost-effective, learning
- **Complexity**: Medium
- **Cost**: Low (Free tier eligible)

### **Option 2: ECS with Fargate**
- **Best for**: Production, scalability, managed infrastructure
- **Complexity**: Medium-High
- **Cost**: Medium

### **Option 3: AWS App Runner**
- **Best for**: Simplicity, quick deployment
- **Complexity**: Low
- **Cost**: Medium

---

## 🎯 **Option 1: EC2 with Docker Deployment**

### **Prerequisites**
- AWS Account
- Your PEM key file (`khushi-learn.pem`)
- AWS CLI installed (optional but recommended)

### **Step 1: Launch EC2 Instance**

#### **Using AWS Console:**
1. Go to EC2 Dashboard
2. Click "Launch Instance"
3. **Configuration:**
   - **Name**: `sql-analytics-platform`
   - **AMI**: Amazon Linux 2023
   - **Instance Type**: `t3.medium` (or `t2.micro` for free tier)
   - **Key Pair**: Select the key pair matching your `khushi-learn.pem`
   - **Security Group**: Create new with these rules:
     - SSH (22) - Your IP
     - HTTP (80) - 0.0.0.0/0
     - HTTPS (443) - 0.0.0.0/0
     - Custom (3000) - 0.0.0.0/0 (Frontend)
     - Custom (5000) - 0.0.0.0/0 (Backend API)
   - **Storage**: 20GB gp3

### **Step 2: Connect to EC2**
```bash
# Make sure your PEM file has correct permissions
chmod 400 khushi-learn.pem

# Connect to your instance
ssh -i khushi-learn.pem ec2-user@<YOUR-EC2-PUBLIC-IP>
```

### **Step 3: Setup EC2 Instance**
```bash
# Update system
sudo yum update -y

# Install Docker
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
sudo yum install -y git

# Logout and login again for docker group to take effect
exit
ssh -i khushi-learn.pem ec2-user@<YOUR-EC2-PUBLIC-IP>
```

### **Step 4: Deploy Application**
```bash
# Clone your repository
git clone https://github.com/sourabh1428/query-editor.git
cd query-editor

# Create production environment file
cat > .env.production << EOF
# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=$(openssl rand -base64 32)
POSTGRES_DB=sqlanalytics

# Backend Configuration  
JWT_SECRET=$(openssl rand -base64 32)
FLASK_ENV=production
DATABASE_URL=postgresql://postgres:$(openssl rand -base64 32)@db:5432/sqlanalytics

# Frontend Configuration
VITE_API_URL=http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):5000
EOF

# Start the application
docker-compose --env-file .env.production up -d

# Check status
docker-compose ps
```

### **Step 5: Setup Domain (Optional)**
If you have a domain name:
```bash
# Update VITE_API_URL in .env.production
sed -i 's/VITE_API_URL=.*/VITE_API_URL=https:\/\/your-domain.com/' .env.production

# Restart containers
docker-compose --env-file .env.production down
docker-compose --env-file .env.production up -d
```

---

## 🚀 **Option 2: ECS with Fargate**

### **Benefits**
- Fully managed container orchestration
- Auto-scaling
- Load balancing
- No server management

### **Architecture**
- **ALB (Application Load Balancer)** → **ECS Services**
- **RDS PostgreSQL** (managed database)
- **ECS Tasks** running in Fargate

### **Prerequisites**
- AWS CLI configured
- Docker images pushed to ECR

### **Deployment Steps**
```bash
# 1. Create ECR repositories
aws ecr create-repository --repository-name sql-analytics-frontend
aws ecr create-repository --repository-name sql-analytics-backend

# 2. Build and push images
# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ACCOUNT-ID>.dkr.ecr.us-east-1.amazonaws.com

# Build and tag images
docker build -t sql-analytics-frontend .
docker build -t sql-analytics-backend ./backend

docker tag sql-analytics-frontend:latest <ACCOUNT-ID>.dkr.ecr.us-east-1.amazonaws.com/sql-analytics-frontend:latest
docker tag sql-analytics-backend:latest <ACCOUNT-ID>.dkr.ecr.us-east-1.amazonaws.com/sql-analytics-backend:latest

# Push images
docker push <ACCOUNT-ID>.dkr.ecr.us-east-1.amazonaws.com/sql-analytics-frontend:latest
docker push <ACCOUNT-ID>.dkr.ecr.us-east-1.amazonaws.com/sql-analytics-backend:latest
```

---

## 📱 **Option 3: AWS App Runner**

### **Benefits**
- Simplest deployment
- Automatic scaling
- Built-in load balancing
- HTTPS by default

### **Requirements**
- Source code in GitHub
- Dockerfile in repository

### **Deployment Steps**
1. Go to AWS App Runner console
2. Create service
3. Connect to your GitHub repository
4. Configure build settings
5. Deploy

---

## 🔧 **Production Considerations**

### **Database**
**For Production, use RDS instead of containerized PostgreSQL:**

```bash
# Create RDS PostgreSQL instance
aws rds create-db-instance \
  --db-name sqlanalytics \
  --db-instance-identifier sql-analytics-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password YourSecurePassword123! \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxxxxx \
  --backup-retention-period 7 \
  --multi-az
```

### **SSL/HTTPS Setup**
```bash
# Install Certbot for Let's Encrypt
sudo yum install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

### **Monitoring & Logging**
```bash
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
sudo rpm -U ./amazon-cloudwatch-agent.rpm

# Configure logging
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard
```

## 💰 **Cost Estimation**

### **EC2 Option**
- **t3.medium**: ~$30/month
- **t2.micro** (free tier): $0/month (first 12 months)
- **Storage (20GB)**: ~$2/month
- **Data Transfer**: ~$1/month

### **ECS Fargate Option**
- **Fargate tasks**: ~$25-50/month
- **ALB**: ~$22/month
- **RDS**: ~$15-30/month

### **App Runner Option**
- **App Runner**: ~$25-40/month
- **RDS**: ~$15-30/month

## 🔒 **Security Best Practices**

1. **Use IAM roles** instead of access keys
2. **Enable VPC** for network isolation
3. **Use RDS** for production database
4. **Enable CloudTrail** for audit logging
5. **Setup backup strategy**
6. **Use secrets manager** for sensitive data

## 🚀 **Quick Start Commands**

Choose your preferred option and I'll help you implement it step by step!

### **For EC2 Deployment:**
```bash
# After connecting to EC2
curl -sSL https://raw.githubusercontent.com/sourabh1428/query-editor/main/deploy-aws.sh | bash
```

### **For ECS Deployment:**
```bash
# Run from your local machine
aws cloudformation deploy --template-file ecs-deployment.yaml --stack-name sql-analytics-platform
```

---

## 📞 **Next Steps**

1. **Choose your deployment option**
2. **Set up AWS resources**
3. **Configure environment variables**
4. **Deploy and test**
5. **Set up monitoring**

Let me know which option you prefer, and I'll create the specific deployment scripts and configurations for you! 