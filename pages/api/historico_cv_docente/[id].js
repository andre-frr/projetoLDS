import pool from '@/lib/db.js';

export default async function handler(req, res) {
    const {id} = req.query;

    if (req.method === 'GET') {
        try {
            const result = await pool.query('SELECT * FROM historico_cv_docente WHERE id_hcd=$1;', [id]);
            if (!result.rows.length) {
                return res.status(404).json({message: 'Histórico CV inexistente.'});
            }
            return res.status(200).json(result.rows[0]);
        } catch (error) {
            console.error(error);
            return res.status(500).json({message: 'Internal Server Error'});
        }
    } else if (req.method === 'PUT') {
        const {id_doc, data, link_cv} = req.body;

        try {
            if (id_doc) {
                const docenteExists = await pool.query('SELECT 1 FROM docente WHERE id_doc = $1', [id_doc]);
                if (docenteExists.rowCount === 0) {
                    return res.status(404).json({message: 'Docente inexistente.'});
                }
            }

            const result = await pool.query(
                'UPDATE historico_cv_docente SET id_doc=$1,data=$2,link_cv=$3 WHERE id_hcd=$4 RETURNING *;',
                [id_doc, data, link_cv, id]
            );

            if (!result.rows.length) {
                return res.status(404).json({message: 'Histórico CV inexistente.'});
            }

            return res.status(200).json(result.rows[0]);
        } catch (error) {
            console.error(error);
            return res.status(500).json({message: 'Internal Server Error'});
        }
    } else if (req.method === 'DELETE') {
        try {
            const result = await pool.query('DELETE FROM historico_cv_docente WHERE id_hcd=$1 RETURNING *;', [id]);
            if (!result.rows.length) {
                return res.status(404).json({message: 'Histórico CV inexistente.'});
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
