import GrpcClient from "@/lib/grpc-client.js";
import {applyCors} from "@/lib/cors.js";
import {ACTIONS, requirePermission, RESOURCES} from "@/lib/authorize.js";

function handleError(error, res) {
    const statusCode = error.statusCode || 500;
    return res
        .status(statusCode)
        .json({message: error.message || "Internal Server Error"});
}

async function handleGet(req, res) {
    try {
        const result = await GrpcClient.getAll("curso");
        return res.status(200).json(result);
    } catch (error) {
        return handleError(error, res);
    }
}

async function handlePost(req, res) {
    const {nome, sigla, tipo, coordenadores} = req.body;
    if (!nome || !sigla || !tipo) {
        return res.status(400).json({message: "Dados mal formatados."});
    }

    try {
        const existing = await GrpcClient.getAll("curso", {filters: {sigla}});
        if (existing.length > 0) {
            return res.status(409).json({message: "Sigla duplicada."});
        }

        const result = await GrpcClient.create("curso", {
            nome,
            sigla,
            tipo,
            ativo: true,
        });

        // Assign coordinators if provided
        if (coordenadores && Array.isArray(coordenadores) && coordenadores.length > 0) {
            const {assignCoordenadorToCourse} = await import('@/lib/permissions.js');
            for (const userId of coordenadores) {
                await assignCoordenadorToCourse(userId, result.id_curso);
            }
        }

        return res.status(201).json(result);
    } catch (error) {
        return handleError(error, res);
    }
}

async function handler(req, res) {
    switch (req.method) {
        case "GET":
            return requirePermission(ACTIONS.READ, RESOURCES.COURSES)(handleGet)(req, res);
        case "POST":
            return requirePermission(ACTIONS.CREATE, RESOURCES.COURSES)(handlePost)(req, res);
        default:
            res.setHeader("Allow", ["GET", "POST"]);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

export default async function handlerWithCors(req, res) {
    await applyCors(req, res);
    return handler(req, res);
}
