import GrpcClient from "@/lib/grpc-client.js";
import {applyCors} from "@/lib/cors.js";

function handleError(error, res, notFoundMessage = "Docente inexistente.") {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
        message: statusCode === 404 ? notFoundMessage : error.message,
    });
}

async function handleGet(id, res) {
    try {
        const result = await GrpcClient.getById("docente", id);
        return res.status(200).json(result);
    } catch (error) {
        return handleError(error, res);
    }
}

async function checkEmailUniqueness(email, currentEmail, id, res) {
    if (email === currentEmail) {
        return null;
    }

    const existing = await GrpcClient.getAll("docente", {
        filters: {email},
    });
    const duplicate = existing.find((doc) => doc.id_doc !== Number.parseInt(id));

    if (duplicate) {
        return res.status(409).json({message: "Email duplicado."});
    }

    return null;
}

async function validateAreaCientifica(id_area, res) {
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

async function handlePut(id, req, res) {
    const {nome, email, id_area, convidado, ativo} = req.body;

    if (!nome || !email || !id_area) {
        return res.status(400).json({message: "Dados mal formatados."});
    }

    try {
        const current = await GrpcClient.getById("docente", id);

        const emailError = await checkEmailUniqueness(email, current.email, id, res);
        if (emailError) return emailError;

        const areaError = await validateAreaCientifica(id_area, res);
        if (areaError) return areaError;

        const updateData = {
            nome,
            email,
            id_area,
            convidado,
        };

        if (ativo !== undefined) {
            updateData.ativo = ativo;
        }

        const result = await GrpcClient.update("docente", id, updateData);
        return res.status(200).json(result);
    } catch (error) {
        return handleError(error, res);
    }
}

async function handleDelete(id, res) {
    try {
        await GrpcClient.delete("docente", id);
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
