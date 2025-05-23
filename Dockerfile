# Frontend build stage
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy configuration files
COPY tsconfig.json .
COPY tsconfig.node.json .
COPY tsconfig.app.json .
COPY vite.config.ts .
COPY postcss.config.js .
COPY tailwind.config.js .
COPY index.html .

# Create public directory if it doesn't exist
RUN mkdir -p public

# Copy source code
COPY src/ src/

# Verify the utils file exists and create it if it doesn't
RUN if [ ! -f src/lib/utils.ts ]; then \
    mkdir -p src/lib && \
    echo 'import { type ClassValue, clsx } from "clsx"; \
import { twMerge } from "tailwind-merge"; \
\
export function cn(...inputs: ClassValue[]) { \
  return twMerge(clsx(inputs)); \
}' > src/lib/utils.ts; \
fi

# Set environment variables for frontend build
ENV VITE_API_URL=https://sql-analytics-platform-api.onrender.com/api

# Build the application
RUN npm run build

# Backend build stage
FROM python:3.9-slim

WORKDIR /app/backend

# Install system dependencies including Redis
RUN apt-get update && apt-get install -y \
    build-essential \
    redis-server \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ .

# Configure Redis
RUN echo "bind 0.0.0.0" > /etc/redis.conf && \
    echo "protected-mode no" >> /etc/redis.conf && \
    echo "port 6379" >> /etc/redis.conf

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "Starting Redis..."' >> /app/start.sh && \
    echo 'redis-server /etc/redis.conf --daemonize yes' >> /app/start.sh && \
    echo 'sleep 2' >> /app/start.sh && \
    echo 'redis-cli ping || echo "Redis failed to start"' >> /app/start.sh && \
    echo 'echo "Starting backend..."' >> /app/start.sh && \
    echo 'gunicorn --bind 0.0.0.0:5000 --workers 4 --timeout 120 app:app' >> /app/start.sh && \
    chmod +x /app/start.sh

# Set environment variables
ENV FLASK_APP=app.py
ENV FLASK_ENV=production
ENV DB_HOST=postgres
ENV DB_PORT=5432
ENV DB_USER=postgres
ENV DB_PASSWORD=postgres
ENV DB_NAME=sqlanalytics
ENV REDIS_HOST=localhost
ENV REDIS_PORT=6379

EXPOSE 5000

CMD ["/app/start.sh"]

# Production stage - frontend only
FROM nginx:alpine

# Copy the built frontend files
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Copy simplified nginx configuration
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location /health { \
        return 200 "healthy\n"; \
        add_header Content-Type text/plain; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]