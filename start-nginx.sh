#!/bin/sh
set -e

# Wait for the backend to be ready
echo "Waiting for backend to be ready..."
while ! nc -z backend 5000; do
  sleep 1
done
echo "Backend is ready!"

# Start Nginx
echo "Starting Nginx..."
nginx -g 'daemon off;' 