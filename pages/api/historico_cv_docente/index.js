import GrpcClient from '@/lib/grpc-client.js';
export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            const result = await GrpcClient.getAll('historico_cv_docente');
            return res.status(200).json(result);
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({message: error.message || 'Internal Server Error'});
        }
    } else if (req.method === 'POST') {
        const {id_doc, data, link_cv} = req.body;
        if (!id_doc || !data || !link_cv) {
            return res.status(400).json({message: 'Dados mal formatados.'});
        }
        try {
            try {
                await GrpcClient.getById('docente', id_doc);
            } catch (error) {
                if (error.statusCode === 404) {
                    return res.status(404).json({message: 'Docente inexistente.'});
                }
                throw error;
            }
            const result = await GrpcClient.create('historico_cv_docente', {id_doc, data, link_cv});
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
