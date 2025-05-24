# 🚀 GitHub Actions CI/CD Setup Guide

This guide will set up automatic deployment to your AWS EC2 instance whenever you push to the main branch.

## 📋 **What You'll Get**

- ✅ **Automatic Testing**: Runs tests on every commit
- ✅ **Automatic Building**: Builds frontend and backend
- ✅ **Automatic Deployment**: Deploys to EC2 on main branch pushes
- ✅ **Health Checks**: Verifies deployment success
- ✅ **Notifications**: Shows deployment status

## 🔧 **Setup Steps**

### **Step 1: Create GitHub Secrets**

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Create these secrets:

#### **1. EC2_SSH_KEY**
```
# Copy the ENTIRE content of your khushi-learn.pem file
# Make sure to include the BEGIN and END lines

-----BEGIN RSA PRIVATE KEY-----
[Your PEM key content here]
-----END RSA PRIVATE KEY-----
```

#### **2. EC2_HOST**
```
15.206.178.18
```

### **Step 2: Prepare Your EC2 Instance**

The GitHub Actions workflow will automatically handle deployment, but your EC2 instance needs initial setup:

#### **Option A: Manual Setup (One Time)**
```bash
# Connect to your EC2
ssh -i khushi-learn.pem ec2-user@15.206.178.18

# Run the initial setup script
curl -sSL https://raw.githubusercontent.com/sourabh1428/query-editor/main/deploy-aws.sh | bash
```

#### **Option B: Let GitHub Actions Handle It**
The workflow will automatically install Docker, Git, and clone your repository on first run.

### **Step 3: Test the Workflow**

1. **Commit and push any change** to the main branch:
   ```bash
   git add .
   git commit -m "Test GitHub Actions deployment"
   git push origin main
   ```

2. **Watch the deployment**:
   - Go to your GitHub repository
   - Click on **Actions** tab
   - You'll see the "Deploy to AWS EC2" workflow running

## 📊 **Workflow Stages**

### **Stage 1: Test and Build**
- ✅ Installs Node.js dependencies
- ✅ Runs tests (if any)
- ✅ Builds frontend application
- ✅ Tests Python backend imports

### **Stage 2: Deploy** (only on main branch)
- ✅ Connects to your EC2 instance via SSH
- ✅ Pulls latest code from GitHub
- ✅ Builds Docker containers with latest changes
- ✅ Starts/restarts all services
- ✅ Waits for services to be ready

### **Stage 3: Health Check**
- ✅ Verifies backend API is responding
- ✅ Checks frontend accessibility
- ✅ Reports deployment status

### **Stage 4: Notification**
- ✅ Shows final deployment status
- ✅ Provides application URLs
- ✅ Reports any failures

## 🔄 **How It Works**

### **Triggers**
- **Push to main**: Triggers full deployment
- **Pull Request**: Runs tests only (no deployment)

### **Process Flow**
```mermaid
graph TD
    A[Push to main] --> B[Test & Build]
    B --> C{Tests Pass?}
    C -->|Yes| D[Deploy to EC2]
    C -->|No| E[❌ Stop]
    D --> F[Health Check]
    F --> G{Healthy?}
    G -->|Yes| H[✅ Success]
    G -->|No| I[❌ Failed]
```

## 🎯 **Example Workflow Run**

When you push to main, you'll see:

```
🚀 Deploy to AWS EC2
├── ✅ test-and-build (2m 30s)
│   ├── ✅ Checkout code
│   ├── ✅ Setup Node.js
│   ├── ✅ Install dependencies
│   ├── ✅ Run tests
│   ├── ✅ Build frontend
│   └── ✅ Test backend
├── ✅ deploy (5m 15s)
│   ├── ✅ Checkout code
│   ├── ✅ Setup SSH
│   ├── ✅ Deploy to EC2
│   ├── ✅ Health Check
│   └── ✅ Send notification
└── ✅ notify (30s)
    └── ✅ Deployment Status
```

