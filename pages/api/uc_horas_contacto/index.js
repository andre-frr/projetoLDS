import GrpcClient from '@/lib/grpc-client.js';

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            const result = await GrpcClient.getAll('uc_horas_contacto');
            return res.status(200).json(result);
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({message: error.message || 'Internal Server Error'});
        }
    } else if (req.method === 'POST') {
        const {id_uc, tipo, horas} = req.body;

        if (!id_uc || !tipo || horas == null) {
            return res.status(400).json({message: 'Dados mal formatados.'});
        }

        try {
            // Validate UC exists
            try {
                await GrpcClient.getById('uc', id_uc);
            } catch (error) {
                if (error.statusCode === 404) {
                    return res.status(404).json({message: 'UC inexistente.'});
                }
                throw error;
            }

            // Check if already exists (composite key)
            const existing = await GrpcClient.getAll('uc_horas_contacto', {
                filters: {id_uc: parseInt(id_uc), tipo}
            });
            if (existing.length > 0) {
                return res.status(409).json({message: 'Horas de contacto já definidas para este tipo.'});
            }

            const result = await GrpcClient.create('uc_horas_contacto', {
                id_uc,
                tipo,
                horas
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
