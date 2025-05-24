# SQL Analytics Platform - Deployment Guide

## Render Deployment

This guide provides step-by-step instructions for deploying the SQL Analytics Platform on Render.

### Prerequisites

1. **GitHub Repository**: Ensure your code is pushed to a GitHub repository
2. **Render Account**: Create a free account at [render.com](https://render.com)
3. **Domain Names** (optional): Custom domains for production use

### Deployment Architecture

The application consists of:
- **Frontend**: React/TypeScript application served via Nginx
- **Backend**: Python Flask API with PostgreSQL database
- **Database**: PostgreSQL instance

### Automated Deployment

The application is configured for automatic deployment using `render.yaml`. Simply:

1. **Connect Repository to Render**:
   - Login to Render dashboard
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Select the repository containing this code

2. **Render will automatically**:
   - Create the PostgreSQL database
   - Deploy the backend API service
   - Deploy the frontend web service
   - Configure environment variables
   - Set up health checks and auto-scaling

### Services Created

#### 1. Database Service
- **Name**: `sql-analytics-db`
- **Type**: PostgreSQL
- **Plan**: Free tier
- **Features**: Automatic backups, connection pooling

#### 2. Backend API Service
- **Name**: `sql-analytics-platform-api`
- **URL**: `https://sql-analytics-platform-api.onrender.com`
- **Health Check**: `/api/health`
- **Environment Variables**:
  - `DATABASE_URL`: Auto-generated from database service
  - `JWT_SECRET`: Auto-generated secure secret
  - `FLASK_ENV`: production
  - `PORT`: 5000

#### 3. Frontend Web Service
- **Name**: `sql-analytics-platform`
- **URL**: `https://sql-analytics-platform.onrender.com`
- **Health Check**: `/health`
- **Environment Variables**:
  - `VITE_API_URL`: Points to backend API service
  - `NODE_ENV`: production

### Environment Configuration

The application automatically detects the environment and configures itself accordingly:

#### Development Environment
- API URL: `http://localhost:5000/api`
- Database: Local PostgreSQL instance
- CORS: Permissive for local development

#### Production Environment
- API URL: Configured via `VITE_API_URL` environment variable
- Database: Render PostgreSQL service
- CORS: Restricted to frontend domain
- HTTPS: Automatically enabled
- Security headers: Enabled

### Database Initialization

The backend automatically:
1. Creates necessary database tables
2. Sets up indexes for performance
3. Creates an admin user with:
   - **Email**: `sppathak1428@gmail.com`
   - **Password**: `123123`
   - **Username**: `admin`

### Security Features

#### Production Security Headers
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

#### CORS Configuration
- Development: Permissive for localhost
- Production: Restricted to frontend domain

#### Authentication
- JWT tokens for secure authentication
- Auto-generated secure JWT secret
- Password hashing with bcrypt

### Monitoring and Health Checks

#### Health Endpoints
- **Frontend**: `GET /health` → Returns "healthy"
- **Backend**: `GET /api/health` → Returns JSON health status

#### Auto-Deploy Configuration
- Deploys automatically on push to `main` branch
- Build filters ensure only relevant changes trigger deployments
- Frontend rebuilds on: src/, package.json, Dockerfile changes
- Backend rebuilds on: backend/ changes

### Custom Domains (Optional)

To use custom domains:

1. **Frontend Custom Domain**:
   - Go to Render dashboard → Frontend service → Settings
   - Add custom domain (e.g., `analytics.yourdomain.com`)
   - Update DNS CNAME record

2. **Backend Custom Domain**:
   - Go to Render dashboard → Backend service → Settings  
   - Add custom domain (e.g., `api-analytics.yourdomain.com`)
   - Update `VITE_API_URL` environment variable in frontend

### Troubleshooting

#### Common Issues

1. **Build Failures**:
   - Check build logs in Render dashboard
   - Ensure all dependencies are listed in `package.json`/`requirements.txt`
   - Verify Dockerfile syntax

2. **Database Connection Issues**:
   - Verify `DATABASE_URL` environment variable
   - Check database service is running
   - Review backend logs for connection errors

3. **CORS Issues**:
   - Verify `VITE_API_URL` points to correct backend URL
   - Check backend CORS configuration
   - Ensure frontend and backend domains are correctly configured

4. **Authentication Issues**:
   - Verify `JWT_SECRET` is properly set
   - Check token storage in browser localStorage
   - Review backend authentication logs

#### Debugging Steps

1. **Check Service Status**:
   - All services should show "Live" status in Render dashboard

2. **Review Logs**:
   - Frontend logs: Build and runtime logs in Render dashboard
   - Backend logs: Application logs with detailed request/response info

3. **Test Endpoints**:
   - Frontend health: `https://your-frontend-url/health`
   - Backend health: `https://your-backend-url/api/health`
   - Backend API docs: `https://your-backend-url/api-docs/`

### Performance Optimization

#### Free Tier Limitations
- Services may sleep after 15 minutes of inactivity
- First request after sleep may take 30+ seconds (cold start)
- Database connections are limited

#### Upgrade Recommendations
For production use, consider upgrading to paid plans for:
- Faster spin-up times
- More database connections
- Better performance
- SSL certificates
- Custom domains

### Cost Estimation

#### Free Tier (Development/Testing)
- **PostgreSQL Database**: Free (1GB storage, 1 month retention)
- **Backend Service**: Free (750 build hours/month)
- **Frontend Service**: Free (100GB bandwidth/month)

#### Paid Plans (Production)
- **Starter Database**: $7/month (10GB storage, 7 day retention)
- **Starter Web Service**: $7/month per service
- **Professional Plans**: Higher performance and features

### Support and Documentation

- **Render Documentation**: [docs.render.com](https://docs.render.com)
- **Application Logs**: Available in Render dashboard
- **Health Monitoring**: Built-in health checks and uptime monitoring

### Maintenance

#### Regular Tasks
1. **Monitor Resource Usage**: Check database storage and bandwidth
2. **Review Logs**: Monitor for errors and performance issues
3. **Security Updates**: Keep dependencies updated
4. **Backup Management**: Ensure database backups are working

#### Updates and Deployments
- Push to `main` branch triggers automatic deployment
- Zero-downtime deployments for code updates
- Database migrations run automatically on backend startup

---

## Quick Start Checklist

- [ ] Repository connected to Render
- [ ] All three services deployed successfully
- [ ] Health checks passing
- [ ] Admin user can login
- [ ] Database tables created
- [ ] Frontend can communicate with backend
- [ ] HTTPS working correctly

Your SQL Analytics Platform should now be fully deployed and accessible!

## Quick Start (Using Provided Database)

### 1. Prepare Your Application
```bash
# Create a render.yaml file in your project root
services:
  - type: web
    name: sql-analytics-platform
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: VITE_API_URL
        value: https://your-app.onrender.com
      - key: JWT_SECRET
        generateValue: true
      - key: DATABASE_URL
        value: postgresql://ijp_user:JbufturibQwmucF0vl62pbzkBW6l1a9f@dpg-d0nimqmuk2gs73c1c6rg-a/ijp
```

### 2. Deploy to Render
1. Go to [render.com](https://render.com) and sign up/login
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - Name: `sql-analytics-platform`
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
5. Add Environment Variables:
   ```
   DATABASE_URL=postgresql://ijp_user:JbufturibQwmucF0vl62pbzkBW6l1a9f@dpg-d0nimqmuk2gs73c1c6rg-a/ijp
   JWT_SECRET=your-secret-key
   VITE_API_URL=https://your-app.onrender.com
   ```
6. Click "Create Web Service"

### 3. Verify Deployment
1. Wait for the build to complete
2. Test the database connection:
   ```bash
   # Install psql if not already installed
   # Then test connection
   psql "postgresql://ijp_user:JbufturibQwmucF0vl62pbzkBW6l1a9f@dpg-d0nimqmuk2gs73c1c6rg-a/ijp"
   ```

### 4. Run Database Migrations
```bash
# If using Prisma
npx prisma generate
npx prisma migrate deploy

# If using raw SQL
psql "postgresql://ijp_user:JbufturibQwmucF0vl62pbzkBW6l1a9f@dpg-d0nimqmuk2gs73c1c6rg-a/ijp" -f migrations/001_initial_schema.sql
```

## Option 1: Render (Recommended for Beginners)

### Prerequisites
- GitHub account
- Render account (sign up at render.com)

### Steps
1. **Prepare Your Application**
   ```bash
   # Add a render.yaml file to your project root
   services:
     - type: web
       name: sql-analytics-platform
       env: node
       buildCommand: npm install && npm run build
       startCommand: npm start
       envVars:
         - key: VITE_API_URL
           value: https://your-app.onrender.com
         - key: JWT_SECRET
           generateValue: true
         - key: DATABASE_URL
           fromDatabase:
             name: sql-analytics-db
             property: connectionString
   ```

2. **Deploy Database**
   - Go to Render Dashboard
   - Click "New +"
   - Select "PostgreSQL"
   - Choose "Free" plan
   - Name your database
   - Click "Create Database"

3. **Deploy Application**
   - Go to Render Dashboard
   - Click "New +"
   - Select "Web Service"
   - Connect your GitHub repository
   - Configure:
     - Name: sql-analytics-platform
     - Environment: Node
     - Build Command: `npm install && npm run build`
     - Start Command: `npm start`
   - Add environment variables
   - Click "Create Web Service"

## Option 2: Vercel + Supabase

### Prerequisites
- GitHub account
- Vercel account
- Supabase account

### Steps
1. **Set Up Supabase**
   - Create new project
   - Get database connection string
   - Set up authentication

2. **Deploy to Vercel**
   ```bash
   # Install Vercel CLI
   npm install -g vercel

   # Deploy
   vercel
   ```

3. **Configure Environment Variables**
   ```env
   VITE_API_URL=https://your-app.vercel.app
   JWT_SECRET=your-secret-key
   DATABASE_URL=your-supabase-url
   ```

## Option 3: Railway

### Prerequisites
- GitHub account
- Railway account

### Steps
1. **Install Railway CLI**
   ```bash
   npm i -g @railway/cli
   ```

2. **Deploy**
   ```bash
   # Login to Railway
   railway login

   # Initialize project
   railway init

   # Deploy
   railway up
   ```

3. **Configure Environment Variables**
   - Go to Railway Dashboard
   - Add environment variables
   - Link database

## Database Migration

### Using Prisma
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy
```

### Using Raw SQL
```bash
# Create migration file
psql -d your_database -f migrations/001_initial_schema.sql
```

## Environment Variables

Create a `.env` file:
```env
# Application
VITE_API_URL=https://your-app-url
JWT_SECRET=your-secret-key

# Database
DATABASE_URL=your-database-url

# Optional
NODE_ENV=production
PORT=3000
```

## Monitoring

### Free Monitoring Tools
1. **Sentry**
   - Error tracking
   - Performance monitoring
   - Free tier available

2. **UptimeRobot**
   - Uptime monitoring
   - Free tier available

3. **Logtail**
   - Log management
   - Free tier available

## Backup Strategy

### Database Backups
1. **Automated Backups**
   ```bash
   # Create backup script
   pg_dump -d your_database > backup.sql
   ```

2. **Schedule Backups**
   - Use cron jobs
   - Store in cloud storage

## Security Checklist

1. **SSL/TLS**
   - Enable HTTPS
   - Force HTTPS redirect

2. **Environment Variables**
   - Secure storage
   - No hardcoding

3. **Database**
   - Strong passwords
   - Limited access
   - Regular updates

4. **API Security**
   - Rate limiting
   - Input validation
   - CORS configuration

## Troubleshooting

### Common Issues

1. **Database Connection**
   ```bash
   # Test connection
   psql $DATABASE_URL
   ```

2. **Application Logs**
   ```bash
   # View logs
   railway logs
   ```

3. **Environment Variables**
   ```bash
   # Check variables
   railway variables
   ```

## Support

- Render: https://render.com/docs
- Vercel: https://vercel.com/docs
- Railway: https://docs.railway.app
- Supabase: https://supabase.com/docs 