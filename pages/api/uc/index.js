import pool from '../../../lib/db.js';

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            const result = await pool.query(`
                SELECT id_uc,
                       nome,
                       ano_curso,
                       ects,
                       (SELECT SUM(horas) FROM uc_horas_contacto WHERE id_uc = uc.id_uc) as horas_contacto_total
                FROM uc
            `);
            return res.status(200).json(result.rows);
        } catch (error) {
            console.error(error);
            return res.status(500).json({message: 'Internal Server Error'});
        }
    } else {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
