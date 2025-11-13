import pool from '@/lib/db.js';

export default async function handler(req, res) {
    const {id_uc, tipo} = req.query;

    if (req.method === 'GET') {
        try {
            const result = await pool.query('SELECT * FROM uc_horas_contacto WHERE id_uc=$1 AND tipo=$2;', [id_uc, tipo]);
            if (!result.rows.length) {
                return res.status(404).json({message: 'Horas de contacto inexistentes.'});
            }
            return res.status(200).json(result.rows[0]);
        } catch (error) {
            console.error(error);
            return res.status(500).json({message: 'Internal Server Error'});
        }
    } else if (req.method === 'PUT') {
        const {horas} = req.body;

        if (horas == null) {
            return res.status(400).json({message: 'Dados mal formatados.'});
        }

        try {
            const result = await pool.query(
                'UPDATE uc_horas_contacto SET horas=$1 WHERE id_uc=$2 AND tipo=$3 RETURNING *;',
                [horas, id_uc, tipo]
            );

            if (!result.rows.length) {
                return res.status(404).json({message: 'Horas de contacto inexistentes.'});
            }

            return res.status(200).json(result.rows[0]);
        } catch (error) {
            console.error(error);
            return res.status(500).json({message: 'Internal Server Error'});
        }
    } else if (req.method === 'DELETE') {
        try {
            const result = await pool.query('DELETE FROM uc_horas_contacto WHERE id_uc=$1 AND tipo=$2 RETURNING *;', [id_uc, tipo]);
            if (!result.rows.length) {
                return res.status(404).json({message: 'Horas de contacto inexistentes.'});
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
