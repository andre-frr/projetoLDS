# Stage 1: Build the Next.js app
FROM node:20-alpine AS builder
WORKDIR /app/pages
COPY pages/package.json pages/package-lock.json* ./
RUN npm install
COPY pages/jsconfig.json ./jsconfig.json
COPY pages/next.config.js ./next.config.js
COPY pages/api ./api
WORKDIR /app
COPY lib ./lib

WORKDIR /app/pages
RUN npm run build

# Stage 2: Create the final production image
FROM node:20-alpine
WORKDIR /app
COPY pages/package.json ./pages/package.json
WORKDIR /app/pages
RUN npm install --omit=dev
WORKDIR /app
COPY server.js .
COPY lib ./lib
COPY certs ./certs
COPY pages/api ./pages/api
COPY pages/jsconfig.json ./pages/jsconfig.json
COPY pages/next.config.js ./pages/next.config.js
COPY --from=builder /app/pages/.next ./pages/.next
COPY --from=builder /app/pages/node_modules ./pages/node_modules

EXPOSE 3000
CMD ["node", "server.js"]
