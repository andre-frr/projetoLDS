import pool from '../../../lib/db.js';

export default async function handler(req, res) {
    const {id} = req.query;

    if (req.method === 'GET') {
        try {
            const result = await pool.query('SELECT * FROM departamento WHERE id_dep=$1', [id]);
            if (result.rowCount === 0) {
                return res.status(404).json({message: 'Departamento inexistente.'});
            }
            return res.status(200).json(result.rows[0]);
        } catch (error) {
            console.error(error);
            return res.status(500).json({message: 'Internal Server Error'});
        }
    } else if (req.method === 'PUT') {
        const {nome, sigla, ativo} = req.body;

        try {
            const depExists = await pool.query('SELECT * FROM departamento WHERE id_dep = $1', [id]);
            if (depExists.rowCount === 0) {
                return res.status(404).json({message: 'Departamento inexistente.'});
            }

            const current = depExists.rows[0];
            const newNome = nome ?? current.nome;
            const newSigla = sigla ?? current.sigla;
            const newAtivo = ativo ?? current.ativo;

            const result = await pool.query(
                'UPDATE departamento SET nome=$1, sigla=$2, ativo=$3 WHERE id_dep=$4 RETURNING *',
                [newNome, newSigla, newAtivo, id]
            );
            return res.status(200).json(result.rows[0]);
        } catch (error) {
            console.error(error);
            return res.status(500).json({message: 'Internal Server Error'});
        }
    } else if (req.method === 'DELETE') {
        try {
            const areas = await pool.query('SELECT 1 FROM area_cientifica WHERE id_dep = $1', [id]);
            if (areas.rowCount > 0) {
                await pool.query('UPDATE departamento SET ativo=false WHERE id_dep=$1', [id]);
                return res.status(200).json({message: 'Departamento marcado como inativo.'});
            } else {
                const result = await pool.query('DELETE FROM departamento WHERE id_dep=$1', [id]);
                if (result.rowCount === 0) {
                    return res.status(404).json({message: 'Departamento inexistente.'});
                }
                return res.status(204).end();
            }
        } catch (error) {
            console.error(error);
            return res.status(500).json({message: 'Internal Server Error'});
        }
    } else {
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
