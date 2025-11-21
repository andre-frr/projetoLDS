import GrpcClient from '@/lib/grpc-client.js';

export default async function handler(req, res) {
    switch (req.method) {
        case 'GET':
            try {
                // Use custom query for joined data
                const rows = await GrpcClient.executeCustomQuery('areasWithDepartamento');
                res.status(200).json(rows);
            } catch (err) {
                const statusCode = err.statusCode || 500;
                res.status(statusCode).json({error: err.message});
            }
            break;

        case 'POST':
            try {
                const {nome, sigla, id_dep} = req.body;
                if (!nome || !sigla || !id_dep) {
                    return res.status(400).json({message: 'Dados mal formatados.'});
                }

                // Validate department exists
                try {
                    await GrpcClient.getById('departamento', id_dep);
                } catch (error) {
                    if (error.statusCode === 404) {
                        return res.status(400).json({message: 'Departamento inexistente.'});
                    }
                    throw error;
                }

                const result = await GrpcClient.create('area_cientifica', {
                    nome,
                    sigla,
                    id_dep,
                    ativo: true
                });
                res.status(201).json(result);
            } catch (err) {
                const statusCode = err.statusCode || 500;
                res.status(statusCode).json({error: err.message});
            }
            break;

        default:
            res.setHeader('Allow', ['GET', 'POST']);
            res.status(405).json({message: 'Method not allowed'});
    }
}
