# Stage 1: Build the Next.js app
FROM node:20-alpine AS builder
WORKDIR /app
COPY pages/package.json ./package.json
RUN npm install
COPY pages ./pages
COPY lib ./lib

RUN node ./node_modules/next/dist/bin/next build ./pages

# Stage 2: Create the final production image
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package.json ./package.json
RUN npm install --omit=dev
COPY server.js .
COPY lib ./lib
COPY certs ./certs
COPY --from=builder /app/pages ./pages

EXPOSE 3000
CMD ["node", "server.js"]
