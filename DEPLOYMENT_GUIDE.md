# Deployment Guide

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