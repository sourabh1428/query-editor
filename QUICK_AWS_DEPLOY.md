# 🚀 Quick AWS Deployment Guide

## **Prerequisites**
- Your AWS PEM file: `khushi-learn.pem` ✅
- AWS EC2 instance launched with matching key pair

## **Step 1: Launch EC2 Instance**

### **In AWS Console:**
1. Go to **EC2 Dashboard** → **Launch Instance**
2. **Configuration:**
   - **Name**: `sql-analytics-platform`
   - **AMI**: Amazon Linux 2023 (Free Tier eligible)
   - **Instance Type**: `t2.micro` (Free tier) or `t3.medium` (better performance)
   - **Key Pair**: Select the key pair matching your `khushi-learn.pem`
   - **Security Group**: Create new with these inbound rules:
     ```
     SSH (22)        - Your IP address
     HTTP (80)       - 0.0.0.0/0
     HTTPS (443)     - 0.0.0.0/0
     Custom (3000)   - 0.0.0.0/0  (Frontend)
     Custom (5000)   - 0.0.0.0/0  (Backend API)
     ```
   - **Storage**: 20GB (sufficient for your app)

3. **Launch Instance** and wait for it to be running

## **Step 2: Get Your Instance IP**
```bash
# From AWS Console, copy your instance's "Public IPv4 address"
# Example: 54.123.45.67
```

## **Step 3: Connect and Deploy**

### **From your local machine (Windows PowerShell):**

```powershell
# Set correct permissions for PEM file
icacls khushi-learn.pem /inheritance:r
icacls khushi-learn.pem /grant:r "$($env:USERNAME):R"

# Connect to your EC2 instance (replace with your IP)
ssh -i khushi-learn.pem ec2-user@YOUR_EC2_PUBLIC_IP

# Once connected to EC2, run the automated deployment:
curl -sSL https://raw.githubusercontent.com/sourabh1428/query-editor/main/deploy-aws.sh | bash
```

### **Alternative: Manual Upload and Deploy**
If the curl method doesn't work:

```powershell
# Copy deployment script to EC2
scp -i khushi-learn.pem deploy-aws.sh ec2-user@YOUR_EC2_PUBLIC_IP:~/

# Connect and run
ssh -i khushi-learn.pem ec2-user@YOUR_EC2_PUBLIC_IP
chmod +x deploy-aws.sh
./deploy-aws.sh
```

## **Step 4: Access Your Application**

After deployment completes (5-10 minutes):

- **Frontend**: `http://YOUR_EC2_PUBLIC_IP:3000`
- **Backend API**: `http://YOUR_EC2_PUBLIC_IP:5000`
- **API Health**: `http://YOUR_EC2_PUBLIC_IP:5000/api/health`
- **API Docs**: `http://YOUR_EC2_PUBLIC_IP:5000/api-docs/`

## **Example Commands**

Replace `54.123.45.67` with your actual EC2 public IP:

```powershell
# Connect to EC2
ssh -i khushi-learn.pem ec2-user@54.123.45.67

# Deploy (run this inside EC2)
curl -sSL https://raw.githubusercontent.com/sourabh1428/query-editor/main/deploy-aws.sh | bash
```

## **Troubleshooting**

### **Common Issues:**

1. **Permission denied (PEM file)**:
   ```powershell
   icacls khushi-learn.pem /inheritance:r
   icacls khushi-learn.pem /grant:r "$($env:USERNAME):R"
   ```

2. **Connection timeout**:
   - Check Security Group allows SSH (port 22) from your IP
   - Verify EC2 instance is running

3. **Application not accessible**:
   - Check Security Group allows ports 3000 and 5000
   - Wait 5-10 minutes for containers to start
   - Check logs: `docker-compose logs -f`

4. **Deployment script fails**:
   - Ensure you're connected as `ec2-user`
   - Check internet connectivity: `ping google.com`
   - Try manual installation steps from AWS_DEPLOYMENT_GUIDE.md

## **Monitoring**

```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Stop all services
docker-compose down
```

## **Cost Information**

### **Free Tier (t2.micro):**
- **Instance**: Free for first 12 months
- **Storage**: Free up to 30GB
- **Data Transfer**: Free up to 15GB/month
- **Total**: $0/month (for first year)

### **Upgraded (t3.medium):**
- **Instance**: ~$30/month
- **Storage**: ~$2/month
- **Data Transfer**: ~$1/month
- **Total**: ~$33/month

## **Next Steps**

1. **Set up domain** (optional): Update VITE_API_URL with your domain
2. **SSL certificate**: Use Certbot for HTTPS
3. **Monitoring**: Set up CloudWatch monitoring
4. **Backups**: Configure database backups
5. **Auto-scaling**: Consider ECS/Fargate for production

---

**🎯 Ready to deploy? Just run these commands:**

```powershell
# 1. Connect to EC2
ssh -i khushi-learn.pem ec2-user@YOUR_EC2_PUBLIC_IP

# 2. Deploy (inside EC2)
curl -sSL https://raw.githubusercontent.com/sourabh1428/query-editor/main/deploy-aws.sh | bash
```

**That's it! Your SQL Analytics Platform will be live in ~10 minutes! 🚀** 