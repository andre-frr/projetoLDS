import GrpcClient from '@/lib/grpc-client.js';

export default async function handler(req, res) {
    const {id} = req.query;

    if (req.method === 'GET') {
        try {
            const result = await GrpcClient.getById('docente', id);
            return res.status(200).json(result);
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({
                message: statusCode === 404 ? 'Docente inexistente.' : error.message
            });
        }
    } else if (req.method === 'PUT') {
        const {nome, email, id_area, convidado} = req.body;

        if (!nome || !email || !id_area) {
            return res.status(400).json({message: 'Dados mal formatados.'});
        }

        try {
            const current = await GrpcClient.getById('docente', id);

            if (email !== current.email) {
                const existing = await GrpcClient.getAll('docente', {filters: {email}});
                const duplicate = existing.find(doc => doc.id_doc !== parseInt(id));
                if (duplicate) {
                    return res.status(409).json({message: 'Email duplicado.'});
                }
            }

            try {
                await GrpcClient.getById('area_cientifica', id_area);
            } catch (error) {
                if (error.statusCode === 404) {
                    return res.status(404).json({message: 'Área científica inexistente.'});
                }
                throw error;
            }

            const result = await GrpcClient.update('docente', id, {
                nome,
                email,
                id_area,
                convidado
            });
            return res.status(200).json(result);
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({
                message: statusCode === 404 ? 'Docente inexistente.' : error.message
            });
        }
    } else if (req.method === 'DELETE') {
        try {
            await GrpcClient.delete('docente', id);
            return res.status(204).end();
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({
                message: statusCode === 404 ? 'Docente inexistente.' : error.message
            });
        }
    } else {
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
