import GrpcClient from '@/lib/grpc-client.js';
import {applyCors} from '@/lib/cors.js';
import {ACTIONS, requirePermission, RESOURCES} from '@/lib/authorize.js';

function handleError(error, res, notFoundMessage = 'Histórico CV inexistente.') {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
        message: statusCode === 404 ? notFoundMessage : error.message
    });
}

async function handleGet(id, req, res) {
    try {
        const result = await GrpcClient.getById('historico_cv_docente', id);

        // If Docente, verify they can only access their own CV
        if (req.user.role === 'Docente') {
            const pool = (await import('@/lib/db.js')).default;
            const docenteResult = await pool.query(
                'SELECT id_user FROM docente WHERE id_doc = $1',
                [result.id_doc]
            );

            if (docenteResult.rows.length === 0 || docenteResult.rows[0].id_user !== req.user.id) {
                return res.status(403).json({message: 'You can only access your own CV history'});
            }
        }

        return res.status(200).json(result);
    } catch (error) {
        return handleError(error, res);
    }
}

async function validateDocente(id_doc, res) {
    if (!id_doc) return null;

    try {
        await GrpcClient.getById('docente', id_doc);
        return null;
    } catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).json({message: 'Docente inexistente.'});
        }
        throw error;
    }
}

async function handlePut(id, req, res) {
    const {id_doc, data, link_cv} = req.body;

    try {
        const current = await GrpcClient.getById('historico_cv_docente', id);

        // If Docente, verify they can only update their own CV
        if (req.user.role === 'Docente') {
            const pool = (await import('@/lib/db.js')).default;
            const docenteResult = await pool.query(
                'SELECT id_user FROM docente WHERE id_doc = $1',
                [current.id_doc]
            );

            if (docenteResult.rows.length === 0 || docenteResult.rows[0].id_user !== req.user.id) {
                return res.status(403).json({message: 'You can only update your own CV history'});
            }
        }

        const docenteError = await validateDocente(id_doc, res);
        if (docenteError) return docenteError;

        const result = await GrpcClient.update('historico_cv_docente', id, {
            id_doc,
            data,
            link_cv
        });
        return res.status(200).json(result);
    } catch (error) {
        return handleError(error, res);
    }
}

async function handleDelete(id, req, res) {
    try {
        const current = await GrpcClient.getById('historico_cv_docente', id);

        // If Docente, verify they can only delete their own CV
        if (req.user.role === 'Docente') {
            const pool = (await import('@/lib/db.js')).default;
            const docenteResult = await pool.query(
                'SELECT id_user FROM docente WHERE id_doc = $1',
                [current.id_doc]
            );

            if (docenteResult.rows.length === 0 || docenteResult.rows[0].id_user !== req.user.id) {
                return res.status(403).json({message: 'You can only delete your own CV history'});
            }
        }

        await GrpcClient.delete('historico_cv_docente', id);
        return res.status(204).end();
    } catch (error) {
        return handleError(error, res);
    }
}

async function handler(req, res) {
    const {id} = req.query;

    // Context extractor for CV history permissions
    const cvContext = async () => {
        try {
            const cv = await GrpcClient.getById('historico_cv_docente', id);
            return {
                professorId: cv.id_doc
            };
        } catch {
            // If CV not found, return empty context
            return {};
        }
    };

    switch (req.method) {
        case 'GET':
            return requirePermission(ACTIONS.READ, RESOURCES.CV_HISTORY, cvContext)(
                handleGet.bind(null, id)
            )(req, res);
        case 'PUT':
            return requirePermission(ACTIONS.UPDATE, RESOURCES.CV_HISTORY, cvContext)(
                handlePut.bind(null, id)
            )(req, res);
        case 'DELETE':
            return requirePermission(ACTIONS.DELETE, RESOURCES.CV_HISTORY, cvContext)(
                handleDelete.bind(null, id)
            )(req, res);
        default:
            res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

export default async function handlerWithCors(req, res) {
    await applyCors(req, res);
    return handler(req, res);
}
