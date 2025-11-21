import GrpcClient from '@/lib/grpc-client.js';

export default async function handler(req, res) {
    const {id} = req.query;

    if (req.method === 'GET') {
        try {
            const result = await GrpcClient.getById('curso', id);
            return res.status(200).json(result);
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({
                message: statusCode === 404 ? 'Curso inexistente.' : error.message
            });
        }
    } else if (req.method === 'PUT') {
        const {nome, sigla, tipo, ativo} = req.body;

        try {
            const current = await GrpcClient.getById('curso', id);

            if (sigla && sigla !== current.sigla) {
                const existing = await GrpcClient.getAll('curso', {filters: {sigla}});
                const duplicate = existing.find(curso => curso.id_curso !== parseInt(id));
                if (duplicate) {
                    return res.status(409).json({message: 'Sigla duplicada.'});
                }
            }

            const updateData = {
                nome: nome ?? current.nome,
                sigla: sigla ?? current.sigla,
                tipo: tipo ?? current.tipo,
                ativo: ativo ?? current.ativo
            };

            const result = await GrpcClient.update('curso', id, updateData);
            return res.status(200).json(result);
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({
                message: statusCode === 404 ? 'Curso inexistente.' : error.message
            });
        }
    } else if (req.method === 'DELETE') {
        try {
            const ucs = await GrpcClient.getAll('uc', {filters: {id_curso: parseInt(id)}});
            if (ucs.length > 0) {
                await GrpcClient.update('curso', id, {ativo: false});
                return res.status(200).json({message: 'Curso marcado como inativo.'});
            } else {
                await GrpcClient.delete('curso', id);
                return res.status(204).end();
            }
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({
                message: statusCode === 404 ? 'Curso inexistente.' : error.message
            });
        }
    } else {
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
