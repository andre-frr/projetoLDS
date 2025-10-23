import pool from '../../../lib/db';

export default async function handler(req, res) {
    switch (req.method) {
        case 'GET':
            try {
                const { rows } = await pool.query('SELECT * FROM area_cientifica');
                res.status(200).json(rows);
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
            break;

        case 'POST':
            try {
                const { nome, sigla, id_dep, ativo } = req.body;
                const { rows } = await pool.query(
                    'INSERT INTO area_cientifica (nome, sigla, id_dep, ativo) VALUES ($1, $2, $3, $4) RETURNING *',
                    [nome, sigla, id_dep, ativo ?? true]
                );
                res.status(201).json(rows[0]);
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
            break;

        default:
            res.status(405).json({ error: 'Method not allowed' });
    }
}
