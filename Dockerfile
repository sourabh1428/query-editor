# Frontend build stage
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy configuration files
COPY tsconfig.json .
COPY tsconfig.node.json .
COPY tsconfig.app.json .
COPY vite.config.ts .
COPY postcss.config.js .
COPY tailwind.config.js .
COPY index.html .

# Create public directory if it doesn't exist
RUN mkdir -p public

# Copy source code
COPY src/ src/

# Verify the utils file exists and create it if it doesn't
RUN if [ ! -f src/lib/utils.ts ]; then \
    mkdir -p src/lib && \
    echo 'import { type ClassValue, clsx } from "clsx"; \
import { twMerge } from "tailwind-merge"; \
\
export function cn(...inputs: ClassValue[]) { \
  return twMerge(clsx(inputs)); \
}' > src/lib/utils.ts; \
fi

# Build arguments for environment variables
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install serve to run the production build
RUN npm install -g serve

# Copy the built frontend files
COPY --from=frontend-builder /app/dist ./dist

# Expose port 3000
EXPOSE 3000

# Start the production server
CMD ["serve", "-s", "dist", "-l", "3000"]