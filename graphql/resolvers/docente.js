import pkg from "pg";

const {Pool} = pkg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export const docenteResolvers = {
    Query: {
        docentes: async () => {
            const res = await pool.query("SELECT * FROM docente");
            return res.rows;
        },
        docente: async (_, {id_doc}) => {
            const res = await pool.query("SELECT * FROM docente WHERE id_doc = $1", [id_doc]);
            return res.rows[0];
        },
    },
    Mutation: {
        adicionarDocente: async (_, {nome, id_area, email, convidado}) => {
            const res = await pool.query(
                "INSERT INTO docente (nome, id_area, email, convidado) VALUES ($1, $2, $3, $4) RETURNING *",
                [nome, id_area, email, convidado]
            );
            return res.rows[0];
        },
        atualizarDocente: async (_, {id_doc, nome, id_area, email, ativo, convidado}) => {
            const res = await pool.query(
                "UPDATE docente SET nome = $1, id_area = $2, email = $3, ativo = $4, convidado = $5 WHERE id_doc = $6 RETURNING *",
                [nome, id_area, email, ativo, convidado, id_doc]
            );
            return res.rows[0];
        },
        removerDocente: async (_, {id_doc}) => {
            const res = await pool.query("DELETE FROM docente WHERE id_doc = $1 RETURNING *", [id_doc]);
            return res.rows[0];
        },
    },
    Docente: {
        areaCientifica: async (docente) => {
            const res = await pool.query("SELECT * FROM area_cientifica WHERE id_area = $1", [docente.id_area]);
            return res.rows[0];
        },
        graus: async (docente) => {
            const res = await pool.query("SELECT * FROM docente_grau WHERE id_doc = $1", [docente.id_doc]);
            return res.rows;
        },
        historicoCV: async (docente) => {
            const res = await pool.query("SELECT * FROM historico_cv_docente WHERE id_doc = $1", [docente.id_doc]);
            return res.rows;
        }
    }
};
