#!/bin/sh

# Remove any existing default config
rm -f /etc/nginx/conf.d/default.conf

# Create nginx config using echo instead of cat
echo 'server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass https://sql-analytics-platform.onrender.com/;
        proxy_set_header Host sql-analytics-platform.onrender.com;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /auth/ {
        proxy_pass https://sql-analytics-platform.onrender.com/auth/;
        proxy_set_header Host sql-analytics-platform.onrender.com;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass https://sql-analytics-platform.onrender.com/health;
        proxy_set_header Host sql-analytics-platform.onrender.com;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}' > /etc/nginx/conf.d/default.conf

# Test the config
nginx -t

# Start Nginx
exec nginx -g "daemon off;"