import GrpcClient from "@/lib/grpc-client.js";
import {applyCors} from "@/lib/cors.js";
import {ACTIONS, requirePermission, RESOURCES, ucContext} from "@/lib/authorize.js";

async function handleInactivate(req, res) {
    const {id} = req.query;

    try {
        const current = await GrpcClient.getById("uc", id);

        const result = await GrpcClient.update("uc", id, {
            ...current,
            ativo: false,
        });

        return res.status(200).json(result);
    } catch (error) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
            message: statusCode === 404 ? "UC inexistente." : error.message,
        });
    }
}

async function handler(req, res) {
    if (req.method === "DELETE") {
        return requirePermission(ACTIONS.UPDATE, RESOURCES.UCS, ucContext)(handleInactivate)(req, res);
    } else {
        res.setHeader("Allow", ["DELETE"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

export default async function handlerWithCors(req, res) {
    await applyCors(req, res);
    return handler(req, res);
}
