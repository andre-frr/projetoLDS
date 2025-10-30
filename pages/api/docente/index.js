import pool from '../../../lib/db.js';

export default async function handler(req, res) {
    if (req.method === 'GET') {
        const result = await pool.query('SELECT * FROM docente');
        return res.status(200).json(result.rows);
    } else if (req.method === 'POST') {
        const {nome, email, id_area, ativo, convidado} = req.body;
        if (!nome || !email || !id_area) return res.status(400).json({error: 'Missing fields'});
        const result = await pool.query(
            `INSERT INTO docente (nome, email, id_area, ativo, convidado)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [nome, email, id_area, ativo ?? true, convidado ?? false]
        );
        return res.status(201).json(result.rows[0]);
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
