import pkg from "pg";

const {Pool} = pkg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export const grauResolvers = {
    Query: {
        graus: async () => {
            const res = await pool.query("SELECT * FROM grau");
            return res.rows;
        },
        grau: async (_, {id_grau}) => {
            const res = await pool.query("SELECT * FROM grau WHERE id_grau = $1", [id_grau]);
            return res.rows[0];
        },
    },
    Mutation: {
        adicionarGrau: async (_, {nome}) => {
            const res = await pool.query(
                "INSERT INTO grau (nome) VALUES ($1) RETURNING *",
                [nome]
            );
            return res.rows[0];
        },
        atualizarGrau: async (_, {id_grau, nome}) => {
            const res = await pool.query(
                "UPDATE grau SET nome = $1 WHERE id_grau = $2 RETURNING *",
                [nome, id_grau]
            );
            return res.rows[0];
        },
        removerGrau: async (_, {id_grau}) => {
            const res = await pool.query("DELETE FROM grau WHERE id_grau = $1 RETURNING *", [id_grau]);
            return res.rows[0];
        },
    }
};
