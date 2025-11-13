import pool from '@/lib/db.js';

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            const result = await pool.query('SELECT * FROM uc_horas_contacto;');
            return res.status(200).json(result.rows);
        } catch (error) {
            console.error(error);
            return res.status(500).json({message: 'Internal Server Error'});
        }
    } else if (req.method === 'POST') {
        const {id_uc, tipo, horas} = req.body;

        if (!id_uc || !tipo || horas == null) {
            return res.status(400).json({message: 'Dados mal formatados.'});
        }

        try {
            const ucExists = await pool.query('SELECT 1 FROM uc WHERE id_uc = $1', [id_uc]);
            if (ucExists.rowCount === 0) {
                return res.status(404).json({message: 'UC inexistente.'});
            }

            const exists = await pool.query('SELECT 1 FROM uc_horas_contacto WHERE id_uc = $1 AND tipo = $2', [id_uc, tipo]);
            if (exists.rowCount > 0) {
                return res.status(409).json({message: 'Horas de contacto já definidas para este tipo.'});
            }

            const result = await pool.query(
                'INSERT INTO uc_horas_contacto (id_uc,tipo,horas) VALUES($1,$2,$3) RETURNING *;',
                [id_uc, tipo, horas]
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
