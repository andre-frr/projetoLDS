import pool from '../../../lib/db.js';

export default async function handler(req, res) {
    if (req.method === 'GET') {
        const result = await pool.query('SELECT * FROM historico_cv_docente;');
        return res.status(200).json(result.rows);
    } else if (req.method === 'POST') {
        const {id_doc, data, link_cv} = req.body;
        if (!id_doc || !data || !link_cv) return res.status(400).json({error: 'Missing required fields'});
        const result = await pool.query(
            'INSERT INTO historico_cv_docente (id_doc,data,link_cv) VALUES($1,$2,$3) RETURNING *;',
            [id_doc, data, link_cv]
        );
        return res.status(201).json(result.rows[0]);
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
