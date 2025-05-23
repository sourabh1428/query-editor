#!/bin/sh
set -e

# Ensure BACKEND_URL is set
if [ -z "$BACKEND_URL" ]; then
  echo "Error: BACKEND_URL environment variable is not set."
  exit 1
fi

# Remove protocol (http:// or https://) and ensure proper format
BACKEND_HOST=$(echo "$BACKEND_URL" | sed -e 's|^https\?://||')

# Append :5000 if no port is present
case "$BACKEND_HOST" in
  *:[0-9]*) ;;
  *) BACKEND_HOST="${BACKEND_HOST}:5000" ;;
esac

# Create a temporary nginx config with the backend host
cat > /etc/nginx/conf.d/default.conf << EOF
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
        try_files \$uri \$uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods * always;
        add_header Access-Control-Allow-Headers * always;
    }

    # Proxy API requests to backend
    location /api {
        proxy_pass http://${BACKEND_HOST};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, Accept';

        if (\$request_method = 'OPTIONS') {
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain charset=UTF-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }

    # Health check endpoint
    location /health {
        proxy_pass http://${BACKEND_HOST}/health;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, Accept';
        if (\$request_method = 'OPTIONS') {
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