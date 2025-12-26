# Stage 1: dependencies
FROM node:22-alpine AS deps
WORKDIR /usr/src/app

# Install dependencies
COPY grpc/service-a/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Stage 2: production
FROM node:22-alpine
WORKDIR /usr/src/app

# Add security updates and create non-root user
RUN apk update && apk upgrade && \
    addgroup -g 1001 -S nodejs && \
    adduser -S grpc -u 1001

# Copy dependencies
COPY --from=deps --chown=grpc:nodejs /usr/src/app/node_modules ./node_modules

# Copy application files
COPY --chown=grpc:nodejs grpc/protos ./protos
COPY --chown=grpc:nodejs grpc/service-a/server.js .
COPY --chown=grpc:nodejs grpc/service-a/package*.json ./

# Switch to non-root user
USER grpc

EXPOSE 50051

CMD ["node", "server.js"]
