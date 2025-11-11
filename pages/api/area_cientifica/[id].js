import pool from '@/lib/db.js';

export default async function handler(req, res) {
    const {id} = req.query;

    switch (req.method) {
        case 'GET':
            try {
                const {rows} = await pool.query(
                    'SELECT * FROM area_cientifica WHERE id_area = $1',
                    [id]
                );
                if (rows.length === 0) {
                    return res.status(404).json({message: 'Área científica inexistente.'});
                }
                res.status(200).json(rows[0]);
            } catch (err) {
                res.status(500).json({error: err.message});
            }
            break;

        case 'PUT':
            try {
                const {nome, sigla, id_dep, ativo} = req.body;

                const areaExists = await pool.query('SELECT * FROM area_cientifica WHERE id_area = $1', [id]);
                if (areaExists.rowCount === 0) {
                    return res.status(404).json({message: 'Área científica inexistente.'});
                }

                if (id_dep) {
                    const depExists = await pool.query('SELECT 1 FROM departamento WHERE id_dep = $1', [id_dep]);
                    if (depExists.rowCount === 0) {
                        return res.status(400).json({message: 'Departamento inexistente.'});
                    }
                }

                const current = areaExists.rows[0];
                const newNome = nome ?? current.nome;
                const newSigla = sigla ?? current.sigla;
                const newIdDep = id_dep ?? current.id_dep;
                const newAtivo = ativo ?? current.ativo;

                const {rows} = await pool.query(
                    'UPDATE area_cientifica SET nome=$1, sigla=$2, id_dep=$3, ativo=$4 WHERE id_area=$5 RETURNING *',
                    [newNome, newSigla, newIdDep, newAtivo, id]
                );
                res.status(200).json(rows[0]);
            } catch (err) {
                res.status(500).json({error: err.message});
            }
            break;

        case 'DELETE':
            try {
                const {rowCount} = await pool.query(
                    'DELETE FROM area_cientifica WHERE id_area=$1',
                    [id]
                );
                if (rowCount === 0) {
                    return res.status(404).json({message: 'Área científica inexistente.'});
                }
                res.status(204).end();
            } catch (err) {
                res.status(500).json({error: err.message});
            }
            break;

        default:
            res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
            res.status(405).json({error: 'Method not allowed'});
    }
}
