const path = require('path');
const fs = require('fs');

// Check if we're in Docker build context (lib is sibling) or local dev (lib is parent)
const libPath = fs.existsSync(path.resolve(__dirname, './lib'))
  ? path.resolve(__dirname, './lib')
  : path.resolve(__dirname, '../lib');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Turbopack configuration for Next.js 16+
  turbopack: {
    resolveExtensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    resolveAlias: {
      '@/lib': libPath,
    },
  },
  // Keep webpack config for webpack mode compatibility
  webpack: (config) => {
    // Ensure proper module resolution
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts', '.tsx', '.jsx'],
    };
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/lib': libPath,
    };
    return config;
  },
};

module.exports = nextConfig;

