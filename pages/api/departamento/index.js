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

async function checkDuplicates(nome, sigla, res) {
    const existingSigla = await GrpcClient.getAll("departamento", {
        filters: {sigla},
    });
    if (existingSigla.length > 0) {
        return res.status(409).json({message: "Sigla duplicada."});
    }

    const existingNome = await GrpcClient.getAll("departamento", {
        filters: {nome},
    });
    if (existingNome.length > 0) {
        return res.status(409).json({message: "Nome duplicado."});
    }

    return null;
}

const postHandler = async (req, res) => {
    const {nome, sigla} = req.body;
    if (!nome || !sigla) {
        return res.status(400).json({message: "Dados mal formatados."});
    }

    try {
        const duplicateError = await checkDuplicates(nome, sigla, res);
        if (duplicateError) return duplicateError;

        const result = await GrpcClient.create("departamento", {
            nome,
            sigla,
            ativo: true,
        });

        return res.status(201).json(result);
    } catch (error) {
        return handleError(error, res);
    }
};

async function handleGet(res) {
    try {
        const result = await GrpcClient.getAll("departamento");
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
            return requireRole("Administrador")(postHandler)(req, res);
        default:
            res.setHeader("Allow", ["GET", "POST"]);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

export default async function handlerWithCors(req, res) {
    await applyCors(req, res);
    return handler(req, res);
}
