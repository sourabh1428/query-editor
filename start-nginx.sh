#!/bin/sh
set -e

# Hardcoded backend URL
BACKEND_HOST="sql-analytics-platform.onrender.com:5000"

echo "Using backend host: ${BACKEND_HOST}"

# Create nginx config
cat > /etc/nginx/conf.d/default.conf << 'EOF'
# Use Docker's DNS resolver
resolver 127.0.0.11 valid=30s;
resolver_timeout 10s;

server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    # Serve frontend files
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods * always;
        add_header Access-Control-Allow-Headers * always;
    }

    # Proxy API requests to backend
    location /api {
        proxy_pass http://BACKEND_HOST_PLACEHOLDER;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, Accept';

        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain charset=UTF-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }

    # Health check endpoint
    location /health {
        proxy_pass http://BACKEND_HOST_PLACEHOLDER/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, Accept';
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain charset=UTF-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }

    # Error page
    location = /50x.html {
        root /usr/share/nginx/html;
        internal;
    }
}
EOF

# Replace the placeholder with the actual backend host
sed -i "s|BACKEND_HOST_PLACEHOLDER|${BACKEND_HOST}|g" /etc/nginx/conf.d/default.conf

# Wait for backend to be ready
MAX_RETRIES=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if wget -q --spider "http://${BACKEND_HOST}/health"; then
    echo "Backend is ready!"
    break
  fi
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "Backend not ready yet... waiting (attempt $RETRY_COUNT/$MAX_RETRIES)"
  sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "Backend failed to become ready after $MAX_RETRIES attempts"
  exit 1
fi

# Start Nginx with debug logging
exec nginx -g 'daemon off; error_log /dev/stderr debug;' 