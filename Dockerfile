# Stage 1: Build the Next.js app
FROM node:20-alpine AS builder
WORKDIR /app

# Copy the Next.js app source and install dependencies
COPY pages/ ./pages/
WORKDIR /app/pages
RUN npm install
RUN npm run build

# Stage 2: Create the final production image
FROM node:20-alpine
WORKDIR /app

# Copy production dependencies' package files from 'pages' and install
COPY pages/package.json .
RUN npm install --omit=dev

# Copy the main server file from the project root
COPY server.js .

# Copy shared directories from the project root
COPY lib ./lib
COPY certs ./certs

# Copy built assets from the builder stage
COPY --from=builder /app/pages/.next ./pages/.next
COPY --from=builder /app/pages/public ./pages/public

EXPOSE 3000
CMD ["node", "server.js"]
