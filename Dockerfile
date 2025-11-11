# Stage 1: Build the Next.js app
FROM node:20-alpine AS builder
WORKDIR /build
COPY pages/package.json pages/package-lock.json* ./
RUN npm install
COPY pages/jsconfig.json ./jsconfig.json
COPY pages/next.config.js ./next.config.js
COPY pages/api ./pages/api
COPY lib ./lib

RUN npm run build

# Stage 2: Create the final production image
FROM node:20-alpine
WORKDIR /app
COPY pages/package.json ./pages/
WORKDIR /app/pages
RUN npm install --omit=dev
WORKDIR /app
COPY server.js .
COPY lib ./lib
COPY certs ./certs
COPY pages/jsconfig.json ./pages/jsconfig.json
COPY pages/next.config.js ./pages/next.config.js
COPY pages/api ./pages/api
COPY --from=builder /build/.next ./pages/.next
COPY --from=builder /build/node_modules ./pages/node_modules

EXPOSE 3000
CMD ["node", "server.js"]
