import pool from './db.js';

/**
 * Centralized Permission System
 *
 * Role Hierarchy:
 * - Administrador: Gestão global do sistema. Criar/editar cursos, UCs, docentes, áreas e utilizadores.
 * - Coordenador: Responsável por um curso ou área científica. Atribuir docentes às UCs do seu curso,
 *                consultar planos de estudo e validar cargas horárias.
 * - Docente: Utilizador individual com serviço atribuído. Consultar o seu serviço e horas,
 *            atualizar dados pessoais e submeter CV.
 * - Convidado: Utilizador externo autenticado apenas para leitura. Consultar informação pública
 *              (cursos e planos de estudo).
 */

// Resource types
export const RESOURCES = {
    USERS: 'users',
    DEPARTMENTS: 'departments',
    COURSES: 'courses',
    AREAS: 'areas',
    PROFESSORS: 'professors',
    UCS: 'ucs',
    ACADEMIC_YEARS: 'academic_years',
    HOURS: 'hours',
    GRADES: 'grades',
    CV_HISTORY: 'cv_history',
    DSD: 'dsd', // Teaching assignments (Distribuição de Serviço Docente)
};

// Action types
export const ACTIONS = {
    CREATE: 'create',
    READ: 'read',
    UPDATE: 'update',
    DELETE: 'delete',
    MANAGE: 'manage', // Special action for full CRUD
};

/**
 * Check if user has permission to perform action on resource
 * @param {Object} user - User object with id, role
 * @param {string} action - Action to perform (create, read, update, delete)
 * @param {string} resource - Resource type
 * @param {Object} context - Additional context (e.g., departmentId, cursoId)
 * @returns {Promise<boolean>}
 */
export async function hasPermission(user, action, resource, context = {}) {
    if (!user?.role) {
        return false;
    }

    // Administrador has full access to everything
    if (user.role === 'Administrador') {
        return true;
    }

    // Extract user ID from JWT payload (uses 'sub' claim)
    const userId = user.sub || user.id;

    // Docente permissions: Read own service/hours, update personal data, submit CV
    if (user.role === 'Docente') {
        return await checkDocentePermission(userId, action, resource, context);
    }

    // Convidado permissions: Read-only for public information (courses and study plans)
    if (user.role === 'Convidado') {
        if (action !== ACTIONS.READ) {
            return false;
        }
        // Can only read courses and UCs (study plans)
        return resource === RESOURCES.COURSES || resource === RESOURCES.UCS;
    }

    // Coordenador permissions
    if (user.role === 'Coordenador') {
        return await checkCoordenadorPermission(userId, action, resource, context);
    }

    return false;
}

/**
 * Check Docente permissions
 * Docentes can:
 * - Read their own service and hours
 * - Update their own personal data
 * - Submit/update their own CV
 */
async function checkDocentePermission(userId, action, resource, context) {
    const actionHandlers = {
        [ACTIONS.READ]: () => checkDocenteReadPermission(userId, resource, context),
        [ACTIONS.UPDATE]: () => checkDocenteUpdatePermission(userId, resource, context),
        [ACTIONS.CREATE]: () => resource === RESOURCES.CV_HISTORY,
    };

    const handler = actionHandlers[action];
    return handler ? handler() : false;
}

/**
 * Check read permissions for Docente
 */
async function checkDocenteReadPermission(userId, resource, context) {
    // Can read public information
    if (resource === RESOURCES.COURSES || resource === RESOURCES.UCS) {
        return true;
    }

    // Can read own DSDs (filtering is done in the endpoint based on id_doc)
    if (resource === RESOURCES.DSD) {
        return true; // Endpoint will filter by docente
    }

    // Can read own data if professorId is provided
    if (!context.professorId) {
        return false;
    }

    const ownDataResources = [RESOURCES.PROFESSORS, RESOURCES.HOURS, RESOURCES.CV_HISTORY];
    return ownDataResources.includes(resource) && await isProfessorOwnData(userId, context.professorId);
}

/**
 * Check update permissions for Docente
 */
