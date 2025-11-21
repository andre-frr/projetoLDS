import GrpcClient from '@/lib/grpc-client.js';

export default async function handler(req, res) {
    const {id} = req.query;

    if (req.method === 'GET') {
        try {
            const result = await GrpcClient.getById('historico_cv_docente', id);
            return res.status(200).json(result);
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({
                message: statusCode === 404 ? 'Histórico CV inexistente.' : error.message
            });
        }
    } else if (req.method === 'PUT') {
        const {id_doc, data, link_cv} = req.body;

        try {
            if (id_doc) {
                try {
                    await GrpcClient.getById('docente', id_doc);
                } catch (error) {
                    if (error.statusCode === 404) {
                        return res.status(404).json({message: 'Docente inexistente.'});
                    }
                    throw error;
                }
            }

            const result = await GrpcClient.update('historico_cv_docente', id, {
                id_doc,
                data,
                link_cv
            });
            return res.status(200).json(result);
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({
                message: statusCode === 404 ? 'Histórico CV inexistente.' : error.message
            });
        }
    } else if (req.method === 'DELETE') {
        try {
            await GrpcClient.delete('historico_cv_docente', id);
            return res.status(204).end();
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({
                message: statusCode === 404 ? 'Histórico CV inexistente.' : error.message
            });
        }
    } else {
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
