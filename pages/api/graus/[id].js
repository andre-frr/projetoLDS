import GrpcClient from '@/lib/grpc-client.js';

export default async function handler(req, res) {
    const {id} = req.query;

    if (req.method === 'GET') {
        try {
            const result = await GrpcClient.getById('grau', id);
            return res.status(200).json(result);
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({
                message: statusCode === 404 ? 'Grau inexistente.' : error.message
            });
        }
    } else if (req.method === 'PUT') {
        const {nome} = req.body;
        if (!nome) {
            return res.status(400).json({message: 'Dados mal formatados.'});
        }

        try {
            const result = await GrpcClient.update('grau', id, {nome});
            return res.status(200).json(result);
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({
                message: statusCode === 404 ? 'Grau inexistente.' : error.message
            });
        }
    } else if (req.method === 'DELETE') {
        try {
            await GrpcClient.delete('grau', id);
            return res.status(204).end();
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({
                message: statusCode === 404 ? 'Grau inexistente.' : error.message
            });
        }
    } else {
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
