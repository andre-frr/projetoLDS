# Stage 1: Build the Next.js app
FROM node:20-alpine AS builder
WORKDIR /app
COPY pages/ ./pages
WORKDIR /app/pages
RUN npm install
COPY ../lib ./lib

RUN npm run build

# Stage 2: Create the final production image
FROM node:20-alpine
WORKDIR /app
COPY pages/package.json .
RUN npm install --omit=dev
COPY server.js .
COPY lib ./lib
COPY certs ./certs
COPY --from=builder /app/pages/.next ./.next
COPY --from=builder /app/pages/public ./public
COPY pages/ ./pages

EXPOSE 3000
CMD ["node", "server.js"]
