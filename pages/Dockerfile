# Stage 1: build
FROM node:20-alpine AS builder
WORKDIR /app

COPY pages/package*.json ./
RUN npm install

COPY pages/. .
COPY lib ../lib

RUN npm run build

# Stage 2: produção
FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/.next .next
COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3000
CMD ["npm", "start"]
