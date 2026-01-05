import GrpcClient from "@/lib/grpc-client.js";
import {applyCors} from "@/lib/cors.js";
import {ACTIONS, requirePermission, RESOURCES} from "@/lib/authorize.js";

function handleError(error, res) {
    console.error(error);
    const statusCode = error.statusCode || 500;
    return res
        .status(statusCode)
        .json({message: error.message || "Internal Server Error"});
}

/**
 * GET /api/dsd/[id]
 * Get a specific DSD by ID
 */
async function handleGet(id, req, res) {
    try {
        const result = await GrpcClient.executeCustomQuery("dsdWithDetails", {});
        const dsd = result.find(d => d.id_dsd === Number.parseInt(id));

        if (!dsd) {
            return res.status(404).json({message: "DSD não encontrado"});
        }

        return res.status(200).json(dsd);
    } catch (error) {
        return handleError(error, res);
    }
}

/**
 * PUT /api/dsd/[id]
 * Update DSD assignment
 * Body: { horas: number }
 */
async function handlePut(id, req, res) {
    const {horas} = req.body;

    if (horas === undefined || horas === null) {
        return res.status(400).json({
            message: "Campo 'horas' é obrigatório"
        });
    }

    if (horas < 0) {
        return res.status(400).json({
            message: "Horas não podem ser negativas"
        });
    }

    try {
        // Check if DSD exists
        try {
            await GrpcClient.getById("dsd", id);
        } catch (error) {
            if (error.statusCode === 404) {
                return res.status(404).json({message: "DSD não encontrado"});
            }
            throw error;
        }

        // Update
        const result = await GrpcClient.update("dsd", id, {horas});
        return res.status(200).json(result);
    } catch (error) {
        return handleError(error, res);
    }
}

/**
 * DELETE /api/dsd/[id]
 * Delete a DSD assignment
 */
async function handleDelete(id, req, res) {
    try {
        await GrpcClient.delete("dsd", id);
        return res.status(204).end();
    } catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).json({message: "DSD não encontrado"});
        }
        return handleError(error, res);
    }
}

async function handler(req, res) {
    const {id} = req.query;

    const dsdContext = async () => {
        try {
            // Get DSD details via gRPC
            const dsds = await GrpcClient.executeCustomQuery("dsdWithDetails", {});
            const dsd = dsds.find(d => d.id_dsd === Number.parseInt(id));

            if (dsd) {
                return {
                    ucId: dsd.id_uc,
                    cursoId: dsd.id_curso
                };
            }
        } catch (error) {
            console.error('Error getting DSD context:', error);
        }
        return {};
    };

    switch (req.method) {
        case "GET":
            return requirePermission(ACTIONS.READ, RESOURCES.DSD, dsdContext)(
                handleGet.bind(null, id)
            )(req, res);
        case "PUT":
            return requirePermission(ACTIONS.UPDATE, RESOURCES.DSD, dsdContext)(
                handlePut.bind(null, id)
            )(req, res);
        case "DELETE":
            return requirePermission(ACTIONS.DELETE, RESOURCES.DSD, dsdContext)(
                handleDelete.bind(null, id)
            )(req, res);
        default:
            res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

export default async function handlerWithCors(req, res) {
    await applyCors(req, res);
    return handler(req, res);
}
