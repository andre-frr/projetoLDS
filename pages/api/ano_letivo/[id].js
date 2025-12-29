import GrpcClient from "@/lib/grpc-client.js";
import {applyCors} from "@/lib/cors.js";
import {requireRole} from "@/lib/middleware.js";

function handleError(error, res, notFoundMessage = "Ano letivo não encontrado.") {
    console.error(error);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
        message: statusCode === 404 ? notFoundMessage : error.message,
    });
}

async function handleGet(id, res) {
    try {
        const result = await GrpcClient.getById("ano_letivo", id);
        return res.status(200).json(result);
    } catch (error) {
        return handleError(error, res);
    }
}

async function checkYearUniqueness(anoInicio, anoFim, id, res) {
    const existing = await GrpcClient.getAll("ano_letivo", {
        filters: {ano_inicio: anoInicio, ano_fim: anoFim},
    });

    const duplicate = existing.find((ano) => ano.id_ano !== Number.parseInt(id));
    if (duplicate) {
        return res.status(409).json({message: "Ano letivo já existe."});
    }

    return null;
}

async function handlePut(id, req, res) {
    const {anoInicio, anoFim} = req.body;

    if (!anoInicio || !anoFim) {
        return res.status(400).json({message: "Dados mal formatados."});
    }

    if (anoFim <= anoInicio) {
        return res.status(400).json({
            message: "O ano de fim deve ser posterior ao ano de início.",
        });
    }

    try {
        const current = await GrpcClient.getById("ano_letivo", id);

        // Check if year is archived
        if (current.arquivado) {
            return res.status(403).json({
                message: "Não é possível editar um ano letivo arquivado. Anos arquivados são apenas para consulta histórica.",
            });
        }

        const uniqueError = await checkYearUniqueness(anoInicio, anoFim, id, res);
        if (uniqueError) return uniqueError;

        const result = await GrpcClient.update("ano_letivo", id, {
            ano_inicio: anoInicio,
            ano_fim: anoFim,
        });

        return res.status(200).json(result);
    } catch (error) {
        return handleError(error, res);
    }
}

async function checkAssociatedData(id) {
    const result = await GrpcClient.executeCustomQuery(
        "checkAnoLetivoAssociations",
        {id_ano: id}
    );

    return result[0]?.has_data || false;
}

async function handleDelete(id, res) {
    try {
        const current = await GrpcClient.getById("ano_letivo", id);

        // Check if year is archived
        if (current.arquivado) {
            return res.status(403).json({
                message: "Não é possível eliminar um ano letivo arquivado. Anos arquivados devem ser preservados para histórico.",
            });
        }

        const hasData = await checkAssociatedData(id);

        if (hasData) {
            return res.status(409).json({
                message:
                    "Não é possível eliminar um ano letivo com dados associados. Os dados históricos devem ser preservados.",
            });
        }

        await GrpcClient.delete("ano_letivo", id);
        return res.status(200).json({message: "Ano letivo eliminado com sucesso."});
    } catch (error) {
        return handleError(error, res);
    }
}

async function handler(req, res) {
    const {id} = req.query;

    switch (req.method) {
        case "GET":
            return handleGet(id, res);
        case "PUT":
            return requireRole("Administrador")(handlePut)(id, req, res);
        case "DELETE":
            return requireRole("Administrador")(handleDelete)(id, res);
        default:
            res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

export default async function handlerWithCors(req, res) {
    await applyCors(req, res);
    return handler(req, res);
}
