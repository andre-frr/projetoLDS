import pkg from "pg";

const {Pool} = pkg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export const historicoCVDocenteResolvers = {
    Query: {
        historicoCVDocentes: async () => {
            const res = await pool.query("SELECT * FROM historico_cv_docente");
            return res.rows;
        },
        historicoCVDocente: async (_, {id_hcd}) => {
            const res = await pool.query("SELECT * FROM historico_cv_docente WHERE id_hcd = $1", [id_hcd]);
            return res.rows[0];
        },
    },
    Mutation: {
        adicionarHistoricoCVDocente: async (_, {id_doc, data, link_cv}) => {
            const res = await pool.query(
                "INSERT INTO historico_cv_docente (id_doc, data, link_cv) VALUES ($1, $2, $3) RETURNING *",
                [id_doc, data, link_cv]
            );
            return res.rows[0];
        },
        atualizarHistoricoCVDocente: async (_, {id_hcd, id_doc, data, link_cv}) => {
            const res = await pool.query(
                "UPDATE historico_cv_docente SET id_doc = $1, data = $2, link_cv = $3 WHERE id_hcd = $4 RETURNING *",
                [id_doc, data, link_cv, id_hcd]
            );
            return res.rows[0];
        },
        removerHistoricoCVDocente: async (_, {id_hcd}) => {
            const res = await pool.query("DELETE FROM historico_cv_docente WHERE id_hcd = $1 RETURNING *", [id_hcd]);
            return res.rows[0];
        },
    },
    HistoricoCVDocente: {
        docente: async (historico) => {
            const res = await pool.query("SELECT * FROM docente WHERE id_doc = $1", [historico.id_doc]);
            return res.rows[0];
        }
    }
};
