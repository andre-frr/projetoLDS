import pkg from "pg";

const {Pool} = pkg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export const resolvers = {
    Query: {
        departamentos: async () => {
            const res = await pool.query("SELECT * FROM departamento");
            return res.rows;
        },
        departamento: async (_, {id_dep}) => {
            const res = await pool.query("SELECT * FROM departamento WHERE id_dep = $1", [id_dep]);
            return res.rows[0];
        },
    },
    Mutation: {
        adicionarDepartamento: async (_, {nome, sigla}) => {
            const res = await pool.query(
                "INSERT INTO departamento (nome, sigla) VALUES ($1, $2) RETURNING *",
                [nome, sigla]
            );
            return res.rows[0];
        },
    },
};
