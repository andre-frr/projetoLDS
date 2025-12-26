import GrpcClient from '@/lib/grpc-client.js';
import {applyCors} from '@/lib/cors.js';

function handleError(error, res) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({message: error.message || 'Internal Server Error'});
}

async function handleGet(res) {
    try {
        const result = await GrpcClient.getAll('docente_grau');
        return res.status(200).json(result);
    } catch (error) {
        return handleError(error, res);
    }
}

async function validateDocente(id_doc, res) {
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

async function handlePost(req, res) {
    const {id_doc, id_grau, grau_nome, data, link_certif} = req.body;

    if (!id_doc || (!id_grau && !grau_nome) || !data) {
        return res.status(400).json({message: 'Dados mal formatados.'});
    }

    try {
        const docenteError = await validateDocente(id_doc, res);
        if (docenteError) return docenteError;

        const grauError = await validateGrau(id_grau, res);
        if (grauError) return grauError;

        const result = await GrpcClient.create('docente_grau', {
            id_doc,
            id_grau,
            grau_nome,
            data,
            link_certif
        });
        return res.status(201).json(result);
    } catch (error) {
        return handleError(error, res);
    }
}

async function handler(req, res) {
    switch (req.method) {
        case 'GET':
            return handleGet(res);
        case 'POST':
            return handlePost(req, res);
        default:
            res.setHeader('Allow', ['GET', 'POST']);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

export default async function handlerWithCors(req, res) {
    await applyCors(req, res);
    return handler(req, res);
}

