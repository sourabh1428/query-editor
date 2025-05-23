#!/bin/sh
set -e

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