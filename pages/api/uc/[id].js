import pool from '@/lib/db.js';

export default async function handler(req, res) {
    const {id} = req.query;

    if (req.method === 'GET') {
        try {
            const ucResult = await pool.query('SELECT * FROM uc WHERE id_uc=$1', [id]);
            if (ucResult.rowCount === 0) {
                return res.status(404).json({message: 'UC inexistente.'});
            }

            const horasResult = await pool.query('SELECT tipo, horas FROM uc_horas_contacto WHERE id_uc=$1', [id]);

            const ucDetails = {
                ...ucResult.rows[0],
                horas_contacto: horasResult.rows
            };

            return res.status(200).json(ucDetails);
        } catch (error) {
            console.error(error);
            return res.status(500).json({message: 'Internal Server Error'});
        }
    } else if (req.method === 'PUT') {
        try {
            const {nome, id_curso, id_area, ano_curso, sem_curso, ects, ativo} = req.body;

            const ucExists = await pool.query('SELECT * FROM uc WHERE id_uc = $1', [id]);
            if (ucExists.rowCount === 0) {
                return res.status(404).json({message: 'UC inexistente.'});
            }

            // Validate foreign keys if provided
            if (id_curso) {
                const cursoExists = await pool.query('SELECT 1 FROM curso WHERE id_curso = $1', [id_curso]);
                if (cursoExists.rowCount === 0) {
                    return res.status(404).json({message: 'Curso inexistente.'});
                }
            }

            if (id_area) {
                const areaExists = await pool.query('SELECT 1 FROM area_cientifica WHERE id_area = $1', [id_area]);
                if (areaExists.rowCount === 0) {
                    return res.status(404).json({message: 'Área científica inexistente.'});
                }
            }

            const current = ucExists.rows[0];
            const newNome = nome ?? current.nome;
            const newIdCurso = id_curso ?? current.id_curso;
            const newIdArea = id_area ?? current.id_area;
            const newAnoCurso = ano_curso ?? current.ano_curso;
            const newSemCurso = sem_curso ?? current.sem_curso;
            const newEcts = ects ?? current.ects;
            const newAtivo = ativo ?? current.ativo;

            const result = await pool.query(
                `UPDATE uc
                 SET nome=$1,
                     id_curso=$2,
                     id_area=$3,
                     ano_curso=$4,
                     sem_curso=$5,
                     ects=$6,
                     ativo=$7
                 WHERE id_uc = $8 RETURNING *`,
                [newNome, newIdCurso, newIdArea, newAnoCurso, newSemCurso, newEcts, newAtivo, id]
            );

            return res.status(200).json(result.rows[0]);
        } catch (error) {
            console.error(error);
            return res.status(500).json({message: 'Internal Server Error'});
        }
    } else if (req.method === 'DELETE') {
        try {
            // First check if UC has contact hours (they'll be cascade deleted)
            const result = await pool.query('DELETE FROM uc WHERE id_uc=$1', [id]);
            if (result.rowCount === 0) {
                return res.status(404).json({message: 'UC inexistente.'});
            }
            return res.status(204).end();
        } catch (error) {
            console.error(error);
            return res.status(500).json({message: 'Internal Server Error'});
        }
    } else {
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
