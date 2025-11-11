/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Turbopack configuration for Next.js 16+
  turbopack: {
    resolveExtensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
  },
  // Keep webpack config for webpack mode compatibility
  webpack: (config) => {
    // Ensure proper module resolution
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts', '.tsx', '.jsx'],
    };
    return config;
  },
};

module.exports = nextConfig;

