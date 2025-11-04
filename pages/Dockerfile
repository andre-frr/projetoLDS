# Stage 1: build
FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g npm@latest
COPY pages/package*.json ./
RUN npm install
COPY lib ./lib
COPY pages ./pages
RUN npm run build

# Stage 2: production
FROM node:20-alpine
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S appuser -u 1001
COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev
COPY --from=builder --chown=appuser:nodejs /app/.next ./.next
USER appuser

EXPOSE 3000
CMD ["npm", "start"]
