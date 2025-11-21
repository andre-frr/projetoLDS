import GrpcClient from '@/lib/grpc-client.js';

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            const result = await GrpcClient.getAll('docente_grau');
            return res.status(200).json(result);
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({message: error.message || 'Internal Server Error'});
        }
    } else if (req.method === 'POST') {
        const {id_doc, id_grau, grau_nome, data, link_certif} = req.body;

        if (!id_doc || (!id_grau && !grau_nome) || !data) {
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

            if (id_grau) {
                try {
                    await GrpcClient.getById('grau', id_grau);
                } catch (error) {
                    if (error.statusCode === 404) {
                        return res.status(404).json({message: 'Grau inexistente.'});
                    }
                    throw error;
                }
            }

            const result = await GrpcClient.create('docente_grau', {
                id_doc,
                id_grau,
                grau_nome,
                data,
                link_certif
            });
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
