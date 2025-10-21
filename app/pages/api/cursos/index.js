import pool from '../../../lib/db.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const result = await pool.query('SELECT * FROM curso');
    return res.status(200).json(result.rows);
  } else if (req.method === 'POST') {
    const { nome, sigla, tipo, ativo } = req.body;
    if (!nome || !sigla || !tipo) return res.status(400).json({ error: 'Missing fields' });
    const result = await pool.query(
      'INSERT INTO curso (nome, sigla, tipo, ativo) VALUES ($1,$2,$3,$4) RETURNING *',
      [nome, sigla, tipo, ativo ?? true]
    );
    return res.status(201).json(result.rows[0]);
  } else {
    res.setHeader('Allow', ['GET','POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
