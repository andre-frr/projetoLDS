import pool from './db.js';

/**
 * Centralized Permission System
 *
 * Role Hierarchy:
 * - Administrador: Full access to everything
 * - Coordenador: Manage departments/courses they're assigned to
 * - Docente: Read-only access
 * - Convidado: Read-only access
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

    // Docente and Convidado have read-only access
    if (user.role === 'Docente' || user.role === 'Convidado') {
        return action === ACTIONS.READ;
    }

    // Coordenador permissions
    if (user.role === 'Coordenador') {
        return await checkCoordenadorPermission(user.id, action, resource, context);
    }

    return false;
}

/**
 * Check Coordenador permissions based on their assignments
 */
async function checkCoordenadorPermission(userId, action, resource, context) {
    // Coordenadores can read everything
    if (action === ACTIONS.READ) {
        return true;
    }

    // Route to specific resource handlers
    const handlers = {
        [RESOURCES.USERS]: () => false, // Only admins can manage users
        [RESOURCES.DEPARTMENTS]: () => checkDepartmentBasedPermission(userId, context),
        [RESOURCES.GRADES]: () => checkDepartmentBasedPermission(userId, context),
        [RESOURCES.CV_HISTORY]: () => checkDepartmentBasedPermission(userId, context),
        [RESOURCES.COURSES]: () => handleCoursePermission(userId, context),
        [RESOURCES.AREAS]: () => handleAreaPermission(userId, context),
        [RESOURCES.PROFESSORS]: () => handleProfessorPermission(userId, context),
        [RESOURCES.UCS]: () => handleUcPermission(userId, context),
        [RESOURCES.HOURS]: () => handleHoursPermission(userId, context),
        [RESOURCES.ACADEMIC_YEARS]: () => handleAcademicYearPermission(userId),
    };

    const handler = handlers[resource];
    return handler ? handler() : false;
}

/**
 * Handle course resource permissions
 */
async function handleCoursePermission(userId, context) {
    if (context.cursoId) {
        return await isAssignedToCourse(userId, context.cursoId);
    }
    return false;
}

/**
 * Handle area resource permissions
 */
async function handleAreaPermission(userId, context) {
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
 * Handle professor resource permissions
 */
async function handleProfessorPermission(userId, context) {
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
 * Handle UC resource permissions
 */
async function handleUcPermission(userId, context) {
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
 * Handle hours resource permissions
 */
async function handleHoursPermission(userId, context) {
    if (context.ucId) {
        const cursoId = await getCourseFromUc(context.ucId);
        if (cursoId) {
            return await isAssignedToCourse(userId, cursoId);
        }
    }
    return false;
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
 * Check if coordinator has permission based on department assignment
 * Used for departments, grades, and CV history which all require department-level access
 */
async function checkDepartmentBasedPermission(userId, context) {
    if (context.departmentId) {
        return await isAssignedToDepartment(userId, context.departmentId);
    }
    return false;
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
