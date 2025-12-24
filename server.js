const {createServer} = require("node:https");
const {parse} = require("node:url");
const next = require("next");
const fs = require("node:fs");
const path = require("node:path");

const dev = process.env.NODE_ENV !== "production";
const app = next({dev, dir: "./pages"});
const handle = app.getRequestHandler();

const httpsOptions = {
    key: fs.readFileSync(path.resolve(__dirname, "certs/localhost+1-key.pem")),
    cert: fs.readFileSync(path.resolve(__dirname, "certs/localhost+1.pem")),
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
