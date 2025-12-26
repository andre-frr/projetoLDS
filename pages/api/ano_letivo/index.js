import GrpcClient from "@/lib/grpc-client.js";
import {applyCors} from "@/lib/cors.js";
import {requireRole} from "@/lib/middleware.js";

function handleError(error, res) {
    console.error(error);
    const statusCode = error.statusCode || 500;
    return res
        .status(statusCode)
        .json({message: error.message || "Internal Server Error"});
}

async function checkDuplicates(anoInicio, anoFim, res) {
    const existing = await GrpcClient.getAll("ano_letivo", {
        filters: {ano_inicio: anoInicio, ano_fim: anoFim},
    });

    if (existing.length > 0) {
        return res.status(409).json({message: "Ano letivo já existe."});
    }

    return null;
}

async function handlePost(req, res) {
    const {anoInicio, anoFim, createNewYear} = req.body;

    if (!anoInicio || !anoFim) {
        return res.status(400).json({message: "Dados mal formatados."});
    }

    if (anoFim <= anoInicio) {
        return res.status(400).json({
            message: "O ano de fim deve ser posterior ao ano de início.",
        });
    }

    try {
        const duplicateError = await checkDuplicates(anoInicio, anoFim, res);
        if (duplicateError) return duplicateError;

        const result = await GrpcClient.create("ano_letivo", {
            ano_inicio: anoInicio,
            ano_fim: anoFim,
        });

        if (createNewYear) {
            return res.status(201).json({
                ...result,
                message: "Novo ano letivo criado. Sistema pronto para novos dados.",
            });
        }

        return res.status(201).json(result);
    } catch (error) {
        return handleError(error, res);
    }
}

async function handleGet(res) {
    try {
        const result = await GrpcClient.getAll("ano_letivo", {
            orderBy: "ano_inicio DESC, ano_fim DESC",
        });
        return res.status(200).json(result);
    } catch (error) {
        return handleError(error, res);
    }
}

async function handler(req, res) {
    switch (req.method) {
        case "GET":
            return handleGet(res);
        case "POST":
            return requireRole("Administrador")(handlePost)(req, res);
        default:
            res.setHeader("Allow", ["GET", "POST"]);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

export default async function handlerWithCors(req, res) {
    await applyCors(req, res);
    return handler(req, res);
}

