import GrpcClient from "@/lib/grpc-client.js";
import {applyCors} from "@/lib/cors.js";
import {ACTIONS, requirePermission, RESOURCES} from "@/lib/authorize.js";

async function handleInactivate(req, res) {
    const {id} = req.query;

    try {
        // Check if docente exists
        const docente = await GrpcClient.getById("docente", id);

        if (!docente) {
            return res.status(404).json({message: "Docente inexistente."});
        }

        // Update docente to set ativo = false
        const result = await GrpcClient.update("docente", id, {ativo: false});
        return res.status(200).json(result);
    } catch (error) {
        console.error(error);
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
            message:
                statusCode === 404 ? "Docente inexistente." : "Internal Server Error",
        });
    }
}

async function handler(req, res) {
    if (req.method === "DELETE") {
        return requirePermission(ACTIONS.UPDATE, RESOURCES.PROFESSORS)(handleInactivate)(req, res);
    } else {
        res.setHeader("Allow", ["DELETE"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

export default async function handlerWithCors(req, res) {
    await applyCors(req, res);
    return handler(req, res);
}
