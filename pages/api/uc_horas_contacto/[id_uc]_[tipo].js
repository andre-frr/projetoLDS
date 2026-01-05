import GrpcClient from '@/lib/grpc-client.js';
import {applyCors} from '@/lib/cors.js';

function handleError(error, res, notFoundMessage = 'Horas de contacto inexistentes.') {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
        message: statusCode === 404 ? notFoundMessage : error.message
    });
}

async function handleGet(compositeKey, req, res) {
    try {
        const result = await GrpcClient.getById('uc_horas_contacto', compositeKey);
        return res.status(200).json(result);
    } catch (error) {
        return handleError(error, res);
    }
}

async function handlePut(compositeKey, req, res) {
    const {horas} = req.body;

    if (horas == null) {
        return res.status(400).json({message: 'Dados mal formatados.'});
    }

    try {
        const result = await GrpcClient.update('uc_horas_contacto', compositeKey, {horas});
        return res.status(200).json(result);
    } catch (error) {
        return handleError(error, res);
    }
}

async function handleDelete(compositeKey, req, res) {
    try {
        await GrpcClient.delete('uc_horas_contacto', compositeKey);
        return res.status(204).end();
    } catch (error) {
        return handleError(error, res);
    }
}

async function handler(req, res) {
    const {id_uc, tipo} = req.query;
    const compositeKey = {id_uc: Number.parseInt(id_uc), tipo};

    const hoursContext = () => ({ucId: id_uc});

    switch (req.method) {
        case 'GET':
            return requirePermission(ACTIONS.READ, RESOURCES.HOURS, hoursContext)(
                handleGet.bind(null, compositeKey)
            )(req, res);
        case 'PUT':
            return requirePermission(ACTIONS.UPDATE, RESOURCES.HOURS, hoursContext)(
                handlePut.bind(null, compositeKey)
            )(req, res);
        case 'DELETE':
            return requirePermission(ACTIONS.DELETE, RESOURCES.HOURS, hoursContext)(
                handleDelete.bind(null, compositeKey)
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
