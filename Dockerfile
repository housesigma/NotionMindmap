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

# Expose port 3001 for Express server (serves both API and static files)
EXPOSE 3001

# Health check for API server
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Set NODE_ENV to production
ENV NODE_ENV=production

# Start Express server (serves API + static files)
CMD ["npm", "run", "server"]