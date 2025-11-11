import pool from '@/lib/db.js';

export default async function handler(req, res) {
    const {id_uc, tipo} = req.query;
    if (req.method === 'GET') {
        const result = await pool.query('SELECT * FROM uc_horas_contacto WHERE id_uc=$1 AND tipo=$2;', [id_uc, tipo]);
        if (!result.rows.length) return res.status(404).json({error: 'Not found'});
        return res.status(200).json(result.rows[0]);
    } else if (req.method === 'PUT') {
        const {horas} = req.body;
        const result = await pool.query(
            'UPDATE uc_horas_contacto SET horas=$1 WHERE id_uc=$2 AND tipo=$3 RETURNING *;',
            [horas, id_uc, tipo]
        );
        return res.status(200).json(result.rows[0]);
    } else if (req.method === 'DELETE') {
        await pool.query('DELETE FROM uc_horas_contacto WHERE id_uc=$1 AND tipo=$2;', [id_uc, tipo]);
        return res.status(204).end();
    } else {
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
