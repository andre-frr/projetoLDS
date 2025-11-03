import pkg from "pg";

const {Pool} = pkg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export const cursoResolvers = {
    Query: {
        cursos: async () => {
            const res = await pool.query("SELECT * FROM curso");
            return res.rows;
        },
        curso: async (_, {id_curso}) => {
            const res = await pool.query("SELECT * FROM curso WHERE id_curso = $1", [id_curso]);
            return res.rows[0];
        },
    },
    Mutation: {
        adicionarCurso: async (_, {nome, sigla, tipo}) => {
            const res = await pool.query(
                "INSERT INTO curso (nome, sigla, tipo) VALUES ($1, $2, $3) RETURNING *",
                [nome, sigla, tipo]
            );
            return res.rows[0];
        },
        atualizarCurso: async (_, {id_curso, nome, sigla, tipo, ativo}) => {
            const res = await pool.query(
                "UPDATE curso SET nome = $1, sigla = $2, tipo = $3, ativo = $4 WHERE id_curso = $5 RETURNING *",
                [nome, sigla, tipo, ativo, id_curso]
            );
            return res.rows[0];
        },
        removerCurso: async (_, {id_curso}) => {
            const res = await pool.query("DELETE FROM curso WHERE id_curso = $1 RETURNING *", [id_curso]);
            return res.rows[0];
        },
    },
    Curso: {
        ucs: async (curso) => {
            const res = await pool.query("SELECT * FROM uc WHERE id_curso = $1", [curso.id_curso]);
            return res.rows;
        }
    }
};
