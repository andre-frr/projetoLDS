import pool from '@/lib/db.js';

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            const result = await pool.query('SELECT * FROM docente_grau;');
            return res.status(200).json(result.rows);
        } catch (error) {
            console.error(error);
            return res.status(500).json({message: 'Internal Server Error'});
        }
    } else if (req.method === 'POST') {
        const {id_doc, id_grau, grau_nome, data, link_certif} = req.body;

        if (!id_doc || (!id_grau && !grau_nome) || !data) {
            return res.status(400).json({message: 'Dados mal formatados.'});
        }

        try {
            const docenteExists = await pool.query('SELECT 1 FROM docente WHERE id_doc = $1', [id_doc]);
            if (docenteExists.rowCount === 0) {
                return res.status(404).json({message: 'Docente inexistente.'});
            }

            if (id_grau) {
                const grauExists = await pool.query('SELECT 1 FROM grau WHERE id_grau = $1', [id_grau]);
                if (grauExists.rowCount === 0) {
                    return res.status(404).json({message: 'Grau inexistente.'});
                }
            }

            const result = await pool.query(
                'INSERT INTO docente_grau (id_doc,id_grau,grau_nome,data,link_certif) VALUES($1,$2,$3,$4,$5) RETURNING *;',
                [id_doc, id_grau, grau_nome, data, link_certif]
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
