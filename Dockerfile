# Stage 1: Build the Next.js app
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files from 'pages' and install dependencies
COPY pages/package.json pages/package-lock.json* ./
RUN npm install

# Copy the rest of the Next.js app source (api and middleware folders become pages/ subdirectories)
COPY pages/api ./pages/api
COPY pages/middleware ./pages/middleware
COPY pages/jsconfig.json ./

# Copy the shared lib directory
COPY lib ./lib

# Build the Next.js application
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

# Copy the pages directory structure
COPY pages/api ./pages/api
COPY pages/middleware ./pages/middleware

# Copy built assets from the builder stage
COPY --from=builder /app/.next ./.next

EXPOSE 3000
CMD ["node", "server.js"]
