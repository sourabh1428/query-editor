# Deployment Guide

This guide explains how to deploy the application on a virtual machine.

## Prerequisites

- Ubuntu 20.04 or later
- SSH access to the VM
- Sudo privileges

## Deployment Steps

1. **Copy Files to VM**
   ```bash
   scp -r ./* ubuntu@15.207.114.204:/path/to/deployment/directory
   ```

2. **SSH into VM**
   ```bash
   ssh ubuntu@15.207.114.204
   ```

3. **Make Deployment Script Executable**
   ```bash
   chmod +x deploy.sh
   ```

4. **Run Deployment Script**
   ```bash
   ./deploy.sh
   ```

## Port Configuration

The application uses the following ports:
- Frontend: 3000
- Backend: 5000
- Database: 5432

Make sure these ports are open in your VM's security group/firewall.

## Environment Variables

The deployment script will create a `.env` file with default values. You should modify these values for production:

- `POSTGRES_PASSWORD`: Set a secure password for the database
- `JWT_SECRET`: Set a secure secret for JWT token generation
- `FLASK_ENV`: Set to "production"
- `FRONTEND_URL`: Set to "http://15.207.114.204:3000"

## Verifying Deployment

After deployment, you can verify the services are running:

1. Check container status:
   ```bash
   docker-compose ps
   ```

2. Check logs:
   ```bash
   docker-compose logs -f
   ```

3. Test the endpoints:
   - Frontend: http://15.207.114.204:3000
   - Backend: http://15.207.114.204:5000
   - API Health: http://15.207.114.204:5000/api/health

## Troubleshooting

If you encounter issues:

1. Check container logs:
   ```bash
   docker-compose logs [service_name]
   ```

2. Check container status:
   ```bash
   docker-compose ps
   ```

3. Restart services:
   ```bash
   docker-compose restart
   ```

4. Rebuild and restart:
   ```bash
   docker-compose down
   docker-compose build
   docker-compose up -d
   ``` 