import pkg from "pg";

const {Pool} = pkg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export const ucResolvers = {
    Query: {
        ucs: async () => {
            const res = await pool.query("SELECT * FROM uc");
            return res.rows;
        },
        uc: async (_, {id_uc}) => {
            const res = await pool.query("SELECT * FROM uc WHERE id_uc = $1", [id_uc]);
            return res.rows[0];
        },
    },
    Mutation: {
        adicionarUc: async (_, {nome, id_curso, id_area, ano_curso, sem_curso, ects}) => {
            const res = await pool.query(
                "INSERT INTO uc (nome, id_curso, id_area, ano_curso, sem_curso, ects) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
                [nome, id_curso, id_area, ano_curso, sem_curso, ects]
            );
            return res.rows[0];
        },
        atualizarUc: async (_, {id_uc, nome, id_curso, id_area, ano_curso, sem_curso, ects, ativo}) => {
            const res = await pool.query(
                "UPDATE uc SET nome = $1, id_curso = $2, id_area = $3, ano_curso = $4, sem_curso = $5, ects = $6, ativo = $7 WHERE id_uc = $8 RETURNING *",
                [nome, id_curso, id_area, ano_curso, sem_curso, ects, ativo, id_uc]
            );
            return res.rows[0];
        },
        removerUc: async (_, {id_uc}) => {
            const res = await pool.query("DELETE FROM uc WHERE id_uc = $1 RETURNING *", [id_uc]);
            return res.rows[0];
        },
    },
    Uc: {
        curso: async (uc) => {
            const res = await pool.query("SELECT * FROM curso WHERE id_curso = $1", [uc.id_curso]);
            return res.rows[0];
        },
        areaCientifica: async (uc) => {
            const res = await pool.query("SELECT * FROM area_cientifica WHERE id_area = $1", [uc.id_area]);
            return res.rows[0];
        },
        horasContacto: async (uc) => {
            const res = await pool.query("SELECT * FROM uc_horas_contacto WHERE id_uc = $1", [uc.id_uc]);
            return res.rows;
        }
    }
};
