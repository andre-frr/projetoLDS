import path from "node:path";
import fs from "node:fs";
import {fileURLToPath} from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if we're in Docker build context (lib is sibling) or local dev (lib is parent)
const libPath = fs.existsSync(path.resolve(__dirname, './lib'))
    ? path.resolve(__dirname, './lib')
    : path.resolve(__dirname, '../lib');

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    turbopack: {
        resolveExtensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
        resolveAlias: {
            '@/lib': libPath,
        },
    },
    webpack: (config) => {
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

export default nextConfig;
