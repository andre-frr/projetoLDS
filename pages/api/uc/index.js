import GrpcClient from "@/lib/grpc-client.js";
import {applyCors} from "@/lib/cors.js";
import {ACTIONS, requirePermission, RESOURCES, ucContext} from "@/lib/authorize.js";

function handleError(error, res) {
    const statusCode = error.statusCode || 500;
    return res
        .status(statusCode)
        .json({message: error.message || "Internal Server Error"});
}

async function handleGet(res) {
    try {
        const result = await GrpcClient.getAll("uc");
        return res.status(200).json(result);
    } catch (error) {
        return handleError(error, res);
    }
}

async function validateCurso(id_curso, res) {
    try {
        await GrpcClient.getById("curso", id_curso);
        return null;
    } catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).json({message: "Curso inexistente."});
        }
        throw error;
    }
}

async function validateArea(id_area, res) {
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
    const {nome, id_curso, id_area, ano_curso, sem_curso, ects, horas_por_ects} = req.body;

    if (!nome || !id_curso || !id_area || !ano_curso || !sem_curso || ects == null) {
        return res.status(400).json({
            message: "Dados mal formatados. Campos obrigatórios: nome, id_curso, id_area, ano_curso, sem_curso, ects",
        });
    }

    try {
        const cursoError = await validateCurso(id_curso, res);
        if (cursoError) return cursoError;

        const areaError = await validateArea(id_area, res);
        if (areaError) return areaError;

        const result = await GrpcClient.create("uc", {
            nome,
            id_curso,
            id_area,
            ano_curso,
            sem_curso,
            ects,
            horas_por_ects: horas_por_ects || 28,
            ativo: true,
        });

        return res.status(201).json(result);
    } catch (error) {
        return handleError(error, res);
    }
}

async function handler(req, res) {
    switch (req.method) {
        case "GET":
            return requirePermission(ACTIONS.READ, RESOURCES.UCS)(handleGet)(req, res);
        case "POST":
            return requirePermission(ACTIONS.CREATE, RESOURCES.UCS, ucContext)(handlePost)(req, res);
        default:
            res.setHeader("Allow", ["GET", "POST"]);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

export default async function handlerWithCors(req, res) {
    await applyCors(req, res);
    return handler(req, res);
}
