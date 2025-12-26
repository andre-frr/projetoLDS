# Stage 1: dependencies
FROM node:22-alpine AS deps
WORKDIR /app

# Install dependencies
COPY graphql/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Stage 2: production
FROM node:22-alpine
WORKDIR /app

# Add security updates and create non-root user
RUN apk update && apk upgrade && \
    addgroup -g 1001 -S nodejs && \
    adduser -S graphql -u 1001

# Copy dependencies
COPY --from=deps --chown=graphql:nodejs /app/node_modules ./node_modules

# Copy application files
COPY --chown=graphql:nodejs graphql/package*.json ./
COPY --chown=graphql:nodejs graphql/resolvers.js .
COPY --chown=graphql:nodejs graphql/schema.js .
COPY --chown=graphql:nodejs graphql/server.js .
COPY --chown=graphql:nodejs graphql/grpc-helper.js .
COPY --chown=graphql:nodejs graphql/resolvers ./resolvers
COPY --chown=graphql:nodejs graphql/types ./types
COPY --chown=graphql:nodejs grpc/protos ./grpc/protos

# Switch to non-root user
USER graphql

EXPOSE 4000

CMD ["node", "server.js"]