async function checkDocenteUpdatePermission(userId, resource, context) {
    if (!context.professorId) {
        return false;
    }

    const updatableResources = [RESOURCES.PROFESSORS, RESOURCES.CV_HISTORY];
    return updatableResources.includes(resource) && await isProfessorOwnData(userId, context.professorId);
}

/**
 * Check Coordenador permissions based on their assignments
 * Coordenadores can:
 * - Manage UCs in their courses (create, read, update, delete)
 * - Assign professors to UCs in their courses
 * - View study plans (read courses and UCs)
 * - Validate and manage hours for UCs in their courses
 * - Manage scientific areas in their departments
 */
async function checkCoordenadorPermission(userId, action, resource, context) {
    // Coordenadores can read everything (to consult information)
    if (action === ACTIONS.READ) {
        return true;
    }

    // Route to specific resource handlers
    const handlers = {
        [RESOURCES.USERS]: () => false, // Only admins can manage users
        [RESOURCES.DEPARTMENTS]: () => false, // Only admins can manage departments
        [RESOURCES.GRADES]: () => false, // Only admins can manage grades
        [RESOURCES.COURSES]: () => handleCoordenadorCoursePermission(userId, context),
        [RESOURCES.AREAS]: () => handleCoordenadorAreaPermission(userId, context),
        [RESOURCES.PROFESSORS]: () => handleCoordenadorProfessorPermission(userId, context),
        [RESOURCES.UCS]: () => handleCoordenadorUcPermission(userId, context),
        [RESOURCES.HOURS]: () => handleCoordenadorHoursPermission(userId, context),
        [RESOURCES.DSD]: () => handleCoordenadorDsdPermission(userId, action),
        [RESOURCES.ACADEMIC_YEARS]: () => handleAcademicYearPermission(userId),
        [RESOURCES.CV_HISTORY]: () => false, // Coordenadores cannot manage CV history
    };

    const handler = handlers[resource];
    return handler ? handler() : false;
}

/**
 * Handle course resource permissions for Coordenador
 * Coordenadores can manage (update) courses they're assigned to
 */
async function handleCoordenadorCoursePermission(userId, context) {
    if (context.cursoId) {
        return await isAssignedToCourse(userId, context.cursoId);
    }
    return false;
}

/**
 * Handle area resource permissions for Coordenador
 * Coordenadores can manage scientific areas in their departments
 */
async function handleCoordenadorAreaPermission(userId, context) {
    if (context.departmentId) {
        return await isAssignedToDepartment(userId, context.departmentId);
    }

    if (context.areaId) {
        const departmentId = await getDepartmentFromArea(context.areaId);
        if (departmentId) {
            return await isAssignedToDepartment(userId, departmentId);
        }
    }

    return false;
}

/**
 * Handle professor resource permissions for Coordenador
 * Coordenadores can assign professors to UCs in their courses
 */
async function handleCoordenadorProfessorPermission(userId, context) {
    // For assigning professors to UCs, check if coordinator manages the course
    if (context.cursoId) {
        return await isAssignedToCourse(userId, context.cursoId);
    }

    // For professor management, check department assignment
    if (context.departmentId) {
        return await isAssignedToDepartment(userId, context.departmentId);
    }

    if (context.professorId || context.areaId) {
        const areaId = context.areaId || await getProfessorArea(context.professorId);
        if (areaId) {
            const departmentId = await getDepartmentFromArea(areaId);
            if (departmentId) {
                return await isAssignedToDepartment(userId, departmentId);
            }
        }
    }

    return false;
}

/**
 * Handle UC resource permissions for Coordenador
 * Coordenadores can fully manage UCs in their courses
 */
async function handleCoordenadorUcPermission(userId, context) {
    if (context.cursoId) {
        return await isAssignedToCourse(userId, context.cursoId);
    }

    if (context.ucId) {
        const cursoId = await getCourseFromUc(context.ucId);
        if (cursoId) {
            return await isAssignedToCourse(userId, cursoId);
        }
    }

    return false;
}

/**
 * Handle hours resource permissions for Coordenador
 * Coordenadores can validate and manage hours for UCs in their courses
 */
async function handleCoordenadorHoursPermission(userId, context) {
    if (context.ucId) {
        const cursoId = await getCourseFromUc(context.ucId);
        if (cursoId) {
            return await isAssignedToCourse(userId, cursoId);
        }
    }
    return false;
}

