import pool from '@/lib/db.js';

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            const result = await pool.query(`
                SELECT id_uc,
                       nome,
                       ano_curso,
                       ects,
                       (SELECT SUM(horas) FROM uc_horas_contacto WHERE id_uc = uc.id_uc) as horas_contacto_total
                FROM uc
            `);
            return res.status(200).json(result.rows);
        } catch (error) {
            console.error(error);
            return res.status(500).json({message: 'Internal Server Error'});
        }
    } else if (req.method === 'POST') {
        try {
            const {nome, id_curso, id_area, ano_curso, sem_curso, ects} = req.body;

            // Validate required fields
            if (!nome || !id_curso || !id_area || !ano_curso || !sem_curso || ects == null) {
                return res.status(400).json({message: 'Dados mal formatados. Campos obrigatórios: nome, id_curso, id_area, ano_curso, sem_curso, ects'});
            }

            // Validate foreign keys
            const cursoExists = await pool.query('SELECT 1 FROM curso WHERE id_curso = $1', [id_curso]);
            if (cursoExists.rowCount === 0) {
                return res.status(404).json({message: 'Curso inexistente.'});
            }

            const areaExists = await pool.query('SELECT 1 FROM area_cientifica WHERE id_area = $1', [id_area]);
            if (areaExists.rowCount === 0) {
                return res.status(404).json({message: 'Área científica inexistente.'});
            }

            const result = await pool.query(
                'INSERT INTO uc (nome, id_curso, id_area, ano_curso, sem_curso, ects, ativo) VALUES ($1, $2, $3, $4, $5, $6, TRUE) RETURNING *',
                [nome, id_curso, id_area, ano_curso, sem_curso, ects]
            );

            return res.status(201).json({
                message: 'UC criada com sucesso',
                uc: result.rows[0]
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({message: 'Internal Server Error'});
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
