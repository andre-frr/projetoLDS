import pool from '@/lib/db.js';
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
        const user = await pool.query(
            'SELECT id, email, role FROM users WHERE id = $1',
            [id]
        );

        if (user.rows.length === 0) {
            return res.status(404).json({message: 'User not found'});
        }

        if (user.rows[0].role !== 'Coordenador') {
            return res.status(400).json({message: 'User is not a coordinator'});
        }

        const departments = await getCoordenadorDepartments(id);
        const courses = await getCoordenadorCourses(id);

        // Get full department details
        const departmentDetails = departments.length > 0
            ? await pool.query(
                'SELECT id_dep, nome, sigla FROM departamento WHERE id_dep = ANY($1)',
                [departments]
            )
            : {rows: []};

        // Get full course details
        const courseDetails = courses.length > 0
            ? await pool.query(
                'SELECT id_curso, nome, sigla FROM curso WHERE id_curso = ANY($1)',
                [courses]
            )
            : {rows: []};

        return res.status(200).json({
            user: user.rows[0],
            departments: departmentDetails.rows,
            courses: courseDetails.rows
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({message: 'Internal server error'});
    }
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
        // Verify user exists and is coordinator
        const user = await pool.query(
            'SELECT role FROM users WHERE id = $1',
            [id]
        );

        if (user.rows.length === 0) {
            return res.status(404).json({message: 'User not found'});
        }

        if (user.rows[0].role !== 'Coordenador') {
            return res.status(400).json({message: 'User is not a coordinator'});
        }

        if (type === 'department') {
            // Verify department exists
            const dept = await pool.query(
                'SELECT 1 FROM departamento WHERE id_dep = $1',
                [resourceId]
            );
            if (dept.rows.length === 0) {
                return res.status(404).json({message: 'Department not found'});
            }

            await assignCoordenadorToDepartment(id, resourceId);
            return res.status(201).json({
                message: 'Coordinator assigned to department successfully'
            });
        } else if (type === 'course') {
            // Verify course exists
            const course = await pool.query(
                'SELECT 1 FROM curso WHERE id_curso = $1',
                [resourceId]
            );
            if (course.rows.length === 0) {
                return res.status(404).json({message: 'Course not found'});
            }

            await assignCoordenadorToCourse(id, resourceId);
            return res.status(201).json({
                message: 'Coordinator assigned to course successfully'
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
