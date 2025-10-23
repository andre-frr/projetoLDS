import pool from '../../../lib/db.js';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    const result = await pool.query('SELECT * FROM curso WHERE id_curso=$1', [id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json(result.rows[0]);
  } else if (req.method === 'PUT') {
    const { nome, sigla, tipo, ativo } = req.body;
    const result = await pool.query(
      'UPDATE curso SET nome=$1, sigla=$2, tipo=$3, ativo=$4 WHERE id_curso=$5 RETURNING *',
      [nome, sigla, tipo, ativo, id]
    );
    return res.status(200).json(result.rows[0]);
  } else if (req.method === 'DELETE') {
    await pool.query('DELETE FROM curso WHERE id_curso=$1', [id]);
    return res.status(204).end();
  } else {
    res.setHeader('Allow', ['GET','PUT','DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
