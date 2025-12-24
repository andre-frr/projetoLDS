import GrpcClient from '@/lib/grpc-client.js';

function handleError(error, res, notFoundMessage = 'Horas de contacto inexistentes.') {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
        message: statusCode === 404 ? notFoundMessage : error.message
    });
}

async function handleGet(compositeKey, res) {
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

async function handleDelete(compositeKey, res) {
    try {
        await GrpcClient.delete('uc_horas_contacto', compositeKey);
        return res.status(204).end();
    } catch (error) {
        return handleError(error, res);
    }
}

export default async function handler(req, res) {
    const {id_uc, tipo} = req.query;
    const compositeKey = {id_uc: Number.parseInt(id_uc), tipo};

    switch (req.method) {
        case 'GET':
            return handleGet(compositeKey, res);
        case 'PUT':
            return handlePut(compositeKey, req, res);
        case 'DELETE':
            return handleDelete(compositeKey, res);
        default:
            res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
