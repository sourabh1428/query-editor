#!/bin/sh
set -e

# Replace the backend host in nginx.conf with the environment variable if set
if [ -n "$BACKEND_URL" ]; then
    # Remove protocol if present and ensure port is included
    BACKEND_HOST=$(echo $BACKEND_URL | sed -E 's/^https?:\/\///')
    if [[ ! $BACKEND_HOST =~ :[0-9]+$ ]]; then
        BACKEND_HOST="${BACKEND_HOST}:5000"
    fi
    sed -i "s/set \$backend_host \"backend:5000\";/set \$backend_host \"$BACKEND_HOST\";/" /etc/nginx/conf.d/default.conf
fi

# Wait for the backend to be ready
echo "Waiting for backend to be ready..."
while ! wget --spider -q http://backend:5000/; do
  echo "Backend not ready yet... waiting"
  sleep 2
done
echo "Backend is ready!"

# Start Nginx
echo "Starting Nginx..."
nginx -g 'daemon off;' 