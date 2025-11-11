import pool from '@/lib/db.js';

export default async function handler(req, res) {
    const {id} = req.query;
    if (req.method === 'GET') {
        const result = await pool.query('SELECT * FROM grau WHERE id_grau=$1;', [id]);
        if (!result.rows.length) return res.status(404).json({error: 'Not found'});
        return res.status(200).json(result.rows[0]);
    } else if (req.method === 'PUT') {
        const {nome} = req.body;
        const result = await pool.query(
            'UPDATE grau SET nome=$1 WHERE id_grau=$2 RETURNING *;',
            [nome, id]
        );
        return res.status(200).json(result.rows[0]);
    } else if (req.method === 'DELETE') {
        await pool.query('DELETE FROM grau WHERE id_grau=$1;', [id]);
        return res.status(204).end();
    } else {
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
