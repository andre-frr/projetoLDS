import pkg from "pg";

const {Pool} = pkg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export const ucHorasContactoResolvers = {
    Query: {
        ucHorasContactos: async (_, {id_uc}) => {
            const res = await pool.query("SELECT * FROM uc_horas_contacto WHERE id_uc = $1", [id_uc]);
            return res.rows;
        },
    },
    Mutation: {
        adicionarUcHorasContacto: async (_, {id_uc, tipo, horas}) => {
            const res = await pool.query(
                "INSERT INTO uc_horas_contacto (id_uc, tipo, horas) VALUES ($1, $2, $3) RETURNING *",
                [id_uc, tipo, horas]
            );
            return res.rows[0];
        },
        atualizarUcHorasContacto: async (_, {id_uc, tipo, horas}) => {
            const res = await pool.query(
                "UPDATE uc_horas_contacto SET horas = $1 WHERE id_uc = $2 AND tipo = $3 RETURNING *",
                [horas, id_uc, tipo]
            );
            return res.rows[0];
        },
        removerUcHorasContacto: async (_, {id_uc, tipo}) => {
            const res = await pool.query("DELETE FROM uc_horas_contacto WHERE id_uc = $1 AND tipo = $2 RETURNING *", [id_uc, tipo]);
            return res.rows[0];
        },
    },
    UcHorasContacto: {
        uc: async (horasContacto) => {
            const res = await pool.query("SELECT * FROM uc WHERE id_uc = $1", [horasContacto.id_uc]);
            return res.rows[0];
        }
    }
};


