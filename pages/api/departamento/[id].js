import GrpcClient from "@/lib/grpc-client.js";
import {applyCors} from "@/lib/cors.js";
import {ACTIONS, departmentContext, requirePermission, RESOURCES} from "@/lib/authorize.js";

function handleError(error, res) {
    console.error(error);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
        message:
            statusCode === 404
                ? "Departamento inexistente."
                : "Internal Server Error",
    });
}

async function handleGet(id, res) {
    try {
        const result = await GrpcClient.getById("departamento", id);
        return res.status(200).json(result);
    } catch (error) {
        return handleError(error, res);
    }
}

async function checkFieldUniqueness(field, value, currentValue, id, res) {
    if (!value || value === currentValue) {
        return null;
    }

    const existing = await GrpcClient.getAll("departamento", {
        filters: {[field]: value},
    });
    const duplicate = existing.find((dep) => dep.id_dep !== Number.parseInt(id));

    if (duplicate) {
        const message = field === "sigla" ? "Sigla duplicada." : "Nome duplicado.";
        return res.status(409).json({message});
    }

    return null;
}

async function handlePut(id, req, res) {
    const {nome, sigla, ativo} = req.body;

    try {
        const current = await GrpcClient.getById("departamento", id);

        // Check sigla uniqueness
        const siglaError = await checkFieldUniqueness("sigla", sigla, current.sigla, id, res);
        if (siglaError) return siglaError;

        // Check nome uniqueness
        const nomeError = await checkFieldUniqueness("nome", nome, current.nome, id, res);
        if (nomeError) return nomeError;

        const updateData = {
            nome: nome ?? current.nome,
            sigla: sigla ?? current.sigla,
            ativo: ativo ?? current.ativo,
        };

        const result = await GrpcClient.update("departamento", id, updateData);
        return res.status(200).json(result);
    } catch (error) {
        return handleError(error, res);
    }
}

async function handleDelete(id, res) {
    try {
        const areas = await GrpcClient.getAll("area_cientifica", {
            filters: {id_dep: Number.parseInt(id)},
        });

        if (areas.length > 0) {
            await GrpcClient.update("departamento", id, {ativo: false});
            return res.status(200).json({message: "Departamento marcado como inativo."});
        }

        await GrpcClient.delete("departamento", id);
        return res.status(204).end();
    } catch (error) {
        return handleError(error, res);
    }
}

async function handler(req, res) {
    const {id} = req.query;

    switch (req.method) {
        case "GET":
            return requirePermission(ACTIONS.READ, RESOURCES.DEPARTMENTS, departmentContext)(
                handleGet.bind(null, id)
            )(req, res);
        case "PUT":
            return requirePermission(ACTIONS.UPDATE, RESOURCES.DEPARTMENTS, departmentContext)(
                handlePut.bind(null, id)
            )(req, res);
        case "DELETE":
            return requirePermission(ACTIONS.DELETE, RESOURCES.DEPARTMENTS, departmentContext)(
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
