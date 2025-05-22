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

# Build the application
RUN npm run build

# Backend build stage
FROM python:3.9-slim AS backend-builder

WORKDIR /app/backend

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY backend/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ .

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Install Redis
RUN apk add --no-cache redis

# Copy package files
COPY package*.json ./

# Install all dependencies (including vite)
RUN npm ci

# Copy built assets from frontend builder stage
COPY --from=frontend-builder /app/dist ./dist

# Create public directory in runner stage
RUN mkdir -p public

# Copy backend from backend builder stage
COPY --from=backend-builder /app/backend ./backend

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV VITE_API_URL=https://sql-analytics-platform.onrender.com/api
ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=app.py
ENV FLASK_ENV=production
ENV REDIS_HOST=localhost
ENV REDIS_PORT=6379

# Install Python and backend dependencies in production
RUN apk add --no-cache python3 py3-pip && \
    cd backend && \
    python3 -m venv /opt/venv && \
    . /opt/venv/bin/activate && \
    pip3 install --no-cache-dir -r requirements.txt

# Expose ports
EXPOSE 3000
EXPOSE 5000
EXPOSE 6379

# Create a startup script
RUN echo '#!/bin/sh\n\
redis-server --daemonize yes\n\
cd backend && . /opt/venv/bin/activate && gunicorn --bind 0.0.0.0:5000 --workers 4 --timeout 120 app:app & \
cd /app && npm run start' > /app/start.sh && \
chmod +x /app/start.sh

# Start both frontend and backend
CMD ["/app/start.sh"]