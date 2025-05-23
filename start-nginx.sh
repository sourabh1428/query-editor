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

# Set the backend_host environment variable for Nginx
export backend_host="$BACKEND_HOST"

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