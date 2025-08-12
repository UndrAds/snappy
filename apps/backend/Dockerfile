# Use postgres as base (we have this locally) and install Node.js
FROM postgres:15-alpine

# Install Node.js, npm, curl, and OpenSSL
RUN apk add --no-cache nodejs npm curl openssl

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

# Create uploads directory
RUN mkdir -p uploads

# Generate Prisma client
WORKDIR /app/apps/backend
RUN npx prisma generate

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=development
ENV PORT=3000

# Start the development server
CMD ["npm", "run", "dev"]
