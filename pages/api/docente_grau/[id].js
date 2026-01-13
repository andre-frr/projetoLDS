import GrpcClient from '@/lib/grpc-client.js';
import {applyCors} from '@/lib/cors.js';
import {ACTIONS, requirePermission, RESOURCES} from '@/lib/authorize.js';

async function handleGet(id, req, res) {
    try {
        const result = await GrpcClient.getById('docente_grau', id);
        return res.status(200).json(result);
    } catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).json({message: 'Grau de docente inexistente.'});
        }
        console.error(error);
        return res.status(500).json({message: 'Internal Server Error'});
    }
}

async function validateDocente(id_doc, res) {
    if (!id_doc) return null;

    try {
        await GrpcClient.getById('docente', id_doc);
        return null;
    } catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).json({message: 'Docente inexistente.'});
        }
        throw error;
    }
}

async function validateGrau(id_grau, res) {
    if (!id_grau) return null;

    try {
        await GrpcClient.getById('grau', id_grau);
        return null;
    } catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).json({message: 'Grau inexistente.'});
        }
        throw error;
    }
}

async function handlePut(id, req, res) {
    const {id_doc, id_grau, grau_nome, data, link_certif} = req.body;

    try {
        const docenteError = await validateDocente(id_doc, res);
        if (docenteError) return docenteError;

        const grauError = await validateGrau(id_grau, res);
        if (grauError) return grauError;

        const result = await GrpcClient.update('docente_grau', id, {
            id_doc,
            id_grau,
            grau_nome,
            data,
            link_certif
        });

        return res.status(200).json(result);
    } catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).json({message: 'Grau de docente inexistente.'});
        }
        console.error(error);
        return res.status(500).json({message: 'Internal Server Error'});
    }
}

async function handleDelete(id, req, res) {
    try {
        await GrpcClient.delete('docente_grau', id);
        return res.status(204).end();
    } catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).json({message: 'Grau de docente inexistente.'});
        }
        console.error(error);
        return res.status(500).json({message: 'Internal Server Error'});
    }
}

async function handler(req, res) {
    const {id} = req.query;

    const gradeContext = (req) => ({
        professorId: req.body?.id_doc
    });

    switch (req.method) {
        case 'GET':
            return requirePermission(ACTIONS.READ, RESOURCES.GRADES, gradeContext)(
                handleGet.bind(null, id)
            )(req, res);
        case 'PUT':
            return requirePermission(ACTIONS.UPDATE, RESOURCES.GRADES, gradeContext)(
                handlePut.bind(null, id)
            )(req, res);
        case 'DELETE':
            return requirePermission(ACTIONS.DELETE, RESOURCES.GRADES, gradeContext)(
                handleDelete.bind(null, id)
            )(req, res);
        default:
            res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

export default async function handlerWithCors(req, res) {
    await applyCors(req, res);
    return handler(req, res);
}
