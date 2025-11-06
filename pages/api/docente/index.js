import pool from '../../../lib/db.js';

export default async function handler(req, res) {
    if (req.method === 'GET') {
        const {incluirInativos} = req.query;
        let query = 'SELECT * FROM docente';
        const params = [];

        if (incluirInativos !== 'true') {
            query += ' WHERE ativo = true';
        }

        try {
            const result = await pool.query(query, params);
            return res.status(200).json(result.rows);
        } catch (error) {
            console.error(error);
            return res.status(500).json({message: 'Internal Server Error'});
        }
    } else if (req.method === 'POST') {
        const {nome, email, id_area, convidado} = req.body;
        if (!nome || !email || !id_area) {
            return res.status(400).json({message: 'Dados mal formatados.'});
        }

        try {
            const emailExists = await pool.query('SELECT 1 FROM docente WHERE email = $1', [email]);
            if (emailExists.rowCount > 0) {
                return res.status(409).json({message: 'Email duplicado.'});
            }

            const areaExists = await pool.query('SELECT 1 FROM area_cientifica WHERE id_area = $1', [id_area]);
            if (areaExists.rowCount === 0) {
                return res.status(400).json({message: 'Área científica inexistente.'});
            }

            const result = await pool.query(
                `INSERT INTO docente (nome, email, id_area, ativo, convidado)
                 VALUES ($1, $2, $3, true, $4) RETURNING *`,
                [nome, email, id_area, convidado ?? false]
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
