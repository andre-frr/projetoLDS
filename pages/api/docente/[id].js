import pool from '@/lib/db.js';

export default async function handler(req, res) {
    const {id} = req.query;

    if (req.method === 'GET') {
        try {
            const result = await pool.query('SELECT * FROM docente WHERE id_doc=$1', [id]);
            if (result.rowCount === 0) {
                return res.status(404).json({message: 'Docente inexistente.'});
            }
            return res.status(200).json(result.rows[0]);
        } catch (error) {
            console.error(error);
            return res.status(500).json({message: 'Internal Server Error'});
        }
    } else if (req.method === 'PUT') {
        const {nome, email, id_area, convidado} = req.body;

        if (!nome || !email || !id_area) {
            return res.status(400).json({message: 'Dados mal formatados.'});
        }

        try {
            const docenteExists = await pool.query('SELECT * FROM docente WHERE id_doc = $1', [id]);
            if (docenteExists.rowCount === 0) {
                return res.status(404).json({message: 'Docente inexistente.'});
            }

            const emailExists = await pool.query('SELECT 1 FROM docente WHERE email = $1 AND id_doc != $2', [email, id]);
            if (emailExists.rowCount > 0) {
                return res.status(409).json({message: 'Email duplicado.'});
            }

            const areaExists = await pool.query('SELECT 1 FROM area_cientifica WHERE id_area = $1', [id_area]);
            if (areaExists.rowCount === 0) {
                return res.status(404).json({message: 'Área científica inexistente.'});
            }

            const result = await pool.query(
                `UPDATE docente
                 SET nome=$1,
                     email=$2,
                     id_area=$3,
                     convidado=$4
                 WHERE id_doc = $5 RETURNING *`,
                [nome, email, id_area, convidado, id]
            );
            return res.status(200).json(result.rows[0]);
        } catch (error) {
            console.error(error);
            return res.status(500).json({message: 'Internal Server Error'});
        }
    } else if (req.method === 'DELETE') {
        try {
            const result = await pool.query('DELETE FROM docente WHERE id_doc=$1', [id]);
            if (result.rowCount === 0) {
                return res.status(404).json({message: 'Docente inexistente.'});
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
