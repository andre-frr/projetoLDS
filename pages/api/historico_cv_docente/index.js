﻿
import GrpcClient from '@/lib/grpc-client.js';
import {applyCors} from '@/lib/cors.js';
import {ACTIONS, requirePermission, RESOURCES} from '@/lib/authorize.js';

function handleError(error, res) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({message: error.message || 'Internal Server Error'});
}

async function handleGet(req, res) {
    try {
        const result = await GrpcClient.getAll('historico_cv_docente');
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

async function handlePost(req, res) {
    const {id_doc, data, link_cv} = req.body;
    if (!id_doc || !data || !link_cv) {
        return res.status(400).json({message: 'Dados mal formatados.'});
    }

    try {
        const docenteError = await validateDocente(id_doc, res);
        if (docenteError) return docenteError;

        // Validate that docentes can only create their own CV
        if (req.user.role === 'Docente') {
            const docentes = await GrpcClient.getAll('docente', {
                filters: {id_doc: Number(id_doc)}
            });

            if (docentes.length === 0 || docentes[0].id_user !== req.user.id) {
                return res.status(403).json({message: 'You can only create CV entries for yourself'});
            }
        }

        const result = await GrpcClient.create('historico_cv_docente', {id_doc, data, link_cv});
        return res.status(201).json(result);
    } catch (error) {
        return handleError(error, res);
    }
}

async function handler(req, res) {
    switch (req.method) {
        case 'GET':
            return requirePermission(ACTIONS.READ, RESOURCES.CV_HISTORY)(handleGet)(req, res);
        case 'POST':
            return requirePermission(ACTIONS.CREATE, RESOURCES.CV_HISTORY)(handlePost)(req, res);
        default:
            res.setHeader('Allow', ['GET', 'POST']);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

export default async function handlerWithCors(req, res) {
    await applyCors(req, res);
    return handler(req, res);
}
