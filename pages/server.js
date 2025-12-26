import {createServer} from "node:https";
import {fileURLToPath, parse} from "node:url";
import next from "next";
import fs from "node:fs";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dev = process.env.NODE_ENV !== "production";
// In Docker, __dirname is /app, pages API is at /app/pages/api
// In local dev, __dirname is pages/, API is at ./api
const nextDir = fs.existsSync(path.join(__dirname, "pages")) ? path.join(__dirname, "pages") : __dirname;
const app = next({dev, dir: nextDir});
const handle = app.getRequestHandler();

const certsDir = fs.existsSync(path.join(__dirname, "certs"))
    ? __dirname
    : path.join(__dirname, "..");

const httpsOptions = {
    key: fs.readFileSync(path.join(certsDir, "certs/localhost+1-key.pem")),
    cert: fs.readFileSync(path.join(certsDir, "certs/localhost+1.pem")),
};

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
