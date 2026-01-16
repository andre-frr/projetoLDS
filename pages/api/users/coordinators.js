import GrpcClient from '@/lib/grpc-client.js';
import {applyCors} from '@/lib/cors.js';
import {ACTIONS, requirePermission, RESOURCES} from '@/lib/authorize.js';

/**
 * GET /api/users/coordinators
 * Get all users who are or can become coordinators (Coordenador and Docente roles)
 * Excludes guest teachers (convidado = true)
 */
async function handleGet(req, res) {
    try {
        // Fetch both Coordenadores and Docentes (teachers who can be promoted)
        const users = await GrpcClient.getAll('users', {
            filters: {ativo: true},
            orderBy: 'email'
        });

        // Fetch all docentes to check convidado flag
        const docentes = await GrpcClient.getAll('docente', {
            filters: {ativo: true}
        });

        // Create a map of user_id -> convidado flag
        const docenteMap = new Map();
        docentes.forEach(doc => {
            if (doc.id_user) {
                docenteMap.set(doc.id_user, doc.convidado === true);
            }
        });

        // Filter for eligible users:
        // - Coordenador (already promoted)
        // - Docente (can be promoted) BUT NOT guest teachers (convidado = true)
        const eligibleUsers = users.filter(user => {
            if (user.role === 'Coordenador') return true;
            if (user.role === 'Docente') {
                // Exclude guest teachers
                const isGuest = docenteMap.get(user.id);
                return !isGuest;
            }
            return false;
        });

        return res.status(200).json(eligibleUsers);
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
