import pool from '../../../lib/db.js';

export default async function handler(req, res) {
    const {id} = req.query;

    if (req.method === 'GET') {
        const result = await pool.query('SELECT * FROM docente WHERE id_doc=$1', [id]);
        if (!result.rows.length) return res.status(404).json({error: 'Not found'});
        return res.status(200).json(result.rows[0]);
    } else if (req.method === 'PUT') {
        const {nome, email, id_area, ativo, convidado} = req.body;
        const result = await pool.query(
            `UPDATE docente
             SET nome=$1,
                 email=$2,
                 id_area=$3,
                 ativo=$4,
                 convidado=$5
             WHERE id_doc = $6 RETURNING *`,
            [nome, email, id_area, ativo, convidado, id]
        );
        return res.status(200).json(result.rows[0]);
    } else if (req.method === 'DELETE') {
        await pool.query('DELETE FROM docente WHERE id_doc=$1', [id]);
        return res.status(204).end();
    } else {
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