## 📱 **After Successful Deployment**

You'll see output like:
```
✅ Deployment to AWS EC2 completed successfully!
🌐 Your application is live at:
   Frontend: http://15.206.178.18:3000
   Backend API: http://15.206.178.18:5000
   API Docs: http://15.206.178.18:5000/api-docs/
```

## 🛠️ **Troubleshooting**

### **Common Issues:**

#### **1. SSH Connection Failed**
```yaml
Error: Permission denied (publickey)
```
**Solution**: Check that `EC2_SSH_KEY` secret contains the exact content of your `khushi-learn.pem` file.

#### **2. EC2 Host Unreachable**
```yaml
Error: Connection timed out
```
**Solution**: 
- Verify `EC2_HOST` secret has correct IP: `15.206.178.18`
- Check EC2 Security Group allows SSH (port 22)

#### **3. Docker Not Running**
```yaml
Error: Cannot connect to Docker daemon
```
**Solution**: The workflow will automatically start Docker, but ensure your EC2 user is in the docker group.

#### **4. Port Not Accessible**
```yaml
Error: Health check failed
```
**Solution**: Check Security Group allows ports 3000 and 5000.

### **Debug Steps:**

1. **Check workflow logs**:
   - Go to Actions tab in GitHub
   - Click on failed workflow
   - Expand failed step to see detailed logs

2. **SSH to EC2 manually**:
   ```bash
   ssh -i khushi-learn.pem ec2-user@15.206.178.18
   docker-compose ps
   docker-compose logs
   ```

3. **Check GitHub secrets**:
   - Repository → Settings → Secrets and variables → Actions
   - Verify `EC2_SSH_KEY` and `EC2_HOST` are set correctly

## ⚙️ **Customization Options**

### **Deploy on Different Branches**
Edit `.github/workflows/deploy-to-aws.yml`:
```yaml
on:
  push:
    branches: [ main, develop, staging ]  # Add more branches
```

### **Add Environment-Specific Deployments**
```yaml
- name: Deploy to Staging
  if: github.ref == 'refs/heads/staging'
  run: |
    # Deploy to staging server
    
- name: Deploy to Production  
  if: github.ref == 'refs/heads/main'
  run: |
    # Deploy to production server
```

### **Add Slack/Discord Notifications**
```yaml
- name: Notify Slack
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## 📈 **Advanced Features**

### **Rollback Support**
The workflow keeps Docker images, so you can rollback manually:
```bash
# SSH to EC2
ssh -i khushi-learn.pem ec2-user@15.206.178.18

# Rollback to previous version
cd query-editor
git log --oneline -5  # Find previous commit
git reset --hard <PREVIOUS_COMMIT_HASH>
docker-compose down
docker-compose up -d --build
```

### **Blue-Green Deployment**
For zero-downtime deployments, you can modify the workflow to:
1. Deploy to a staging environment
2. Run health checks
3. Switch traffic to new version
4. Keep old version as backup

### **Database Migrations**
Add database migration steps:
```yaml
- name: Run Database Migrations
  run: |
    ssh ec2-user@${{ secrets.EC2_HOST }} '
      cd query-editor
      docker-compose exec backend python manage.py migrate
    '
```

## 🚀 **Ready to Deploy?**

1. **Set up GitHub secrets** (EC2_SSH_KEY and EC2_HOST)
2. **Push to main branch**:
   ```bash
   git add .
   git commit -m "Set up GitHub Actions CI/CD"
   git push origin main
   ```
3. **Watch the magic happen** in the Actions tab! 🎉

Your SQL Analytics Platform will now automatically deploy every time you commit to main! 🚀

## 📞 **Need Help?**

- Check the **Actions** tab for detailed logs
- Verify your GitHub secrets are correct
- Ensure EC2 Security Group allows required ports
- Test SSH connection manually first

**Your CI/CD pipeline is ready to go! Every commit to main will automatically deploy to your AWS EC2 instance! 🎯** 