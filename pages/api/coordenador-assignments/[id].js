import GrpcClient from '@/lib/grpc-client.js';
import {applyCors} from '@/lib/cors.js';
import {ACTIONS, requirePermission, RESOURCES} from '@/lib/authorize.js';
import {
    assignCoordenadorToCourse,
    assignCoordenadorToDepartment,
    getCoordenadorCourses,
    getCoordenadorDepartments,
    removeCoordenadorFromCourse,
    removeCoordenadorFromDepartment
} from '@/lib/permissions.js';

/**
 * GET /api/coordenador-assignments/[id]
 * Get all assignments for a coordinator
 */
async function handleGet(id, req, res) {
    try {
        const user = await GrpcClient.getById('users', id);

        // Allow viewing for Coordenador and Docente (who might have assignments or will get them)
        if (user.role !== 'Coordenador' && user.role !== 'Docente') {
            return res.status(400).json({message: 'User is not a coordinator or teacher'});
        }

        const departments = await getCoordenadorDepartments(id);
        const courses = await getCoordenadorCourses(id);

        // Get full department details
        const departmentDetails = [];
        for (const deptId of departments) {
            try {
                const dept = await GrpcClient.getById('departamento', deptId);
                departmentDetails.push({
                    id_dep: dept.id_dep,
                    nome: dept.nome,
                    sigla: dept.sigla
                });
            } catch (error) {
                console.error(`Error fetching department ${deptId}:`, error);
            }
        }

        // Get full course details
        const courseDetails = [];
        for (const courseId of courses) {
            try {
                const course = await GrpcClient.getById('curso', courseId);
                courseDetails.push({
                    id_curso: course.id_curso,
                    nome: course.nome,
                    sigla: course.sigla
                });
            } catch (error) {
                console.error(`Error fetching course ${courseId}:`, error);
            }
        }

        return res.status(200).json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            },
            departments: departmentDetails,
            courses: courseDetails
        });
    } catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).json({message: 'User not found'});
        }
        console.error(error);
        return res.status(500).json({message: 'Internal server error'});
    }
}

/**
 * Validate user can be assigned as coordinator
 * Throws with statusCode 404 and isUserError flag if user not found
 */
async function validateUserForAssignment(id) {
    let user;
    try {
        user = await GrpcClient.getById('users', id);
    } catch (error) {
        if (error.statusCode === 404) {
            const userError = new Error('User not found');
            userError.statusCode = 404;
            userError.isUserError = true;
            throw userError;
        }
        throw error;
    }

    if (user.role !== 'Coordenador' && user.role !== 'Docente') {
        return {valid: false, error: 'User must be a teacher (Docente) or coordinator'};
    }

    // Check if user is a guest teacher (convidado = true)
    if (user.role === 'Docente') {
        try {
            const docentes = await GrpcClient.getAll('docente', {
                filters: {id_user: id, ativo: true}
            });

            if (docentes.length > 0 && docentes[0].convidado === true) {
                return {valid: false, error: 'Guest teachers (convidado) cannot be assigned as coordinators'};
            }
        } catch (error) {
            console.error('Error checking docente convidado status:', error);
        }
    }

    return {valid: true};
}

/**
 * Assign coordinator to a resource
 */
async function assignCoordinator(id, type, resourceId) {
    if (type === 'department') {
        await GrpcClient.getById('departamento', resourceId);
        await assignCoordenadorToDepartment(id, resourceId);
        return {message: 'Coordinator assigned to department successfully'};
    }

    if (type === 'course') {
        await GrpcClient.getById('curso', resourceId);
        await assignCoordenadorToCourse(id, resourceId);
        return {message: 'Coordinator assigned to course successfully'};
    }

    return null;
}

/**
 * Get resource type name for error messages
 */
function getResourceTypeName(type) {
    const resourceTypes = {department: 'Department', course: 'Course'};
    return resourceTypes[type] || 'User';
}

/**
 * POST /api/coordenador-assignments/[id]
 * Assign coordinator to department or course
 */
async function handlePost(id, req, res) {
    const {type, resourceId} = req.body;

    if (!type || !resourceId) {
        return res.status(400).json({
            message: 'Missing required fields: type (department|course), resourceId'
        });
    }

    try {
        const validation = await validateUserForAssignment(id);
        if (!validation.valid) {
            return res.status(400).json({message: validation.error});
        }

        const result = await assignCoordinator(id, type, resourceId);
        if (!result) {
            return res.status(400).json({
                message: 'Invalid type. Must be "department" or "course"'
            });
        }

        return res.status(201).json(result);
    } catch (error) {
        if (error.statusCode === 404) {
            const resourceType = error.isUserError ? 'User' : getResourceTypeName(type);
            return res.status(404).json({message: `${resourceType} not found`});
        }
        console.error(error);
        return res.status(500).json({message: 'Internal server error'});
    }
}

/**
 * DELETE /api/coordenador-assignments/[id]
 * Remove coordinator assignment
 */
async function handleDelete(id, req, res) {
    const {type, resourceId} = req.body;

    if (!type || !resourceId) {
        return res.status(400).json({
            message: 'Missing required fields: type (department|course), resourceId'
        });
    }

    try {
        if (type === 'department') {
            await removeCoordenadorFromDepartment(id, resourceId);
            return res.status(200).json({
                message: 'Coordinator removed from department successfully'
            });
        } else if (type === 'course') {
            await removeCoordenadorFromCourse(id, resourceId);
            return res.status(200).json({
                message: 'Coordinator removed from course successfully'
            });
        } else {
            return res.status(400).json({
                message: 'Invalid type. Must be "department" or "course"'
            });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({message: 'Internal server error'});
    }
}

async function handler(req, res) {
    const {id} = req.query;

    switch (req.method) {
        case 'GET':
            return requirePermission(ACTIONS.READ, RESOURCES.USERS)(
                handleGet.bind(null, id)
            )(req, res);
        case 'POST':
            return requirePermission(ACTIONS.UPDATE, RESOURCES.USERS)(
                handlePost.bind(null, id)
            )(req, res);
        case 'DELETE':
            return requirePermission(ACTIONS.UPDATE, RESOURCES.USERS)(
                handleDelete.bind(null, id)
            )(req, res);
        default:
            res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

export default async function handlerWithCors(req, res) {
    await applyCors(req, res);
    return handler(req, res);
}
