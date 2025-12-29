import GrpcClient from "@/lib/grpc-client.js";
import {applyCors} from "@/lib/cors.js";
import {ACTIONS, areaContext, requirePermission, RESOURCES} from "@/lib/authorize.js";

async function handleGet(res) {
    try {
        const rows = await GrpcClient.executeCustomQuery("areasWithDepartamento");
        return res.status(200).json(rows);
    } catch (err) {
        const statusCode = err.statusCode || 500;
        return res.status(statusCode).json({error: err.message});
    }
}

async function validateDepartmentExists(id_dep, res) {
    try {
        await GrpcClient.getById("departamento", id_dep);
        return null;
    } catch (error) {
        if (error.statusCode === 404) {
            return res.status(400).json({message: "Departamento inexistente."});
        }
        throw error;
    }
}

async function checkDuplicates(nome, sigla, res) {
    const nomeExists = await GrpcClient.getAll("area_cientifica", {
        filters: {nome},
    });
    if (nomeExists.length > 0) {
        return res.status(409).json({message: "Nome duplicado."});
    }

    const siglaExists = await GrpcClient.getAll("area_cientifica", {
        filters: {sigla},
    });
    if (siglaExists.length > 0) {
        return res.status(409).json({message: "Sigla duplicada."});
    }

    return null;
}

async function handlePost(req, res) {
    try {
        const {nome, sigla, id_dep} = req.body;
        if (!nome || !sigla || !id_dep) {
            return res.status(400).json({message: "Dados mal formatados."});
        }

        const duplicateError = await checkDuplicates(nome, sigla, res);
        if (duplicateError) return duplicateError;

        const deptError = await validateDepartmentExists(id_dep, res);
        if (deptError) return deptError;

        const result = await GrpcClient.create("area_cientifica", {
            nome,
            sigla,
            id_dep,
            ativo: true,
        });
        return res.status(201).json(result);
    } catch (err) {
        const statusCode = err.statusCode || 500;
        return res.status(statusCode).json({error: err.message});
    }
}

async function handler(req, res) {
    switch (req.method) {
        case "GET":
            return requirePermission(ACTIONS.READ, RESOURCES.AREAS)(handleGet)(req, res);
        case "POST":
            return requirePermission(ACTIONS.CREATE, RESOURCES.AREAS, areaContext)(handlePost)(req, res);
        default:
            res.setHeader("Allow", ["GET", "POST"]);
            return res.status(405).json({message: "Method not allowed"});
    }
}

export default async function handlerWithCors(req, res) {
    await applyCors(req, res);
    return handler(req, res);
}
