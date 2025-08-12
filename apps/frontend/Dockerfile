# Use postgres as base (we have this locally) and install Node.js
FROM postgres:15-alpine

# Install Node.js and npm
RUN apk add --no-cache nodejs npm

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/frontend/package*.json ./apps/frontend/
COPY packages/shared-types/package*.json ./packages/shared-types/

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 5173

# Set environment
ENV NODE_ENV=development

# Start the development server
WORKDIR /app/apps/frontend
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
