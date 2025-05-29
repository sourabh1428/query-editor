FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY . .

# Set environment variables
ENV FLASK_APP=app.py
ENV FLASK_ENV=production
ENV PORT=5000
ENV PYTHONUNBUFFERED=1

# Create a startup script that initializes the database and keeps the application running
RUN echo '#!/bin/bash' > /app/start.sh && \
    echo 'set -e' >> /app/start.sh && \
    echo 'echo "🚀 Starting SQL Analytics Platform Backend..."' >> /app/start.sh && \
    echo 'echo "⏳ Waiting for database connection..."' >> /app/start.sh && \
    echo 'while true; do' >> /app/start.sh && \
    echo '  if python -c "from db.db import get_connection; get_connection(); print(\"✅ Database connected successfully\")"; then' >> /app/start.sh && \
    echo '    break' >> /app/start.sh && \
    echo '  fi' >> /app/start.sh && \
    echo '  echo "⏳ Waiting for database to be ready..."' >> /app/start.sh && \
    echo '  sleep 5' >> /app/start.sh && \
    echo 'done' >> /app/start.sh && \
    echo 'echo "🔧 Initializing database schema..."' >> /app/start.sh && \
    echo 'python db/init_db.py' >> /app/start.sh && \
    echo 'echo "✅ Database initialization complete"' >> /app/start.sh && \
    echo 'echo "🌐 Starting Gunicorn server on port $PORT..."' >> /app/start.sh && \
    echo 'exec gunicorn --bind 0.0.0.0:$PORT --workers 4 --timeout 120 --access-logfile - --error-logfile - --reload app:app' >> /app/start.sh && \
    chmod +x /app/start.sh

# Expose port
EXPOSE 5000

# Run the startup script
CMD ["/app/start.sh"] 