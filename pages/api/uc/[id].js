import pool from '../../../lib/db.js';

export default async function handler(req, res) {
    const {id} = req.query;
    if (req.method === 'GET') {
        try {
            const ucResult = await pool.query('SELECT * FROM uc WHERE id_uc=$1', [id]);
            if (ucResult.rowCount === 0) {
                return res.status(404).json({message: 'UC inexistente.'});
            }

            const horasResult = await pool.query('SELECT tipo, horas FROM uc_horas_contacto WHERE id_uc=$1', [id]);

            const ucDetails = {
                ...ucResult.rows[0],
                horas_contacto: horasResult.rows
            };

            return res.status(200).json(ucDetails);
        } catch (error) {
            console.error(error);
            return res.status(500).json({message: 'Internal Server Error'});
        }
    } else {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
