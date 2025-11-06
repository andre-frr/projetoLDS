import pool from '../../../../lib/db.js';

export default async function handler(req, res) {
    const {id} = req.query;

    if (req.method === 'DELETE') {
        try {
            const cursoExists = await pool.query('SELECT * FROM curso WHERE id_curso = $1', [id]);
            if (cursoExists.rowCount === 0) {
                return res.status(404).json({message: 'Curso inexistente.'});
            }

            const result = await pool.query(
                `UPDATE curso
                 SET ativo= false
                 WHERE id_curso = $1 RETURNING *`,
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
