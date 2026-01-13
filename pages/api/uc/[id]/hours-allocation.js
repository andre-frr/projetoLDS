import GrpcClient from '@/lib/grpc-client.js';
import {applyCors} from '@/lib/cors.js';
import {ACTIONS, requirePermission, RESOURCES} from '@/lib/authorize.js';

/**
 * GET /api/uc/[id]/hours-allocation?turma=A&ano_letivo=1
 * Get hours allocation status for a UC and turma
 * Returns: [{ tipo, total_horas, allocated_horas, available_horas }]
 */
async function handleGet(id, req, res) {
    const {turma, ano_letivo} = req.query;

    if (!turma) {
        return res.status(400).json({message: 'Turma é obrigatória'});
    }

    try {
        // Get active academic year if not specified
        let anoLetivoId = ano_letivo;
        if (!anoLetivoId) {
            const anosLetivos = await GrpcClient.getAll('ano_letivo', {
                filters: {arquivado: false}
            });
            if (anosLetivos.length === 0) {
                return res.status(400).json({
                    message: 'Nenhum ano letivo ativo encontrado'
                });
            }
            const activeYears = anosLetivos.sort((a, b) => b.ano_inicio - a.ano_inicio);
            anoLetivoId = activeYears[0].id_ano;
        }

        // Verify UC exists
        await GrpcClient.getById('uc', id);

        // Get hours allocation status
        const allocation = await GrpcClient.executeCustomQuery('ucHoursAllocation', {
            id_uc: Number(id),
            turma,
            id_ano: Number(anoLetivoId)
        });

        return res.status(200).json(allocation);
    } catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).json({message: 'UC não encontrada'});
        }
        console.error(error);
        return res.status(500).json({message: 'Internal Server Error'});
    }
}

async function handler(req, res) {
    const {id} = req.query;

    const ucContext = () => ({ucId: id});

    if (req.method === 'GET') {
        return requirePermission(ACTIONS.READ, RESOURCES.HOURS, ucContext)(
            handleGet.bind(null, id)
        )(req, res);
    } else {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

export default async function handlerWithCors(req, res) {
    await applyCors(req, res);
    return handler(req, res);
}
