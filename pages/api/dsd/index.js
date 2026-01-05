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
 * Get the active academic year
 */
async function getActiveAcademicYear() {
    const anosLetivos = await GrpcClient.getAll("ano_letivo", {
        filters: {arquivado: false}
    });

    if (anosLetivos.length === 0) {
        return null;
    }

    const activeYears = anosLetivos.sort((a, b) => b.ano_inicio - a.ano_inicio);
    return activeYears[0].id_ano;
}

/**
 * Verify UC and turma exist
 */
async function verifyUcAndTurma(id_uc, turma, id_ano) {
    // Verify UC exists
    await GrpcClient.getById("uc", id_uc);

    // Verify uc_turma exists
    const turmas = await GrpcClient.getAll("uc_turma", {
        filters: JSON.stringify({id_uc, turma, ano_letivo: id_ano})
    });

    return turmas.length > 0;
}

/**
 * Verify all docentes in assignments
 */
async function verifyDocentes(assignments) {
    for (const assignment of assignments) {
        if (!assignment.id_doc || !assignment.horas) {
            throw new Error("Cada atribuição deve ter id_doc e horas");
        }

        const docente = await GrpcClient.getById("docente", assignment.id_doc);
        if (!docente.ativo) {
            throw new Error(`Docente com id ${assignment.id_doc} está inativo`);
        }
    }
}

/**
 * Check if DSD already exists
 */
async function checkDsdExists(id_uc, turma, tipo, id_ano) {
    const existingDsds = await GrpcClient.getAll("dsd", {
        filters: JSON.stringify({id_uc, turma, tipo, id_ano})
    });

    return existingDsds.length > 0;
}

/**
 * Validate request body for DSD creation
 */
function validateDsdRequest(body) {
    const {id_uc, turma, tipo, assignments} = body;

    if (!id_uc || !turma || !tipo || !assignments || !Array.isArray(assignments)) {
        return {
            valid: false,
            error: "Dados mal formatados. Campos obrigatórios: id_uc, turma, tipo, assignments"
        };
    }

    if (assignments.length === 0) {
        return {
            valid: false,
            error: "Pelo menos um docente deve ser atribuído"
        };
    }

    return {valid: true};
}

/**
 * Verify all prerequisites for DSD creation
 */
async function verifyDsdPrerequisites(id_uc, turma, tipo, assignments) {
    const id_ano = await getActiveAcademicYear();
    if (!id_ano) {
        const error = new Error("Nenhum ano letivo ativo encontrado. Crie um ano letivo primeiro.");
        error.status = 400;
        throw error;
    }

    const turmaExists = await verifyUcAndTurma(id_uc, turma, id_ano);
    if (!turmaExists) {
        const error = new Error(`Turma ${turma} não existe para esta UC no ano letivo ativo`);
        error.status = 400;
        throw error;
    }

    await verifyDocentes(assignments);

    const dsdExists = await checkDsdExists(id_uc, turma, tipo, id_ano);
    if (dsdExists) {
        const error = new Error(`DSD já existe para esta UC, turma ${turma}, tipo ${tipo} no ano letivo ativo. Use PUT para atualizar.`);
        error.status = 409;
        throw error;
    }

    return id_ano;
}

/**
 * Create DSD records for all assignments
 */
async function createDsdRecords(id_uc, turma, tipo, assignments, id_ano) {
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

    return createdDsds;
}

/**
 * Handle errors from DSD operations
 */
function handleDsdError(error, res) {
    if (error.status) {
        return res.status(error.status).json({message: error.message});
    }

    if (error.statusCode === 404) {
        return res.status(404).json({message: error.message || "Recurso não encontrado"});
    }

    if (error.message && !error.statusCode) {
        return res.status(400).json({message: error.message});
    }

    return handleError(error, res);
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

    // Validate request
    const validation = validateDsdRequest(req.body);
    if (!validation.valid) {
        return res.status(400).json({message: validation.error});
    }

    try {
        // Verify prerequisites and get academic year
        const id_ano = await verifyDsdPrerequisites(id_uc, turma, tipo, assignments);

        // Create DSD records
        const createdDsds = await createDsdRecords(id_uc, turma, tipo, assignments, id_ano);

        return res.status(201).json({
            message: `${createdDsds.length} atribuição(ões) criada(s) com sucesso`,
            dsds: createdDsds
        });
    } catch (error) {
        return handleDsdError(error, res);
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
