#!/bin/bash
# Flutter Web Build Script for Linux
# Usage: ./build-web.sh 192.168.1.100

if [ -z "$1" ]; then
    echo "Usage: ./build-web.sh <server-ip> [api-port] [graphql-port]"
    exit 1
fi

SERVER_IP=$1
API_PORT=${2:-3000}
GRAPHQL_PORT=${3:-4000}

API_BASE_URL="https://${SERVER_IP}:${API_PORT}/api"
GRAPHQL_URL="http://${SERVER_IP}:${GRAPHQL_PORT}/graphql"

echo "Building Flutter web with:"
echo "  API_BASE_URL: $API_BASE_URL"
echo "  GRAPHQL_URL: $GRAPHQL_URL"

flutter build web \
    --pwa-strategy=none \
    --dart-define=API_BASE_URL=$API_BASE_URL \
    --dart-define=GRAPHQL_URL=$GRAPHQL_URL

if [ $? -eq 0 ]; then
    echo ""
    echo "Build completed successfully!"
    echo "Output directory: build/web"
else
    echo ""
    echo "Build failed!"
    exit 1
fi

