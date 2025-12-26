import {createServer} from "node:https";
import {fileURLToPath, parse} from "node:url";
import next from "next";
import fs from "node:fs";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dev = process.env.NODE_ENV !== "production";

// Next.js needs to run from the directory that contains 'pages' folder
// In Docker: server.js is at /app/server.js, and pages is at /app/pages
// In local: server.js is at pages/server.js, and pages/api is at ./api
// So we need to use /app as the dir in both cases since that's where pages/ lives
const app = next({dev, dir: __dirname});
const handle = app.getRequestHandler();

const certsDir = fs.existsSync(path.join(__dirname, "certs"))
    ? __dirname
    : path.join(__dirname, "..");

const httpsOptions = {
    key: fs.readFileSync(path.join(certsDir, "certs/localhost+1-key.pem")),
    cert: fs.readFileSync(path.join(certsDir, "certs/localhost+1.pem")),
};

console.log("[Server] Starting Next.js from directory:", __dirname);
console.log("[Server] Checking for pages directory at:", path.join(__dirname, "pages"));
console.log("[Server] Pages directory exists:", fs.existsSync(path.join(__dirname, "pages")));

await app.prepare();

createServer(httpsOptions, (req, res) => {
    console.log(`[Server] ${req.method} ${req.url}`);
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
}).listen(3000, (err) => {
    if (err) {
        console.error("[Server] Failed to start:", err);
        throw err;
    }
    console.log("[Server] HTTPS server ready on https://localhost:3000");
    console.log("[Server] Environment:", dev ? "development" : "production");
});
