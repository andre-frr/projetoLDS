import pool from '../../../lib/db.js';

export default async function handler(req, res) {
    if (req.method === 'GET') {
        const result = await pool.query('SELECT * FROM uc');
        return res.status(200).json(result.rows);
    } else if (req.method === 'POST') {
        const {nome, id_curso, id_area, ano_curso, sem_curso, ects, ativo} = req.body;
        if (!nome || !id_curso || !id_area || !ano_curso || !sem_curso || !ects) return res.status(400).json({error: 'Missing fields'});
        const result = await pool.query(
            `INSERT INTO uc (nome, id_curso, id_area, ano_curso, sem_curso, ects, ativo)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [nome, id_curso, id_area, ano_curso, sem_curso, ects, ativo ?? true]
        );
        return res.status(201).json(result.rows[0]);
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
