import {applyCors} from "@/lib/cors.js";

async function handler(req, res) {
    if (req.method !== "GET") {
        res.setHeader("Allow", ["GET"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    return res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        service: "nextjs-api",
    });
}

export default async function handlerWithCors(req, res) {
    await applyCors(req, res);
    return handler(req, res);
}
