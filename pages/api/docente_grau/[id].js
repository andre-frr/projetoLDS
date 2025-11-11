import pool from '@/lib/db.js';

export default async function handler(req, res) {
    const {id} = req.query;
    if (req.method === 'GET') {
        const result = await pool.query('SELECT * FROM docente_grau WHERE id_dg=$1;', [id]);
        if (!result.rows.length) return res.status(404).json({error: 'Not found'});
        return res.status(200).json(result.rows[0]);
    } else if (req.method === 'PUT') {
        const {id_doc, id_grau, grau_nome, data, link_certif} = req.body;
        const result = await pool.query(
            'UPDATE docente_grau SET id_doc=$1,id_grau=$2,grau_nome=$3,data=$4,link_certif=$5 WHERE id_dg=$6 RETURNING *;',
            [id_doc, id_grau, grau_nome, data, link_certif, id]
        );
        return res.status(200).json(result.rows[0]);
    } else if (req.method === 'DELETE') {
        await pool.query('DELETE FROM docente_grau WHERE id_dg=$1;', [id]);
        return res.status(204).end();
    } else {
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
