# Stage 1: dependencies
FROM node:20-alpine AS deps
WORKDIR /app
RUN npm install -g npm@latest
COPY package*.json ./
RUN npm install --omit=dev

# Stage 2: production
FROM node:20-alpine
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY resolvers.js .
COPY schema.js .
COPY server.js .
COPY resolvers ./resolvers
COPY types ./types

EXPOSE 4000
CMD ["node", "server.js"]
