import GrpcClient from '@/lib/grpc-client.js';
import {applyCors} from '@/lib/cors.js';

function handleError(error, res) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({message: error.message || 'Internal Server Error'});
}

async function handleGet(res) {
    try {
        const result = await GrpcClient.getAll('uc_horas_contacto');
        return res.status(200).json(result);
    } catch (error) {
        return handleError(error, res);
    }
}

async function validateUC(id_uc, res) {
    try {
        await GrpcClient.getById('uc', id_uc);
        return null;
    } catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).json({message: 'UC inexistente.'});
        }
        throw error;
    }
}

async function handlePost(req, res) {
    const {id_uc, tipo, horas} = req.body;

    if (!id_uc || !tipo || horas == null) {
        return res.status(400).json({message: 'Dados mal formatados.'});
    }

    try {
        const ucError = await validateUC(id_uc, res);
        if (ucError) return ucError;

        const existing = await GrpcClient.getAll('uc_horas_contacto', {
            filters: {id_uc: Number.parseInt(id_uc), tipo}
        });
        if (existing.length > 0) {
            return res.status(409).json({message: 'Horas de contacto já definidas para este tipo.'});
        }

        const result = await GrpcClient.create('uc_horas_contacto', {
            id_uc,
            tipo,
            horas
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

