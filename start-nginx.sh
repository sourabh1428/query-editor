#!/bin/sh
set -e

# Replace the backend host in nginx.conf with the environment variable if set
if [ -n "$BACKEND_URL" ]; then
    # Remove protocol if present and ensure port is included
    BACKEND_HOST=$(echo $BACKEND_URL | sed -E 's/^https?:\/\///')
    if [[ ! $BACKEND_HOST =~ :[0-9]+$ ]]; then
        BACKEND_HOST="${BACKEND_HOST}:5000"
    fi
    echo "Setting backend host to: $BACKEND_HOST"
    sed -i "s/set \$backend_host \"backend:5000\";/set \$backend_host \"$BACKEND_HOST\";/" /etc/nginx/conf.d/default.conf
fi

# Wait for backend to be ready
echo "Waiting for backend to be ready..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if [ -n "$BACKEND_URL" ]; then
        # In production, use the BACKEND_URL for health check
        if wget -q --spider "$BACKEND_URL/health" 2>/dev/null; then
            echo "Backend is ready!"
            break
        fi
    else
        # In local development, use backend:5000
        if wget -q --spider http://backend:5000/health 2>/dev/null; then
            echo "Backend is ready!"
            break
        fi
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
echo "Starting Nginx..."
exec nginx -g 'daemon off; error_log /dev/stderr debug;' 