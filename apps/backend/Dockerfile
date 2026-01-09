# Multi-stage build for production
# Stage 1: Build the application
FROM node:20-alpine AS builder

# Install curl and OpenSSL for Prisma
RUN apk add --no-cache curl openssl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY packages/shared-types/package*.json ./packages/shared-types/

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Build shared-types package first
WORKDIR /app/packages/shared-types
RUN npm run build

# Build the backend application
WORKDIR /app/apps/backend
RUN npm run build

# Generate Prisma client
RUN npx prisma generate

# Stage 2: Production runtime
FROM node:20-alpine AS production

# Install curl and OpenSSL for Prisma
RUN apk add --no-cache curl openssl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY packages/shared-types/package*.json ./packages/shared-types/

# Install only production dependencies
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/apps/backend/scripts ./apps/backend/scripts
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist

# Create uploads directory
RUN mkdir -p uploads

# Generate Prisma client
WORKDIR /app/apps/backend
RUN npx prisma generate

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Start the production server
CMD ["npm", "run", "start"]
