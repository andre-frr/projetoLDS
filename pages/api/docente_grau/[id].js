import pool from '@/lib/db.js';
import {applyCors} from '@/lib/cors.js';
import {ACTIONS, requirePermission, RESOURCES} from '@/lib/authorize.js';

async function handleGet(id, req, res) {
    try {
        const result = await pool.query('SELECT * FROM docente_grau WHERE id_dg=$1;', [id]);
        if (!result.rows.length) {
            return res.status(404).json({message: 'Grau de docente inexistente.'});
        }
        return res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({message: 'Internal Server Error'});
    }
}

async function validateDocente(id_doc, res) {
    if (!id_doc) return null;

    const docenteExists = await pool.query('SELECT 1 FROM docente WHERE id_doc = $1', [id_doc]);
    if (docenteExists.rowCount === 0) {
        return res.status(404).json({message: 'Docente inexistente.'});
    }
    return null;
}

async function validateGrau(id_grau, res) {
    if (!id_grau) return null;

    const grauExists = await pool.query('SELECT 1 FROM grau WHERE id_grau = $1', [id_grau]);
    if (grauExists.rowCount === 0) {
        return res.status(404).json({message: 'Grau inexistente.'});
    }
    return null;
}

async function handlePut(id, req, res) {
    const {id_doc, id_grau, grau_nome, data, link_certif} = req.body;

    try {
        const docenteError = await validateDocente(id_doc, res);
        if (docenteError) return docenteError;

        const grauError = await validateGrau(id_grau, res);
        if (grauError) return grauError;

        const result = await pool.query(
            'UPDATE docente_grau SET id_doc=$1,id_grau=$2,grau_nome=$3,data=$4,link_certif=$5 WHERE id_dg=$6 RETURNING *;',
            [id_doc, id_grau, grau_nome, data, link_certif, id]
        );

        if (!result.rows.length) {
            return res.status(404).json({message: 'Grau de docente inexistente.'});
        }

        return res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({message: 'Internal Server Error'});
    }
}

async function handleDelete(id, req, res) {
    try {
        const result = await pool.query('DELETE FROM docente_grau WHERE id_dg=$1 RETURNING *;', [id]);
        if (!result.rows.length) {
            return res.status(404).json({message: 'Grau de docente inexistente.'});
        }
        return res.status(204).end();
    } catch (error) {
        console.error(error);
        return res.status(500).json({message: 'Internal Server Error'});
    }
}

async function handler(req, res) {
    const {id} = req.query;

    const gradeContext = (req) => ({
        professorId: req.body?.id_doc
    });

    switch (req.method) {
        case 'GET':
            return requirePermission(ACTIONS.READ, RESOURCES.GRADES, gradeContext)(
                handleGet.bind(null, id)
            )(req, res);
        case 'PUT':
            return requirePermission(ACTIONS.UPDATE, RESOURCES.GRADES, gradeContext)(
                handlePut.bind(null, id)
            )(req, res);
        case 'DELETE':
            return requirePermission(ACTIONS.DELETE, RESOURCES.GRADES, gradeContext)(
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
