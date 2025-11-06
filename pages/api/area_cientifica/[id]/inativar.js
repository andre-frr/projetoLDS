import pool from '../../../../lib/db.js';

export default async function handler(req, res) {
    const {id} = req.query;

    if (req.method === 'DELETE') {
        try {
            const areaExists = await pool.query('SELECT * FROM area_cientifica WHERE id_area = $1', [id]);
            if (areaExists.rowCount === 0) {
                return res.status(404).json({message: 'Área científica inexistente.'});
            }

            const result = await pool.query(
                `UPDATE area_cientifica
                 SET ativo= false
                 WHERE id_area = $1 RETURNING *`,
                [id]
            );
            return res.status(200).json(result.rows[0]);
        } catch (error) {
            console.error(error);
            return res.status(500).json({message: 'Internal Server Error'});
        }
    } else {
        res.setHeader('Allow', ['DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
