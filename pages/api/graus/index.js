import GrpcClient from '@/lib/grpc-client.js';

function handleError(error, res) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({message: error.message || 'Internal Server Error'});
}

async function handleGet(res) {
    try {
        const result = await GrpcClient.getAll('grau');
        return res.status(200).json(result);
    } catch (error) {
        return handleError(error, res);
    }
}

async function handlePost(req, res) {
    const {nome} = req.body;
    if (!nome) {
        return res.status(400).json({message: 'Dados mal formatados.'});
    }

    try {
        const result = await GrpcClient.create('grau', {nome});
        return res.status(201).json(result);
    } catch (error) {
        return handleError(error, res);
    }
}

export default async function handler(req, res) {
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
