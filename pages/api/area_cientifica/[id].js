import GrpcClient from "@/lib/grpc-client.js";
import {applyCors} from "@/lib/cors.js";

function handleError(error, res, notFoundMessage = "Área científica inexistente.") {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
        message: statusCode === 404 ? notFoundMessage : error.message,
    });
}

async function handleGet(id, res) {
    try {
        const result = await GrpcClient.getById("area_cientifica", id);
        return res.status(200).json(result);
    } catch (error) {
        return handleError(error, res);
    }
}

async function validateDepartamento(id_dep, res) {
    if (!id_dep) return null;

    try {
        await GrpcClient.getById("departamento", id_dep);
        return null;
    } catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).json({message: "Departamento inexistente."});
        }
        throw error;
    }
}

async function checkFieldUniqueness(field, value, currentValue, id, res) {
    if (!value || value === currentValue) {
        return null;
    }

    const existing = await GrpcClient.getAll("area_cientifica", {
        filters: {[field]: value},
    });
    const duplicate = existing.find((area) => area.id_area !== Number.parseInt(id));

    if (duplicate) {
        const message = field === "nome" ? "Nome duplicado." : "Sigla duplicada.";
        return res.status(409).json({message});
    }

    return null;
}

async function handlePut(id, req, res) {
    const {nome, sigla, id_dep, ativo} = req.body;

    try {
        const current = await GrpcClient.getById("area_cientifica", id);

        if (id_dep && id_dep !== current.id_dep) {
            const deptError = await validateDepartamento(id_dep, res);
            if (deptError) return deptError;
        }

        const nomeError = await checkFieldUniqueness("nome", nome, current.nome, id, res);
        if (nomeError) return nomeError;

        const siglaError = await checkFieldUniqueness("sigla", sigla, current.sigla, id, res);
        if (siglaError) return siglaError;

        const updateData = {
            nome: nome ?? current.nome,
            sigla: sigla ?? current.sigla,
            id_dep: id_dep ?? current.id_dep,
            ativo: ativo ?? current.ativo,
        };

        const result = await GrpcClient.update("area_cientifica", id, updateData);
        return res.status(200).json(result);
    } catch (error) {
        return handleError(error, res);
    }
}

async function handleDelete(id, res) {
    try {
        await GrpcClient.delete("area_cientifica", id);
        return res.status(204).end();
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
            return handlePut(id, req, res);
        case "DELETE":
            return handleDelete(id, res);
        default:
            res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

export default async function handlerWithCors(req, res) {
    await applyCors(req, res);
    return handler(req, res);
}
