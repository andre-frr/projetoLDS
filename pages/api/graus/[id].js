import pool from '@/lib/db.js';

export default async function handler(req, res) {
    const {id} = req.query;

    if (req.method === 'GET') {
        try {
            const result = await pool.query('SELECT * FROM grau WHERE id_grau=$1;', [id]);
            if (!result.rows.length) {
                return res.status(404).json({message: 'Grau inexistente.'});
            }
            return res.status(200).json(result.rows[0]);
        } catch (error) {
            console.error(error);
            return res.status(500).json({message: 'Internal Server Error'});
        }
    } else if (req.method === 'PUT') {
        const {nome} = req.body;
        if (!nome) {
            return res.status(400).json({message: 'Dados mal formatados.'});
        }

        try {
            const result = await pool.query(
                'UPDATE grau SET nome=$1 WHERE id_grau=$2 RETURNING *;',
                [nome, id]
            );
            if (!result.rows.length) {
                return res.status(404).json({message: 'Grau inexistente.'});
            }
            return res.status(200).json(result.rows[0]);
        } catch (error) {
            console.error(error);
            return res.status(500).json({message: 'Internal Server Error'});
        }
    } else if (req.method === 'DELETE') {
        try {
            const result = await pool.query('DELETE FROM grau WHERE id_grau=$1 RETURNING *;', [id]);
            if (!result.rows.length) {
                return res.status(404).json({message: 'Grau inexistente.'});
            }
            return res.status(204).end();
        } catch (error) {
            console.error(error);
            return res.status(500).json({message: 'Internal Server Error'});
        }
    } else {
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
