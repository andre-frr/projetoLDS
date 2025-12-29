import GrpcClient from '@/lib/grpc-client.js';
import {applyCors} from '@/lib/cors.js';
import {ACTIONS, requirePermission, RESOURCES} from '@/lib/authorize.js';

function handleError(error, res, notFoundMessage = 'Grau inexistente.') {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
        message: statusCode === 404 ? notFoundMessage : error.message
    });
}

async function handleGet(id, req, res) {
    try {
        const result = await GrpcClient.getById('grau', id);
        return res.status(200).json(result);
    } catch (error) {
        return handleError(error, res);
    }
}

async function handlePut(id, req, res) {
    const {nome} = req.body;
    if (!nome) {
        return res.status(400).json({message: 'Dados mal formatados.'});
    }

    try {
        const result = await GrpcClient.update('grau', id, {nome});
        return res.status(200).json(result);
    } catch (error) {
        return handleError(error, res);
    }
}

async function handleDelete(id, req, res) {
    try {
        await GrpcClient.delete('grau', id);
        return res.status(204).end();
    } catch (error) {
        return handleError(error, res);
    }
}

async function handler(req, res) {
    const {id} = req.query;

    switch (req.method) {
        case 'GET':
            return requirePermission(ACTIONS.READ, RESOURCES.GRADES)(handleGet.bind(null, id))(req, res);
        case 'PUT':
            return requirePermission(ACTIONS.UPDATE, RESOURCES.GRADES)(handlePut.bind(null, id))(req, res);
        case 'DELETE':
            return requirePermission(ACTIONS.DELETE, RESOURCES.GRADES)(handleDelete.bind(null, id))(req, res);
        default:
            res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

export default async function handlerWithCors(req, res) {
    await applyCors(req, res);
    return handler(req, res);
}

