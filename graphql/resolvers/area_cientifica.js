import pkg from "pg";

const {Pool} = pkg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export const areaCientificaResolvers = {
    Query: {
        areasCientificas: async () => {
            const res = await pool.query("SELECT * FROM area_cientifica");
            return res.rows;
        },
        areaCientifica: async (_, {id_area}) => {
            const res = await pool.query("SELECT * FROM area_cientifica WHERE id_area = $1", [id_area]);
            return res.rows[0];
        },
    },
    Mutation: {
        adicionarAreaCientifica: async (_, {nome, sigla, id_dep}) => {
            const res = await pool.query(
                "INSERT INTO area_cientifica (nome, sigla, id_dep) VALUES ($1, $2, $3) RETURNING *",
                [nome, sigla, id_dep]
            );
            return res.rows[0];
        },
        atualizarAreaCientifica: async (_, {id_area, nome, sigla, id_dep, ativo}) => {
            const res = await pool.query(
                "UPDATE area_cientifica SET nome = $1, sigla = $2, id_dep = $3, ativo = $4 WHERE id_area = $5 RETURNING *",
                [nome, sigla, id_dep, ativo, id_area]
            );
            return res.rows[0];
        },
        removerAreaCientifica: async (_, {id_area}) => {
            const res = await pool.query("DELETE FROM area_cientifica WHERE id_area = $1 RETURNING *", [id_area]);
            return res.rows[0];
        },
    },
    AreaCientifica: {
        departamento: async (areaCientifica) => {
            const res = await pool.query("SELECT * FROM departamento WHERE id_dep = $1", [areaCientifica.id_dep]);
            return res.rows[0];
        },
        docentes: async (areaCientifica) => {
            const res = await pool.query("SELECT * FROM docente WHERE id_area = $1", [areaCientifica.id_area]);
            return res.rows;
        },
        ucs: async (areaCientifica) => {
            const res = await pool.query("SELECT * FROM uc WHERE id_area = $1", [areaCientifica.id_area]);
            return res.rows;
        }
    }
};
