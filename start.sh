#!/bin/sh

echo "Starting Redis..."
redis-server /etc/redis.conf --daemonize yes
sleep 2
redis-cli ping || echo "Redis failed to start"

echo "Starting backend..."
cd /app/backend && . /opt/venv/bin/activate && gunicorn --bind 0.0.0.0:5000 --workers 4 --timeout 120 app:app &

echo "Starting frontend..."
cd /app && npm run start 