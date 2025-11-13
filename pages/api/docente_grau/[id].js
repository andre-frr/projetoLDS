import pool from '@/lib/db.js';

export default async function handler(req, res) {
    const {id} = req.query;

    if (req.method === 'GET') {
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
    } else if (req.method === 'PUT') {
        const {id_doc, id_grau, grau_nome, data, link_certif} = req.body;

        try {
            if (id_doc) {
                const docenteExists = await pool.query('SELECT 1 FROM docente WHERE id_doc = $1', [id_doc]);
                if (docenteExists.rowCount === 0) {
                    return res.status(404).json({message: 'Docente inexistente.'});
                }
            }

            if (id_grau) {
                const grauExists = await pool.query('SELECT 1 FROM grau WHERE id_grau = $1', [id_grau]);
                if (grauExists.rowCount === 0) {
                    return res.status(404).json({message: 'Grau inexistente.'});
                }
            }

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
    } else if (req.method === 'DELETE') {
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
    } else {
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
