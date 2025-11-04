# Stage 1: dependencies
FROM node:18 AS deps
WORKDIR /usr/src/app
COPY service-b/package*.json ./
RUN npm install --omit=dev

# Stage 2: production
FROM node:18
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY protos ./protos
COPY service-b/. .

CMD [ "node", "client.js" ]
