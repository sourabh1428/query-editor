# Build stage
FROM node:18-alpine AS builder

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

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including vite)
RUN npm ci

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist

# Create public directory in runner stage
RUN mkdir -p public

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start"]