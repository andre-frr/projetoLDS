import pool from '@/lib/db';

const API_KEY_HEADER = 'x-api-key';

// In-memory store for rate limiting. In production, use a persistent store like Redis.
const rateLimitStore = new Map();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

async function apiKeyAuth(req, res, handler) {
    const apiKey = req.headers[API_KEY_HEADER];

    if (!apiKey) {
        return res.status(401).json({message: 'API Key required'});
    }

    try {
        const result = await pool.query('SELECT * FROM api_keys WHERE api_key = $1 AND is_active = TRUE', [apiKey]);
        if (result.rows.length === 0) {
            return res.status(401).json({message: 'Invalid API Key'});
        }

        // Rate limiting
        const now = Date.now();
        const clientRequests = rateLimitStore.get(apiKey) || [];
        const requestsInWindow = clientRequests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS);

        if (requestsInWindow.length >= MAX_REQUESTS_PER_WINDOW) {
            return res.status(429).json({message: 'Too many requests'});
        }

        requestsInWindow.push(now);
        rateLimitStore.set(apiKey, requestsInWindow);


        return handler(req, res);
    } catch (error) {
        console.error(error);
        return res.status(500).json({message: 'Internal server error'});
    }
}

async function publicApiHandler(req, res) {
    // Your public API logic here.
    // This endpoint is now protected by API key and rate limiting.
    res.status(200).json({message: 'This is a public endpoint.', data: 'Some public data'});
}

export default function handler(req, res) {
    apiKeyAuth(req, res, publicApiHandler);
}

