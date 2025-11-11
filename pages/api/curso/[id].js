import pool from '@/lib/db.js';

export default async function handler(req, res) {
    const {id} = req.query;

    if (req.method === 'GET') {
        try {
            const result = await pool.query('SELECT * FROM curso WHERE id_curso=$1', [id]);
            if (result.rowCount === 0) {
                return res.status(404).json({message: 'Curso inexistente.'});
            }
            return res.status(200).json(result.rows[0]);
        } catch (error) {
            console.error(error);
            return res.status(500).json({message: 'Internal Server Error'});
        }
    } else if (req.method === 'PUT') {
        const {nome, sigla, tipo, ativo} = req.body;

        try {
            const cursoExists = await pool.query('SELECT * FROM curso WHERE id_curso = $1', [id]);
            if (cursoExists.rowCount === 0) {
                return res.status(404).json({message: 'Curso inexistente.'});
            }

            const current = cursoExists.rows[0];
            const newNome = nome ?? current.nome;
            const newSigla = sigla ?? current.sigla;
            const newTipo = tipo ?? current.tipo;
            const newAtivo = ativo ?? current.ativo;

            const result = await pool.query(
                'UPDATE curso SET nome=$1, sigla=$2, tipo=$3, ativo=$4 WHERE id_curso=$5 RETURNING *',
                [newNome, newSigla, newTipo, newAtivo, id]
            );
            return res.status(200).json(result.rows[0]);
        } catch (error) {
            console.error(error);
            return res.status(500).json({message: 'Internal Server Error'});
        }
    } else if (req.method === 'DELETE') {
        try {
            const ucs = await pool.query('SELECT 1 FROM uc WHERE id_curso = $1', [id]);
            if (ucs.rowCount > 0) {
                await pool.query('UPDATE curso SET ativo=false WHERE id_curso=$1', [id]);
                return res.status(200).json({message: 'Curso marcado como inativo.'});
            } else {
                const result = await pool.query('DELETE FROM curso WHERE id_curso=$1', [id]);
                if (result.rowCount === 0) {
                    return res.status(404).json({message: 'Curso inexistente.'});
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
