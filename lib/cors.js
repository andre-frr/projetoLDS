import cors from "cors";

const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
    : [];

console.log("CORS Configuration loaded:");
console.log("  CORS_ALLOWED_ORIGINS env:", process.env.CORS_ALLOWED_ORIGINS);
console.log("  Parsed allowed origins:", allowedOrigins);

const corsOptions = {
    origin: (origin, callback) => {
        console.log(`CORS request from origin: ${origin}`);

        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
            console.log("  -> Allowing (no origin header)");
            return callback(null, true);
        }

        // If no origins configured, allow all
        if (allowedOrigins.length === 0) {
            console.log("  -> Allowing (no restrictions configured)");
            return callback(null, true);
        }

        // Check if origin is in allowed list
        if (allowedOrigins.includes(origin)) {
            console.log("  -> Allowing (in whitelist)");
            callback(null, true);
        } else {
            console.log(
                `  -> BLOCKED (not in whitelist: ${allowedOrigins.join(", ")})`
            );
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    maxAge: 600, // 10 minutes
};

const corsMiddleware = cors(corsOptions);

// Promisified version for use in async handlers
export async function applyCors(req, res) {
    return new Promise((resolve, reject) => {
        corsMiddleware(req, res, (result) => {
            if (result instanceof Error) {
                return reject(result);
            }
            return resolve(result);
        });
    });
}

export default corsMiddleware;
