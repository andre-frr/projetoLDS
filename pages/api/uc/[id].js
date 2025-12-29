import GrpcClient from "@/lib/grpc-client.js";
import {applyCors} from "@/lib/cors.js";
import {ACTIONS, requirePermission, RESOURCES, ucContext} from "@/lib/authorize.js";

function handleError(error, res, notFoundMessage = "UC inexistente.") {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
        message: statusCode === 404 ? notFoundMessage : error.message,
    });
}

async function handleGet(id, res) {
    try {
        const uc = await GrpcClient.getById("uc", id);
        const horasContacto = await GrpcClient.getAll("uc_horas_contacto", {
            filters: {id_uc: Number.parseInt(id)},
        });

        return res.status(200).json({
            ...uc,
            horas_contacto: horasContacto,
        });
    } catch (error) {
        return handleError(error, res);
    }
}

async function validateCursoExists(id_curso, res) {
    if (!id_curso) return null;

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

async function validateAreaExists(id_area, res) {
    if (!id_area) return null;

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
    const {nome, id_curso, id_area, ano_curso, sem_curso, ects, horas_por_ects, ativo} = req.body;

    try {
        const current = await GrpcClient.getById("uc", id);

        if (id_curso && id_curso !== current.id_curso) {
            const cursoError = await validateCursoExists(id_curso, res);
            if (cursoError) return cursoError;
        }

        if (id_area && id_area !== current.id_area) {
            const areaError = await validateAreaExists(id_area, res);
            if (areaError) return areaError;
        }

        const updateData = {
            nome: nome ?? current.nome,
            id_curso: id_curso ?? current.id_curso,
            id_area: id_area ?? current.id_area,
            ano_curso: ano_curso ?? current.ano_curso,
            sem_curso: sem_curso ?? current.sem_curso,
            ects: ects ?? current.ects,
            horas_por_ects: horas_por_ects ?? current.horas_por_ects,
            ativo: ativo ?? current.ativo,
        };

        const result = await GrpcClient.update("uc", id, updateData);
        return res.status(200).json(result);
    } catch (error) {
        return handleError(error, res);
    }
}

async function handleDelete(id, res) {
    try {
        await GrpcClient.delete("uc", id);
        return res.status(204).end();
    } catch (error) {
        return handleError(error, res);
    }
}

async function handler(req, res) {
    const {id} = req.query;

    switch (req.method) {
        case "GET":
            return requirePermission(ACTIONS.READ, RESOURCES.UCS, ucContext)(
                handleGet.bind(null, id)
            )(req, res);
        case "PUT":
            return requirePermission(ACTIONS.UPDATE, RESOURCES.UCS, ucContext)(
                handlePut.bind(null, id)
            )(req, res);
        case "DELETE":
            return requirePermission(ACTIONS.DELETE, RESOURCES.UCS, ucContext)(
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
