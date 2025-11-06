import pool from '../../../lib/db';

export default async function handler(req, res) {
    switch (req.method) {
        case 'GET':
            try {
                const {rows} = await pool.query(`
                    SELECT ac.id_area, ac.nome, ac.sigla, d.nome as nome_departamento
                    FROM area_cientifica ac
                             JOIN departamento d ON ac.id_dep = d.id_dep
                `);
                res.status(200).json(rows);
            } catch (err) {
                res.status(500).json({error: err.message});
            }
            break;

        case 'POST':
            try {
                const {nome, sigla, id_dep} = req.body;
                if (!nome || !sigla || !id_dep) {
                    return res.status(400).json({message: 'Dados mal formatados.'});
                }

                const depExists = await pool.query('SELECT 1 FROM departamento WHERE id_dep = $1', [id_dep]);
                if (depExists.rowCount === 0) {
                    return res.status(400).json({message: 'Departamento inexistente.'});
                }

                const {rows} = await pool.query(
                    'INSERT INTO area_cientifica (nome, sigla, id_dep, ativo) VALUES ($1, $2, $3, TRUE) RETURNING *',
                    [nome, sigla, id_dep]
                );
                res.status(201).json(rows[0]);
            } catch (err) {
                res.status(500).json({error: err.message});
            }
            break;

        default:
            res.setHeader('Allow', ['GET', 'POST']);
            res.status(405).json({error: 'Method not allowed'});
    }
}
