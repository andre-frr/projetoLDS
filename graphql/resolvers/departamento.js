import pkg from "pg";

const {Pool} = pkg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export const departamentoResolvers = {
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
        atualizarDepartamento: async (_, {id_dep, nome, sigla, ativo}) => {
            const res = await pool.query(
                "UPDATE departamento SET nome = $1, sigla = $2, ativo = $3 WHERE id_dep = $4 RETURNING *",
                [nome, sigla, ativo, id_dep]
            );
            return res.rows[0];
        },
        removerDepartamento: async (_, {id_dep}) => {
            const res = await pool.query("DELETE FROM departamento WHERE id_dep = $1 RETURNING *", [id_dep]);
            return res.rows[0];
        },
    },
    Departamento: {
        areasCientificas: async (departamento) => {
            const res = await pool.query("SELECT * FROM area_cientifica WHERE id_dep = $1", [departamento.id_dep]);
            return res.rows;
        }
    }
};

