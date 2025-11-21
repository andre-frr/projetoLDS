# Stage 1: dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY graphql/package*.json ./
RUN npm install --omit=dev

# Stage 2: production
FROM node:20-alpine
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY graphql/package*.json ./
COPY graphql/resolvers.js .
COPY graphql/schema.js .
COPY graphql/server.js .
COPY graphql/grpc-helper.js .
COPY graphql/resolvers ./resolvers
COPY graphql/types ./types
COPY grpc/protos ./grpc/protos

EXPOSE 4000
CMD ["node", "server.js"]
