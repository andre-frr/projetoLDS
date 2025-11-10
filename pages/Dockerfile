# Stage 1: build
FROM node:20-alpine AS builder
WORKDIR /app
COPY pages/package*.json ./
RUN npm install
COPY certs ./certs
COPY lib ./lib
COPY pages ./pages
COPY server.js ./
RUN npm run build

# Stage 2: production
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/certs ./certs
COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/server.js ./
COPY --from=builder --chown=appuser:nodejs /app/.next ./.next

EXPOSE 3000
CMD ["npm", "start"]
