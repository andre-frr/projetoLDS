import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const result = await pool.query('SELECT * FROM utilizadores');
    res.status(200).json(result.rows);
  } else if (req.method === 'POST') {
    const { nome, email } = req.body;
    await pool.query('INSERT INTO utilizadores (nome, email) VALUES ($1, $2)', [nome, email]);
    res.status(201).json({ message: 'Utilizador criado' });
  } else {
    res.status(405).json({ message: 'Método não permitido' });
  }
}
