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

        // Fetch all docentes to check convidado flag and get names
        const docentes = await GrpcClient.getAll('docente', {
            filters: {ativo: true}
        });

        // Create a map of user_id -> docente data (convidado flag + nome)
        const docenteMap = new Map();
        docentes.forEach(doc => {
            if (doc.id_user) {
                docenteMap.set(doc.id_user, {
                    convidado: doc.convidado === true,
                    nome: doc.nome
                });
            }
        });

        // Filter for eligible users and enrich with docente names:
        // - Coordenador (already promoted)
        // - Docente (can be promoted) BUT NOT guest teachers (convidado = true)
        const eligibleUsers = users
            .filter(user => {
                if (user.role === 'Coordenador') return true;
                if (user.role === 'Docente') {
                    // Exclude guest teachers
                    const docenteData = docenteMap.get(user.id);
                    return docenteData && !docenteData.convidado;
                }
                return false;
            })
            .map(user => {
                // Add docente name if available
                const docenteData = docenteMap.get(user.id);
                return {
                    ...user,
                    nome: docenteData?.nome || user.email.split('@')[0] // fallback to email prefix
                };
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
