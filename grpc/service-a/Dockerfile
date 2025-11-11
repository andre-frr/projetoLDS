# Stage 1: dependencies
FROM node:20-alpine AS deps
WORKDIR /usr/src/app
COPY service-a/package*.json ./
RUN npm install --omit=dev

# Stage 2: production
FROM node:20-alpine
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY protos ./protos
COPY service-a/. .

EXPOSE 50051
CMD [ "node", "server.js" ]
