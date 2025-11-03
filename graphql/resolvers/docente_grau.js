import pkg from "pg";

const {Pool} = pkg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export const docenteGrauResolvers = {
    Query: {
        docenteGraus: async () => {
            const res = await pool.query("SELECT * FROM docente_grau");
            return res.rows;
        },
        docenteGrau: async (_, {id_dg}) => {
            const res = await pool.query("SELECT * FROM docente_grau WHERE id_dg = $1", [id_dg]);
            return res.rows[0];
        },
    },
    Mutation: {
        adicionarDocenteGrau: async (_, {id_doc, id_grau, grau_nome, data, link_certif}) => {
            const res = await pool.query(
                "INSERT INTO docente_grau (id_doc, id_grau, grau_nome, data, link_certif) VALUES ($1, $2, $3, $4, $5) RETURNING *",
                [id_doc, id_grau, grau_nome, data, link_certif]
            );
            return res.rows[0];
        },
        atualizarDocenteGrau: async (_, {id_dg, id_doc, id_grau, grau_nome, data, link_certif}) => {
            const res = await pool.query(
                "UPDATE docente_grau SET id_doc = $1, id_grau = $2, grau_nome = $3, data = $4, link_certif = $5 WHERE id_dg = $6 RETURNING *",
                [id_doc, id_grau, grau_nome, data, link_certif, id_dg]
            );
            return res.rows[0];
        },
        removerDocenteGrau: async (_, {id_dg}) => {
            const res = await pool.query("DELETE FROM docente_grau WHERE id_dg = $1 RETURNING *", [id_dg]);
            return res.rows[0];
        },
    },
    DocenteGrau: {
        docente: async (docenteGrau) => {
            const res = await pool.query("SELECT * FROM docente WHERE id_doc = $1", [docenteGrau.id_doc]);
            return res.rows[0];
        },
        grau: async (docenteGrau) => {
            if (!docenteGrau.id_grau) return null;
            const res = await pool.query("SELECT * FROM grau WHERE id_grau = $1", [docenteGrau.id_grau]);
            return res.rows[0];
        }
    }
};
