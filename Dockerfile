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

# Install Redis and other dependencies
RUN apk add --no-cache redis python3 py3-pip

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
ENV VITE_API_URL=http://localhost:5000/api
ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=app.py
ENV FLASK_ENV=production
ENV REDIS_HOST=localhost
ENV REDIS_PORT=6379
ENV DB_HOST=postgres
ENV DB_PORT=5432
ENV DB_USER=postgres
ENV DB_PASSWORD=postgres
ENV DB_NAME=sqlanalytics

# Install Python dependencies in production
RUN cd backend && \
    python3 -m venv /opt/venv && \
    . /opt/venv/bin/activate && \
    pip3 install --no-cache-dir -r requirements.txt

# Create Redis configuration
RUN echo "bind 0.0.0.0" > /etc/redis.conf && \
    echo "protected-mode no" >> /etc/redis.conf && \
    echo "port 6379" >> /etc/redis.conf

# Copy and set up startup script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Expose ports
EXPOSE 3000
EXPOSE 5000
EXPOSE 6379

# Start the application
CMD ["/bin/sh", "/app/start.sh"]