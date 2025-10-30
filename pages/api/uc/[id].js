import pool from '../../../lib/db.js';

export default async function handler(req, res) {
    const {id} = req.query;
    if (req.method === 'GET') {
        const result = await pool.query('SELECT * FROM uc WHERE id_uc=$1', [id]);
        if (!result.rows.length) return res.status(404).json({error: 'Not found'});
        return res.status(200).json(result.rows[0]);
    } else if (req.method === 'PUT') {
        const {nome, id_curso, id_area, ano_curso, sem_curso, ects, ativo} = req.body;
        const result = await pool.query(
            `UPDATE uc
             SET nome=$1,
                 id_curso=$2,
                 id_area=$3,
                 ano_curso=$4,
                 sem_curso=$5,
                 ects=$6,
                 ativo=$7
             WHERE id_uc = $8 RETURNING *`,
            [nome, id_curso, id_area, ano_curso, sem_curso, ects, ativo, id]
        );
        return res.status(200).json(result.rows[0]);
    } else if (req.method === 'DELETE') {
        await pool.query('DELETE FROM uc WHERE id_uc=$1', [id]);
        return res.status(204).end();
    } else {
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
