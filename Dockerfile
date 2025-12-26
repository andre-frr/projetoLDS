# Stage 1: Build the Next.js app
FROM node:22-alpine AS builder
WORKDIR /app

# Install dependencies for better caching
COPY pages/package.json pages/package-lock.json* ./
RUN npm ci --only=production=false

# Copy configuration files
COPY pages/jsconfig.json ./jsconfig.json
COPY pages/next.config.js ./next.config.js
COPY pages/server.js ./server.js

# Create pages directory and copy api into it
RUN mkdir -p pages/api
COPY pages/api ./pages/api
COPY lib ./lib
COPY grpc/protos ./grpc/protos

# Build Next.js app
RUN npm run build

# Stage 2: Create the final production image
FROM node:22-alpine
WORKDIR /app

# Add security updates and create non-root user
RUN apk update && apk upgrade && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Install production dependencies only
COPY pages/package.json ./package.json
RUN npm ci --only=production && npm cache clean --force

# Copy application files
COPY --chown=nextjs:nodejs pages/server.js ./server.js
COPY --chown=nextjs:nodejs lib ./lib
COPY --chown=nextjs:nodejs grpc/protos ./grpc/protos
COPY --chown=nextjs:nodejs certs ./certs
COPY --chown=nextjs:nodejs pages/jsconfig.json ./jsconfig.json
COPY --chown=nextjs:nodejs pages/next.config.js ./next.config.js

# Create pages directory and copy api into it
RUN mkdir -p pages/api
COPY --chown=nextjs:nodejs pages/api ./pages/api

# Copy build output from builder
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next

# Switch to non-root user
USER nextjs

EXPOSE 3000

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('https').get('https://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

CMD ["node", "server.js"]
