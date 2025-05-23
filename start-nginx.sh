#!/bin/sh
set -e

# Function to check if a string ends with a port number
has_port() {
    case "$1" in
        *:[0-9]*)
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

# Function to check if backend is ready
check_backend() {
    wget -q --spider "$1/health" 2>/dev/null
    return $?
}

# Get backend URL from environment or use default
if [ -n "$BACKEND_URL" ]; then
    # Remove protocol if present
    BACKEND_HOST=$(echo "$BACKEND_URL" | sed 's|^https\?://||')
    
    # Add port if not present
    if ! has_port "$BACKEND_HOST"; then
        BACKEND_HOST="${BACKEND_HOST}:5000"
    fi
    
    echo "Setting backend host to: $BACKEND_HOST"
    
    # Replace proxy_pass lines in nginx config
    sed -i "s|proxy_pass http://backend:5000;|proxy_pass http://$BACKEND_HOST;|" /etc/nginx/conf.d/default.conf
    sed -i "s|proxy_pass http://backend:5000/health;|proxy_pass http://$BACKEND_HOST/health;|" /etc/nginx/conf.d/default.conf
    
    # Use the configured URL for health check
    HEALTH_CHECK_URL="http://$BACKEND_HOST/health"
else
    echo "Using default backend host: backend:5000"
    HEALTH_CHECK_URL="http://backend:5000/health"
fi

# Wait for backend to be ready
echo "Waiting for backend to be ready..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if check_backend "$HEALTH_CHECK_URL"; then
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
echo "Starting Nginx..."
exec nginx -g 'daemon off; error_log /dev/stderr debug;' 