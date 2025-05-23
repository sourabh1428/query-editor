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
if [ -n "$BACKEND_URL" ]; then
    # In production, use the BACKEND_URL for health check
    while ! wget -q --spider "$BACKEND_URL/health" 2>/dev/null; do
        echo "Backend not ready yet... waiting"
        sleep 2
    done
else
    # In local development, use backend:5000
    while ! wget -q --spider http://backend:5000/health 2>/dev/null; do
        echo "Backend not ready yet... waiting"
        sleep 2
    done
fi
echo "Backend is ready!"

# Start Nginx
echo "Starting Nginx..."
exec nginx -g 'daemon off;' 