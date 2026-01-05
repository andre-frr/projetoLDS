import GrpcClient from "@/lib/grpc-client.js";
import {applyCors} from "@/lib/cors.js";
import {ACTIONS, requirePermission, RESOURCES} from "@/lib/authorize.js";
import pool from '@/lib/db.js';

function handleError(error, res) {
    console.error(error);
    const statusCode = error.statusCode || 500;
    return res
        .status(statusCode)
        .json({message: error.message || "Internal Server Error"});
}

/**
 * GET /api/dsd
 * Returns DSDs based on user role:
 * - Admin: All DSDs (optional filter by ano_letivo)
 * - Coordenador: DSDs for their courses/departments (optional filter by ano_letivo)
 * - Docente: Only their own DSDs (optional filter by ano_letivo)
 * - Convidado: No access
 */
async function handleGet(req, res) {
    const {ano_letivo, id_uc, id_doc} = req.query;
    const user = req.user;

    try {
        const params = {};

        // Role-based filtering
        if (user.role === 'Docente') {
            // Docentes only see their own DSDs
            // Get docente.id_doc from id_user
            const docenteResult = await pool.query(
                'SELECT id_doc FROM docente WHERE id_user = $1',
                [user.id]
            );

            if (docenteResult.rows.length === 0) {
                return res.status(403).json({
                    message: 'No docente record found for this user'
                });
            }

            params.id_doc = docenteResult.rows[0].id_doc;
        } else if (user.role === 'Coordenador') {
            // Coordenadores see DSDs for their assigned courses
            const {getCoordenadorCourses} = await import('@/lib/permissions.js');
            const courses = await getCoordenadorCourses(user.id);

            if (courses.length === 0) {
                return res.status(200).json([]); // No courses assigned
            }

            // For coordenadores, we'll filter in memory after getting results
            // Store the allowed courses
            params._coordenadorCourses = courses;
        }
        // Admin sees all (no additional filter)

        // Optional filters
        if (ano_letivo) {
            params.id_ano = Number.parseInt(ano_letivo);
        }

        if (id_uc) {
            params.id_uc = Number.parseInt(id_uc);
        }

        if (id_doc) {
            params.id_doc = Number.parseInt(id_doc);
        }

        // Get DSDs via gRPC custom query
        const coordenadorCourses = params._coordenadorCourses;
        delete params._coordenadorCourses;

        const result = await GrpcClient.executeCustomQuery("dsdWithDetails", params);

        // Filter by coordenador courses if applicable
        let data = result;
        if (coordenadorCourses) {
            data = result.filter(dsd => coordenadorCourses.includes(dsd.id_curso));
        }

        return res.status(200).json(data);
    } catch (error) {
        return handleError(error, res);
    }
}

/**
 * POST /api/dsd
 * Create DSD assignments
 * Body: {
 *   id_uc: number,
 *   turma: 'A' | 'B',
 *   tipo: 'PL' | 'T' | 'TP' | 'OT',
 *   assignments: [{ id_doc: number, horas: number }, ...]
 * }
 */
async function handlePost(req, res) {
    const {id_uc, turma, tipo, assignments} = req.body;

    if (!id_uc || !turma || !tipo || !assignments || !Array.isArray(assignments)) {
        return res.status(400).json({
            message: "Dados mal formatados. Campos obrigatórios: id_uc, turma, tipo, assignments"
        });
    }

    if (assignments.length === 0) {
        return res.status(400).json({
            message: "Pelo menos um docente deve ser atribuído"
        });
    }

    try {
        // Get current active academic year
        const anosLetivos = await GrpcClient.getAll("ano_letivo", {
            filters: {arquivado: false}
        });

        if (anosLetivos.length === 0) {
            return res.status(400).json({
                message: "Nenhum ano letivo ativo encontrado. Crie um ano letivo primeiro."
            });
        }

        // Get the most recent active year
        const activeYears = anosLetivos.sort((a, b) => b.ano_inicio - a.ano_inicio);
        const id_ano = activeYears[0].id_ano;

        // Verify UC exists
        try {
            await GrpcClient.getById("uc", id_uc);
        } catch (error) {
            if (error.statusCode === 404) {
                return res.status(404).json({message: "UC inexistente"});
            }
            throw error;
        }

        // Verify uc_turma exists
        const turmas = await GrpcClient.getAll("uc_turma", {
            filters: JSON.stringify({id_uc, turma, ano_letivo: id_ano})
        });

        if (turmas.length === 0) {
            return res.status(400).json({
                message: `Turma ${turma} não existe para esta UC no ano letivo ativo`
            });
        }

        // Verify all docentes exist
        for (const assignment of assignments) {
            if (!assignment.id_doc || !assignment.horas) {
                return res.status(400).json({
                    message: "Cada atribuição deve ter id_doc e horas"
                });
            }

            try {
                const docente = await GrpcClient.getById("docente", assignment.id_doc);
                if (!docente.ativo) {
                    return res.status(404).json({
                        message: `Docente com id ${assignment.id_doc} está inativo`
                    });
                }
            } catch (error) {
                if (error.statusCode === 404) {
                    return res.status(404).json({
                        message: `Docente com id ${assignment.id_doc} não encontrado`
                    });
                }
                throw error;
            }
        }

        // Check if DSD already exists for this UC, turma, tipo, and year
        const existingDsds = await GrpcClient.getAll("dsd", {
            filters: JSON.stringify({id_uc, turma, tipo, id_ano})
        });

        if (existingDsds.length > 0) {
            return res.status(409).json({
                message: `DSD já existe para esta UC, turma ${turma}, tipo ${tipo} no ano letivo ativo. Use PUT para atualizar.`
            });
        }

        // Create DSD records
        const createdDsds = [];
        for (const assignment of assignments) {
            const result = await GrpcClient.create("dsd", {
                id_doc: assignment.id_doc,
                id_ano: id_ano,
                id_uc: id_uc,
                tipo: tipo,
                horas: assignment.horas,
                turma: turma
            });
            createdDsds.push(result);
        }

        return res.status(201).json({
            message: `${createdDsds.length} atribuição(ões) criada(s) com sucesso`,
            dsds: createdDsds
        });
    } catch (error) {
        return handleError(error, res);
    }
}

async function handler(req, res) {
    const dsdContext = (req) => ({
        ucId: req.body?.id_uc || req.query?.id_uc,
        cursoId: req.body?.id_curso || req.query?.id_curso
    });

    switch (req.method) {
        case "GET":
            return requirePermission(ACTIONS.READ, RESOURCES.DSD)(handleGet)(req, res);
        case "POST":
            return requirePermission(ACTIONS.CREATE, RESOURCES.DSD, dsdContext)(handlePost)(req, res);
        default:
            res.setHeader("Allow", ["GET", "POST"]);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

export default async function handlerWithCors(req, res) {
    await applyCors(req, res);
    return handler(req, res);
}
