import pool from '../../../lib/db';

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
                    return res.status(404).json({error: 'Area_cientifica not found'});
                }
                res.status(200).json(rows[0]);
            } catch (err) {
                res.status(500).json({error: err.message});
            }
            break;

        case 'PUT':
            try {
                const {nome, sigla, id_dep, ativo} = req.body;
                const {rows} = await pool.query(
                    'UPDATE area_cientifica SET nome=$1, sigla=$2, id_dep=$3, ativo=$4 WHERE id_area=$5 RETURNING *',
                    [nome, sigla, id_dep, ativo ?? true, id]
                );
                if (rows.length === 0) {
                    return res.status(404).json({error: 'Area_cientifica not found'});
                }
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
                    return res.status(404).json({error: 'Area_cientifica not found'});
                }
                res.status(204).end();
            } catch (err) {
                res.status(500).json({error: err.message});
            }
            break;

        default:
            res.status(405).json({error: 'Method not allowed'});
    }
}
