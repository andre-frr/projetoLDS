import GrpcClient from "@/lib/grpc-client.js";
import {applyCors} from "@/lib/cors.js";

function handleError(error, res) {
    console.error(error);
    const statusCode = error.statusCode || 500;
    return res
        .status(statusCode)
        .json({message: error.message || "Internal Server Error"});
}

async function handleGet(req, res) {
    const {incluirInativos} = req.query;
    const filters = incluirInativos === "true" ? undefined : {ativo: true};

    try {
        const result = await GrpcClient.getAll("docente", {filters});
        return res.status(200).json(result);
    } catch (error) {
        return handleError(error, res);
    }
}

async function validateAreaExists(id_area, res) {
    try {
        await GrpcClient.getById("area_cientifica", id_area);
        return null;
    } catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).json({message: "Área científica inexistente."});
        }
        throw error;
    }
}

async function handlePost(req, res) {
    const {nome, email, id_area, convidado} = req.body;
    if (!nome || !email || !id_area) {
        return res.status(400).json({message: "Dados mal formatados."});
    }

    try {
        const emailExists = await GrpcClient.getAll("docente", {
            filters: {email},
        });
        if (emailExists.length > 0) {
            return res.status(409).json({message: "Email duplicado."});
        }

        const areaError = await validateAreaExists(id_area, res);
        if (areaError) return areaError;

        const result = await GrpcClient.create("docente", {
            nome,
            email,
            id_area,
            ativo: true,
            convidado: convidado ?? false,
        });
        return res.status(201).json(result);
    } catch (error) {
        return handleError(error, res);
    }
}

async function handler(req, res) {
    switch (req.method) {
        case "GET":
            return handleGet(req, res);
        case "POST":
            return handlePost(req, res);
        default:
            res.setHeader("Allow", ["GET", "POST"]);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

export default async function handlerWithCors(req, res) {
    await applyCors(req, res);
    return handler(req, res);
}
