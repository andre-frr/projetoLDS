import pool from '@/lib/db.js';

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            const result = await pool.query('SELECT * FROM historico_cv_docente;');
            return res.status(200).json(result.rows);
        } catch (error) {
            console.error(error);
            return res.status(500).json({message: 'Internal Server Error'});
        }
    } else if (req.method === 'POST') {
        const {id_doc, data, link_cv} = req.body;

        if (!id_doc || !data || !link_cv) {
            return res.status(400).json({message: 'Dados mal formatados.'});
        }

        try {
            const docenteExists = await pool.query('SELECT 1 FROM docente WHERE id_doc = $1', [id_doc]);
            if (docenteExists.rowCount === 0) {
                return res.status(404).json({message: 'Docente inexistente.'});
            }

            const result = await pool.query(
                'INSERT INTO historico_cv_docente (id_doc,data,link_cv) VALUES($1,$2,$3) RETURNING *;',
                [id_doc, data, link_cv]
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