/**
 * Handle DSD resource permissions for Coordenador
 * Coordenadores can only READ DSDs (cannot create/update/delete)
 */
async function handleCoordenadorDsdPermission(userId, action) {
    // Coordenadores can only READ DSDs, all other actions (CREATE, UPDATE, DELETE) are forbidden
    return action === ACTIONS.READ;
}

/**
 * Handle academic year resource permissions
 */
async function handleAcademicYearPermission(userId) {
    const departments = await getCoordenadorDepartments(userId);
    const courses = await getCoordenadorCourses(userId);
    return departments.length > 0 || courses.length > 0;
}

/**
 * Get department ID from area ID
 */
async function getDepartmentFromArea(areaId) {
    const area = await pool.query(
        'SELECT id_dep FROM area_cientifica WHERE id_area = $1',
        [areaId]
    );
    return area.rows.length > 0 ? area.rows[0].id_dep : null;
}

/**
 * Check if professor data belongs to the user
 */
async function isProfessorOwnData(userId, professorId) {
    const result = await pool.query(
        'SELECT 1 FROM docente WHERE id_doc = $1 AND id_user = $2',
        [professorId, userId]
    );
    return result.rows.length > 0;
}

/**
 * Get course ID from UC ID
 */
async function getCourseFromUc(ucId) {
    const uc = await pool.query(
        'SELECT id_curso FROM uc WHERE id_uc = $1',
        [ucId]
    );
    return uc.rows.length > 0 ? uc.rows[0].id_curso : null;
}


/**
 * Check if user is assigned to a department
 */
async function isAssignedToDepartment(userId, departmentId) {
    const result = await pool.query(
        'SELECT 1 FROM coordenador_departamento WHERE id_user = $1 AND id_dep = $2',
        [userId, departmentId]
    );
    return result.rows.length > 0;
}

/**
 * Check if user is assigned to a course
 */
async function isAssignedToCourse(userId, cursoId) {
    const result = await pool.query(
        'SELECT 1 FROM coordenador_curso WHERE id_user = $1 AND id_curso = $2',
        [userId, cursoId]
    );
    return result.rows.length > 0;
}

/**
 * Get professor's area
 */
async function getProfessorArea(professorId) {
    const result = await pool.query(
        'SELECT id_area FROM docente WHERE id_doc = $1',
        [professorId]
    );
    return result.rows.length > 0 ? result.rows[0].id_area : null;
}

/**
 * Get all departments a coordinator is assigned to
 */
export async function getCoordenadorDepartments(userId) {
    const result = await pool.query(
        'SELECT id_dep FROM coordenador_departamento WHERE id_user = $1',
        [userId]
    );
    return result.rows.map(row => row.id_dep);
}

/**
 * Get all courses a coordinator is assigned to
 */
export async function getCoordenadorCourses(userId) {
    const result = await pool.query(
        'SELECT id_curso FROM coordenador_curso WHERE id_user = $1',
        [userId]
    );
    return result.rows.map(row => row.id_curso);
}

/**
 * Assign coordinator to department
 */
export async function assignCoordenadorToDepartment(userId, departmentId) {
    await pool.query(
        'INSERT INTO coordenador_departamento (id_user, id_dep) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userId, departmentId]
    );
}

/**
 * Remove coordinator from department
 */
export async function removeCoordenadorFromDepartment(userId, departmentId) {
    await pool.query(
        'DELETE FROM coordenador_departamento WHERE id_user = $1 AND id_dep = $2',
        [userId, departmentId]
    );
}

/**
 * Assign coordinator to course
 */
export async function assignCoordenadorToCourse(userId, cursoId) {
    await pool.query(
        'INSERT INTO coordenador_curso (id_user, id_curso) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userId, cursoId]
    );
}

/**
 * Remove coordinator from course
 */
export async function removeCoordenadorFromCourse(userId, cursoId) {
    await pool.query(
        'DELETE FROM coordenador_curso WHERE id_user = $1 AND id_curso = $2',
        [userId, cursoId]
    );
}
