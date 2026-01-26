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
            const docentes = await GrpcClient.getAll('docente', {
                filters: {id_user: user.id}
            });

            if (docentes.length === 0) {
                return res.status(403).json({
                    message: 'No docente record found for this user'
                });
            }

            params.id_doc = docentes[0].id_doc;
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
        filters: {id_uc, turma, ano_letivo: id_ano}
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

        // Ensure id_doc and horas are numbers
        assignment.id_doc = Number(assignment.id_doc);
        assignment.horas = Number(assignment.horas);

        if (Number.isNaN(assignment.id_doc) || Number.isNaN(assignment.horas)) {
            throw new TypeError("id_doc e horas devem ser números válidos");
        }

        const docente = await GrpcClient.getById("docente", assignment.id_doc);
        if (!docente.ativo) {
            throw new Error(`Docente com id ${assignment.id_doc} está inativo`);
        }
    }
}

/**
 * Check if DSD already exists for specific docents
 * Returns an array of docent IDs that already have assignments
 */
async function checkDsdExistsForDocents(id_uc, turma, tipo, id_ano, assignments) {
    const existingDsds = await GrpcClient.getAll("dsd", {
        filters: {id_uc, turma, tipo, id_ano}
    });

    // Get the docent IDs that already have assignments
    const existingDocentIds = new Set(existingDsds.map(dsd => dsd.id_doc));

    // Check which docents from the new assignments already exist
    const conflictingDocents = assignments.filter(a =>
        existingDocentIds.has(Number(a.id_doc))
    );

    return conflictingDocents;
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
 * Verify hours availability for DSD creation
 */
async function verifyHoursAvailability(id_uc, turma, tipo, assignments, id_ano) {
    // Get hours allocation status
    const allocation = await GrpcClient.executeCustomQuery('ucHoursAllocation', {
        id_uc: Number(id_uc),
        turma,
        id_ano: Number(id_ano)
    });

    // Find the tipo we're trying to allocate
    const tipoAllocation = allocation.find(a => a.tipo === tipo);

    if (!tipoAllocation) {
        const error = new Error(`Tipo de horas ${tipo} não configurado para esta UC`);
        error.status = 400;
        throw error;
    }

    // Calculate total hours being requested
    const requestedHoras = assignments.reduce((sum, a) => sum + Number(a.horas), 0);

    // Check if requested hours exceed available hours
    if (requestedHoras > tipoAllocation.available_horas) {
        const error = new Error(
            `Horas excedidas: ${requestedHoras}h solicitadas mas apenas ${tipoAllocation.available_horas}h disponíveis ` +
            `(${tipoAllocation.total_horas}h total, ${tipoAllocation.allocated_horas}h já alocadas)`
        );
        error.status = 400;
        throw error;
    }

    return tipoAllocation;
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

    const conflictingDocents = await checkDsdExistsForDocents(id_uc, turma, tipo, id_ano, assignments);
    if (conflictingDocents.length > 0) {
        const docentIds = conflictingDocents.map(d => d.id_doc).join(', ');
        const error = new Error(`DSD já existe para os docentes (IDs: ${docentIds}) nesta UC, turma ${turma}, tipo ${tipo} no ano letivo ativo. Elimine a atribuição existente primeiro.`);
        error.status = 409;
        throw error;
    }

    // Verify hours availability
    await verifyHoursAvailability(id_uc, turma, tipo, assignments, id_ano);

    return id_ano;
}

/**
 * Create DSD records for all assignments
 */
async function createDsdRecords(id_uc, turma, tipo, assignments, id_ano) {
    const createdDsds = [];

    // Ensure all values are the correct types
    const ucId = Number(id_uc);
    const anoId = Number(id_ano);

    console.log('[DSD Create] Creating records with:', {
        id_uc: ucId,
        id_ano: anoId,
        turma,
        tipo,
        assignmentsCount: assignments.length
    });

    for (const assignment of assignments) {
        const dsdData = {
            id_doc: Number(assignment.id_doc),
            id_ano: anoId,
            id_uc: ucId,
            tipo: tipo,
            horas: Number(assignment.horas),
            turma: turma
        };

        console.log('[DSD Create] Creating DSD with data:', dsdData);

        const result = await GrpcClient.create("dsd", dsdData);
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

    console.log('[DSD POST] Received request:', {
        id_uc,
        turma,
        tipo,
        assignments
    });

    // Validate request
    const validation = validateDsdRequest(req.body);
    if (!validation.valid) {
        return res.status(400).json({message: validation.error});
    }

    try {
        // Verify prerequisites and get academic year
        const id_ano = await verifyDsdPrerequisites(id_uc, turma, tipo, assignments);

        console.log('[DSD POST] Active academic year:', id_ano);

        // Create DSD records
        const createdDsds = await createDsdRecords(id_uc, turma, tipo, assignments, id_ano);

        return res.status(201).json({
            message: `${createdDsds.length} atribuição(ões) criada(s) com sucesso`,
            dsds: createdDsds
        });
    } catch (error) {
        console.error('[DSD POST] Error:', error);
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
