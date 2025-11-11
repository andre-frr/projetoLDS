import pool from '@/lib/db.js';

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            const result = await pool.query('SELECT id_curso, nome, sigla, tipo, ativo FROM curso');
            return res.status(200).json(result.rows);
        } catch (error) {
            console.error(error);
            return res.status(500).json({message: 'Internal Server Error'});
        }
    } else if (req.method === 'POST') {
        const {nome, sigla, tipo} = req.body;
        if (!nome || !sigla || !tipo) {
            return res.status(400).json({message: 'Dados mal formatados.'});
        }

        try {
            const result = await pool.query(
                'INSERT INTO curso (nome, sigla, tipo, ativo) VALUES ($1, $2, $3, TRUE) RETURNING *',
                [nome, sigla, tipo]
            );
            return res.status(201).json(result.rows[0]);
        } catch (error) {
            console.error(error);
            return res.status(500).json({message: 'Internal Server Error'});
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
