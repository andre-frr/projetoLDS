import GrpcClient from "@/lib/grpc-client.js";
import {applyCors} from "@/lib/cors.js";
import {ACTIONS, requirePermission, RESOURCES} from "@/lib/authorize.js";

function handleError(error, res) {
    console.error(error);
    const statusCode = error.statusCode || 500;
    return res
        .status(statusCode)
        .json({message: error.message || "Internal Server Error"});
}

/**
 * GET /api/dsd/by-uc/[id_uc]
 * Get DSD summary for a specific UC
 * Returns all assignments grouped by turma and tipo
 */
async function handleGet(id_uc, req, res) {
    const {ano_letivo} = req.query;

    try {
        const params = {
            id_uc: Number.parseInt(id_uc)
        };

        if (ano_letivo) {
            params.id_ano = Number.parseInt(ano_letivo);
        }

        const result = await GrpcClient.executeCustomQuery("dsdByUcGrouped", params);

        // Group by turma and tipo
        const grouped = {};
        result.forEach(row => {
            const key = `${row.turma}_${row.tipo}`;
            if (!grouped[key]) {
                grouped[key] = {
                    turma: row.turma,
                    tipo: row.tipo,
                    ano_letivo: {
                        id_ano: row.id_ano,
                        ano_inicio: row.ano_inicio,
                        ano_fim: row.ano_fim
                    },
                    assignments: [],
                    total_horas: 0
                };
            }
            grouped[key].assignments.push({
                id_dsd: row.id_dsd,
                id_doc: row.id_doc,
                docente_nome: row.docente_nome,
                docente_email: row.docente_email,
                horas: row.horas
            });
            grouped[key].total_horas += row.horas;
        });

        return res.status(200).json(Object.values(grouped));
    } catch (error) {
        return handleError(error, res);
    }
}

async function handler(req, res) {
    const {id_uc} = req.query;

    const ucContext = async () => {
        try {
            const uc = await GrpcClient.getById("uc", id_uc);
            return {
                ucId: Number.parseInt(id_uc),
                cursoId: uc.id_curso
            };
        } catch (error) {
            console.error('Error getting UC context:', error);
            return {ucId: Number.parseInt(id_uc)};
        }
    };

    if (req.method === "GET") {
        return requirePermission(ACTIONS.READ, RESOURCES.DSD, ucContext)(
            handleGet.bind(null, id_uc)
        )(req, res);
    } else {
        res.setHeader("Allow", ["GET"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

export default async function handlerWithCors(req, res) {
    await applyCors(req, res);
    return handler(req, res);
}
