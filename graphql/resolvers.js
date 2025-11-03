import pkg from "pg";

const {Pool} = pkg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const primaryKeys = {
    'departamento': 'id_dep',
    'area_cientifica': 'id_area',
    'docente': 'id_doc',
    'curso': 'id_curso',
    'uc': 'id_uc',
    'grau': 'id_grau',
    'docente_grau': 'id_dg',
    'historico_cv_docente': 'id_hcd',
    'uc_horas_contacto': ['id_uc', 'tipo']
};

export const resolvers = {
    Query: {
        queryTable: async (_, {tableName, id}) => {
            if (!tableName || !Object.keys(primaryKeys).includes(tableName)) {
                throw new Error("Invalid or missing tableName");
            }

            let query;
            const params = [];

            if (id) {
                const pk = primaryKeys[tableName];
                if (Array.isArray(pk)) {
                    // This is a simplified example and might need more robust handling for composite keys
                    throw new Error("Querying by ID on composite key tables is not supported in this generic resolver.");
                }
                query = `SELECT * FROM ${tableName} WHERE ${pk} = $1`;
                params.push(id);
            } else {
                query = `SELECT * FROM ${tableName}`;
            }

            const res = await pool.query(query, params);
            return JSON.stringify(res.rows);
        },
    },
};
