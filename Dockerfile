# Use official Node.js runtime as base image
FROM node:20

# Set working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install all dependencies (including dev dependencies for Vite)
RUN npm ci --silent

# Copy source code
COPY . .

# Build the application during Docker build phase
RUN npm run build

# Create a non-root user
RUN groupadd -g 1001 nodejs
RUN useradd -r -u 1001 -g nodejs nodeuser

# Change ownership of the app directory
RUN chown -R nodeuser:nodejs /app
USER nodeuser

# Expose both ports: 3001 for API server, 4001 for Vite dev server
EXPOSE 3001 4001

# Health check for API server
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Set NODE_ENV to production to avoid Vite client injection
ENV NODE_ENV=production

# Start both servers: API server in background, then Vite dev server
CMD ["sh", "-c", "npm run server & sleep 2 && npm run dev"]