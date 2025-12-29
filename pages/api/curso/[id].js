import GrpcClient from "@/lib/grpc-client.js";
import {applyCors} from "@/lib/cors.js";
import {ACTIONS, courseContext, requirePermission, RESOURCES} from "@/lib/authorize.js";

function handleError(error, res, notFoundMessage = "Curso inexistente.") {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
        message: statusCode === 404 ? notFoundMessage : error.message,
    });
}

async function handleGet(id, res) {
    try {
        const result = await GrpcClient.getById("curso", id);
        return res.status(200).json(result);
    } catch (error) {
        return handleError(error, res);
    }
}

async function checkSiglaUniqueness(sigla, currentSigla, id, res) {
    if (!sigla || sigla === currentSigla) {
        return null;
    }

    const existing = await GrpcClient.getAll("curso", {
        filters: {sigla},
    });
    const duplicate = existing.find((curso) => curso.id_curso !== Number.parseInt(id));

    if (duplicate) {
        return res.status(409).json({message: "Sigla duplicada."});
    }

    return null;
}

async function handlePut(id, req, res) {
    const {nome, sigla, tipo, ativo} = req.body;

    try {
        const current = await GrpcClient.getById("curso", id);

        const siglaError = await checkSiglaUniqueness(sigla, current.sigla, id, res);
        if (siglaError) return siglaError;

        const updateData = {
            nome: nome ?? current.nome,
            sigla: sigla ?? current.sigla,
            tipo: tipo ?? current.tipo,
            ativo: ativo ?? current.ativo,
        };

        const result = await GrpcClient.update("curso", id, updateData);
        return res.status(200).json(result);
    } catch (error) {
        return handleError(error, res);
    }
}

async function handleDelete(id, res) {
    try {
        const ucs = await GrpcClient.getAll("uc", {
            filters: {id_curso: Number.parseInt(id)},
        });

        if (ucs.length > 0) {
            await GrpcClient.update("curso", id, {ativo: false});
            return res.status(200).json({message: "Curso marcado como inativo."});
        }

        await GrpcClient.delete("curso", id);
        return res.status(204).end();
    } catch (error) {
        return handleError(error, res);
    }
}

async function handler(req, res) {
    const {id} = req.query;

    switch (req.method) {
        case "GET":
            return requirePermission(ACTIONS.READ, RESOURCES.COURSES, courseContext)(
                handleGet.bind(null, id)
            )(req, res);
        case "PUT":
            return requirePermission(ACTIONS.UPDATE, RESOURCES.COURSES, courseContext)(
                handlePut.bind(null, id)
            )(req, res);
        case "DELETE":
            return requirePermission(ACTIONS.DELETE, RESOURCES.COURSES, courseContext)(
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
