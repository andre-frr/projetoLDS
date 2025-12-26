# Stage 1: Build the Next.js app
FROM node:20-alpine AS builder
WORKDIR /app
COPY pages/package.json pages/package-lock.json* ./
RUN npm install
COPY pages/jsconfig.json ./jsconfig.json
COPY pages/next.config.js ./next.config.js
COPY pages/server.js ./server.js
# Create pages directory and copy api into it
RUN mkdir -p pages/api
COPY pages/api ./pages/api
COPY lib ./lib
COPY grpc/protos ./grpc/protos

RUN npm run build

# Stage 2: Create the final production image
FROM node:20-alpine
WORKDIR /app
COPY pages/package.json ./package.json
RUN npm install --omit=dev
COPY pages/server.js ./server.js
COPY lib ./lib
COPY grpc/protos ./grpc/protos
COPY certs ./certs
COPY pages/jsconfig.json ./jsconfig.json
COPY pages/next.config.js ./next.config.js
# Create pages directory and copy api into it
RUN mkdir -p pages/api
COPY pages/api ./pages/api
COPY --from=builder /app/.next ./.next

EXPOSE 3000
CMD ["node", "server.js"]
