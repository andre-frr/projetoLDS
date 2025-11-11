# Stage 1: Build the Next.js app
FROM node:20-alpine AS builder
WORKDIR /app
COPY pages/ ./
RUN npm install
RUN npm run build

# Stage 2: Create the final production image
FROM node:20-alpine
WORKDIR /app

# Copy production dependencies from builder
COPY --from=builder /app/package.json ./
RUN npm install --omit=dev

# Copy custom server, lib, and certs
COPY server.js .
COPY lib ./lib
COPY certs ./certs

# Copy Next.js build output from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
