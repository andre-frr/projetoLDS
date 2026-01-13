import GrpcClient from '@/lib/grpc-client.js';
import {applyCors} from '@/lib/cors.js';
import {ACTIONS, requirePermission, RESOURCES} from '@/lib/authorize.js';

/**
 * GET /api/users/coordinators
 * Get all users with Coordenador role (for assignment dropdowns)
 */
async function handleGet(req, res) {
    try {
        const users = await GrpcClient.getAll('users', {
            filters: {role: 'Coordenador', ativo: true},
            orderBy: 'email'
        });

        return res.status(200).json(users);
    } catch (error) {
        console.error(error);
        return res.status(500).json({message: 'Internal Server Error'});
    }
}

async function handler(req, res) {
    if (req.method === 'GET') {
        return requirePermission(ACTIONS.READ, RESOURCES.USERS)(handleGet)(req, res);
    } else {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

export default async function handlerWithCors(req, res) {
    await applyCors(req, res);
    return handler(req, res);
}
