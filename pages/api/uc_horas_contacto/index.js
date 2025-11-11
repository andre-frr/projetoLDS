import pool from '@/lib/db.js';

export default async function handler(req, res) {
    if (req.method === 'GET') {
        const result = await pool.query('SELECT * FROM uc_horas_contacto;');
        return res.status(200).json(result.rows);
    } else if (req.method === 'POST') {
        const {id_uc, tipo, horas} = req.body;
        if (!id_uc || !tipo || horas == null) return res.status(400).json({error: 'Missing fields'});
        const result = await pool.query(
            'INSERT INTO uc_horas_contacto (id_uc,tipo,horas) VALUES($1,$2,$3) RETURNING *;',
            [id_uc, tipo, horas]
        );
        return res.status(201).json(result.rows[0]);
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
