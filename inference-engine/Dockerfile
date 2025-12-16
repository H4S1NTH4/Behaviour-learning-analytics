# Multi-stage build for Inference Engine

# Stage 1: Build TypeScript
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Stage 2: Python environment
FROM python:3.11-slim AS python-base

# Install Python dependencies
RUN pip install --no-cache-dir \
    tensorflow==2.15.0 \
    numpy==1.24.3 \
    scikit-learn==1.3.2

# Stage 3: Production runtime
FROM node:20-alpine

# Install Python
RUN apk add --no-cache python3 py3-pip

# Create app directory
WORKDIR /app

# Copy Python dependencies from python-base
COPY --from=python-base /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built code from builder
COPY --from=builder /app/dist ./dist

# Copy model files (if available)
# COPY models ./models

# Copy environment template
COPY .env.example ./.env.example

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose WebSocket port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the inference engine
CMD ["node", "dist/index.js"]
