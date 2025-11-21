import GrpcClient from '@/lib/grpc-client.js';

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            const result = await GrpcClient.getAll('grau');
            return res.status(200).json(result);
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({message: error.message || 'Internal Server Error'});
        }
    } else if (req.method === 'POST') {
        const {nome} = req.body;
        if (!nome) {
            return res.status(400).json({message: 'Dados mal formatados.'});
        }

        try {
            const result = await GrpcClient.create('grau', {nome});
            return res.status(201).json(result);
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({message: error.message || 'Internal Server Error'});
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
