const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const {Pool} = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const PROTO_PATH = "./protos/data.proto";

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});
const data_proto = grpc.loadPackageDefinition(packageDefinition).data;

const primaryKeys = {
    departamento: "id_dep",
    area_cientifica: "id_area",
    docente: "id_doc",
    curso: "id_curso",
    uc: "id_uc",
    grau: "id_grau",
    docente_grau: "id_dg",
    historico_cv_docente: "id_hcd",
    uc_horas_contacto: ["id_uc", "tipo"],
};

const allowedTables = Object.keys(primaryKeys);

// Helper function to validate table name
function validateTable(tableName) {
    return allowedTables.includes(tableName);
}

// Helper function to build WHERE clause for primary key
function buildPKWhere(tableName, id) {
    const pk = primaryKeys[tableName];
    const params = [];
    let whereClauses = [];

    if (Array.isArray(pk)) {
        const ids = typeof id === "string" ? JSON.parse(id) : id;
        pk.forEach((key, index) => {
            params.push(ids[key]);
            whereClauses.push(`${key} = $${index + 1}`);
        });
    } else {
        params.push(id);
        whereClauses.push(`${pk} = $1`);
    }

    return {where: whereClauses.join(" AND "), params};
}

// GetAll - Read all records with optional filters
async function getAll(call, callback) {
    const {tableName, filters, orderBy, limit, offset} = call.request;
    console.log(
        `[gRPC] getAll - table: ${tableName}, filters: ${
            filters || "none"
        }, orderBy: ${orderBy || "none"}, limit: ${limit || "none"}, offset: ${
            offset || "none"
        }`
    );

    if (!validateTable(tableName)) {
        console.error(`[gRPC] getAll - Invalid table: ${tableName}`);
        return callback(null, {
            data: null,
            error: "Invalid tableName",
            statusCode: 400,
        });
    }

    try {
        let query = `SELECT *
                     FROM ${tableName}`;
        const params = [];
        let paramIndex = 1;

        // Apply filters if provided
        if (filters) {
            const filterObj = JSON.parse(filters);
            const whereClauses = [];
            for (const [key, value] of Object.entries(filterObj)) {
                whereClauses.push(`${key} = $${paramIndex++}`);
                params.push(value);
            }
            if (whereClauses.length > 0) {
                query += ` WHERE ${whereClauses.join(" AND ")}`;
            }
        }

        // Apply ordering
        if (orderBy) {
            query += ` ORDER BY ${orderBy}`;
        }

        // Apply pagination
        if (limit) {
            query += ` LIMIT $${paramIndex++}`;
            params.push(limit);
        }
        if (offset) {
            query += ` OFFSET $${paramIndex++}`;
            params.push(offset);
        }

        const {rows} = await pool.query(query, params);
        console.log(
            `[gRPC] getAll - Success: ${rows.length} rows returned from ${tableName}`
        );
        callback(null, {
            data: JSON.stringify(rows),
            statusCode: 200,
        });
    } catch (e) {
        console.error("GetAll error:", e);
        callback(null, {
            data: null,
            error: e.message,
            statusCode: 500,
        });
    }
}

// GetById - Read single record by ID
async function getById(call, callback) {
    const {tableName, id} = call.request;
    console.log(`[gRPC] getById - table: ${tableName}, id: ${id}`);

    if (!validateTable(tableName)) {
        console.error(`[gRPC] getById - Invalid table: ${tableName}`);
        return callback(null, {
            data: null,
            error: "Invalid tableName",
            statusCode: 400,
        });
    }

    try {
        const {where, params} = buildPKWhere(tableName, id);
        const query = `SELECT *
                       FROM ${tableName}
                       WHERE ${where}`;

        const {rows} = await pool.query(query, params);
        if (rows.length === 0) {
            return callback(null, {
                data: null,
                error: "Not found",
                statusCode: 404,
            });
        }

        console.log(`[gRPC] getById - Success: Found record in ${tableName}`);
        callback(null, {
            data: JSON.stringify(rows[0]),
            statusCode: 200,
        });
    } catch (e) {
        console.error("GetById error:", e);
        callback(null, {
            data: null,
            error: e.message,
            statusCode: 500,
        });
    }
}

// Create - Insert new record
async function create(call, callback) {
    const {tableName, data} = call.request;
    console.log(`[gRPC] create - table: ${tableName}, data: ${data}`);

    if (!validateTable(tableName)) {
        console.error(`[gRPC] create - Invalid table: ${tableName}`);
        return callback(null, {
            data: null,
            error: "Invalid tableName",
            statusCode: 400,
        });
    }

    try {
        const dataObj = JSON.parse(data);
        const keys = Object.keys(dataObj);
        const values = Object.values(dataObj);

        const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
        const query = `INSERT INTO ${tableName} (${keys.join(", ")})
                       VALUES (${placeholders}) RETURNING *`;

        const {rows} = await pool.query(query, values);
        console.log(`[gRPC] create - Success: Created record in ${tableName}`);
        callback(null, {
            data: JSON.stringify(rows[0]),
            statusCode: 201,
        });
    } catch (e) {
        console.error("Create error:", e);
        callback(null, {
            data: null,
            error: e.message,
            statusCode: e.code === "23505" ? 409 : 500, // Handle unique constraint violation
        });
    }
}

// Update - Update existing record
async function update(call, callback) {
    const {tableName, id, data} = call.request;
    console.log(`[gRPC] update - table: ${tableName}, id: ${id}, data: ${data}`);

    if (!validateTable(tableName)) {
        console.error(`[gRPC] update - Invalid table: ${tableName}`);
        return callback(null, {
            data: null,
            error: "Invalid tableName",
            statusCode: 400,
        });
    }

    try {
        const dataObj = JSON.parse(data);
        const keys = Object.keys(dataObj);

        let paramIndex = 1;
        const setClauses = keys
            .map((key) => `${key} = $${paramIndex++}`)
            .join(", ");
        const values = Object.values(dataObj);

        const {where, params: pkParams} = buildPKWhere(tableName, id);

        // Adjust WHERE clause parameter indices
        const adjustedWhere = where.replace(
            /\$(\d+)/g,
            (_, num) => `$${paramIndex++}`
        );

        const query = `UPDATE ${tableName}
                       SET ${setClauses}
                       WHERE ${adjustedWhere} RETURNING *`;
        const allParams = [...values, ...pkParams];

        const {rows} = await pool.query(query, allParams);
        if (rows.length === 0) {
            return callback(null, {
                data: null,
                error: "Not found",
                statusCode: 404,
            });
        }

        console.log(`[gRPC] update - Success: Updated record in ${tableName}`);
        callback(null, {
            data: JSON.stringify(rows[0]),
            statusCode: 200,
        });
    } catch (e) {
        console.error("Update error:", e);
        callback(null, {
            data: null,
            error: e.message,
            statusCode: 500,
        });
    }
}

// Delete - Remove record
async function deleteRecord(call, callback) {
    const {tableName, id} = call.request;
    console.log(`[gRPC] delete - table: ${tableName}, id: ${id}`);

    if (!validateTable(tableName)) {
        console.error(`[gRPC] delete - Invalid table: ${tableName}`);
        return callback(null, {
            data: null,
            error: "Invalid tableName",
            statusCode: 400,
        });
    }

    try {
        const {where, params} = buildPKWhere(tableName, id);
        const query = `DELETE
                       FROM ${tableName}
                       WHERE ${where} RETURNING *`;

        const {rows} = await pool.query(query, params);
        if (rows.length === 0) {
            return callback(null, {
                data: null,
                error: "Not found",
                statusCode: 404,
            });
        }

        console.log(`[gRPC] delete - Success: Deleted record from ${tableName}`);
        callback(null, {
            data: JSON.stringify(rows[0]),
            statusCode: 200,
        });
    } catch (e) {
        console.error("Delete error:", e);
        callback(null, {
            data: null,
            error: e.message,
            statusCode: 500,
        });
    }
}

// GetWithRelations - Complex query with related data
async function getWithRelations(call, callback) {
    const {tableName, id, relations} = call.request;
    console.log(
        `[gRPC] getWithRelations - table: ${tableName}, id: ${id}, relations: ${
            relations ? relations.join(", ") : "none"
        }`
    );

    if (!validateTable(tableName)) {
        console.error(`[gRPC] getWithRelations - Invalid table: ${tableName}`);
        return callback(null, {
            data: null,
            error: "Invalid tableName",
            statusCode: 400,
        });
    }

    try {
        // Get main entity
        const {where, params} = buildPKWhere(tableName, id);
        const query = `SELECT *
                       FROM ${tableName}
                       WHERE ${where}`;
        const {rows} = await pool.query(query, params);

        if (rows.length === 0) {
            return callback(null, {
                data: null,
                error: "Not found",
                statusCode: 404,
            });
        }

        const mainEntity = rows[0];
        const result = {...mainEntity};

        // Fetch relations based on table and requested relations
        if (relations && relations.length > 0) {
            for (const relation of relations) {
                result[relation] = await fetchRelation(tableName, mainEntity, relation);
            }
        }

        console.log(
            `[gRPC] getWithRelations - Success: Retrieved ${tableName} with ${
                relations ? relations.length : 0
            } relations`
        );
        callback(null, {
            data: JSON.stringify(result),
            statusCode: 200,
        });
    } catch (e) {
        console.error("GetWithRelations error:", e);
        callback(null, {
            data: null,
            error: e.message,
            statusCode: 500,
        });
    }
}

// Helper to fetch related data
async function fetchRelation(tableName, entity, relation) {
    const relationMap = {
        departamento: {
            areasCientificas: {table: "area_cientifica", fk: "id_dep"},
            docentes: {table: "docente", fk: "id_dep", through: "area_cientifica"},
        },
        area_cientifica: {
            departamento: {table: "departamento", pk: "id_dep", fk: "id_dep"},
            docentes: {table: "docente", fk: "id_area"},
        },
        docente: {
            areaCientifica: {
                table: "area_cientifica",
                pk: "id_area",
                fk: "id_area",
            },
            graus: {table: "docente_grau", fk: "id_doc"},
            historicoCV: {table: "historico_cv_docente", fk: "id_doc"},
        },
        curso: {
            areaCientifica: {
                table: "area_cientifica",
                pk: "id_area",
                fk: "id_area",
            },
            ucs: {table: "uc", fk: "id_curso"},
        },
        uc: {
            curso: {table: "curso", pk: "id_curso", fk: "id_curso"},
            horasContacto: {table: "uc_horas_contacto", fk: "id_uc"},
        },
    };

    if (!relationMap[tableName] || !relationMap[tableName][relation]) {
        return null;
    }

    const relConfig = relationMap[tableName][relation];
    const pk = primaryKeys[tableName];
    const pkValue = Array.isArray(pk) ? entity[pk[0]] : entity[pk];

    if (relConfig.pk) {
        // One-to-one or many-to-one
        const query = `SELECT *
                       FROM ${relConfig.table}
                       WHERE ${relConfig.pk} = $1`;
        const {rows} = await pool.query(query, [entity[relConfig.fk]]);
        return rows[0] || null;
    } else {
        // One-to-many
        const query = `SELECT *
                       FROM ${relConfig.table}
                       WHERE ${relConfig.fk} = $1`;
        const {rows} = await pool.query(query, [pkValue]);
        return rows;
    }
}

// ExecuteCustomQuery - Predefined complex queries
async function executeCustomQuery(call, callback) {
    const {queryName, params} = call.request;
    console.log(
        `[gRPC] executeCustomQuery - queryName: ${queryName}, params: ${
            params || "none"
        }`
    );

    try {
        const paramObj = params ? JSON.parse(params) : {};
        let query,
            queryParams = [];

        // Define custom queries
        switch (queryName) {
            case "areasWithDepartamento":
                query = `
                    SELECT ac.id_area,
                           ac.nome,
                           ac.sigla,
                           ac.ativo,
                           ac.id_dep,
                           d.nome as nome_departamento
                    FROM area_cientifica ac
                             JOIN departamento d ON ac.id_dep = d.id_dep
                    ORDER BY ac.nome
                `;
                break;

            case "docentesWithFullDetails":
                query = `
                    SELECT d.*,
                           ac.nome   as area_nome,
                           ac.sigla  as area_sigla,
                           dep.nome  as departamento_nome,
                           dep.sigla as departamento_sigla
                    FROM docente d
                             LEFT JOIN area_cientifica ac ON d.id_area = ac.id_area
                             LEFT JOIN departamento dep ON ac.id_dep = dep.id_dep
                    WHERE d.ativo = COALESCE($1, d.ativo)
                    ORDER BY d.nome
                `;
                queryParams = [paramObj.ativo !== undefined ? paramObj.ativo : null];
                break;

            case "cursosWithAreaAndUCs":
                query = `
                    SELECT c.*,
                           ac.nome         as area_nome,
                           COUNT(uc.id_uc) as num_ucs
                    FROM curso c
                             LEFT JOIN area_cientifica ac ON c.id_area = ac.id_area
                             LEFT JOIN uc ON c.id_curso = uc.id_curso
                    WHERE c.ativo = COALESCE($1, c.ativo)
                    GROUP BY c.id_curso, ac.nome
                    ORDER BY c.nome
                `;
                queryParams = [paramObj.ativo !== undefined ? paramObj.ativo : null];
                break;

            case "departamentosWithStats":
                query = `
                    SELECT dep.*,
                           COUNT(DISTINCT ac.id_area) as num_areas,
                           COUNT(DISTINCT d.id_doc)   as num_docentes,
                           COUNT(DISTINCT c.id_curso) as num_cursos
                    FROM departamento dep
                             LEFT JOIN area_cientifica ac ON dep.id_dep = ac.id_dep
                             LEFT JOIN docente d ON ac.id_area = d.id_area
                             LEFT JOIN curso c ON ac.id_area = c.id_area
                    GROUP BY dep.id_dep
                    ORDER BY dep.nome
                `;
                break;

            default:
                return callback(null, {
                    data: null,
                    error: "Unknown query name",
                    statusCode: 400,
                });
        }

        const {rows} = await pool.query(query, queryParams);
        console.log(
            `[gRPC] executeCustomQuery - Success: Query '${queryName}' returned ${rows.length} rows`
        );
        callback(null, {
            data: JSON.stringify(rows),
            statusCode: 200,
        });
    } catch (e) {
        console.error("ExecuteCustomQuery error:", e);
        callback(null, {
            data: null,
            error: e.message,
            statusCode: 500,
        });
    }
}

function main() {
    const server = new grpc.Server();
    server.addService(data_proto.Data.service, {
        getAll,
        getById,
        create,
        update,
        delete: deleteRecord,
        getWithRelations,
        executeCustomQuery,
    });

    server.bindAsync(
        "0.0.0.0:50051",
        grpc.ServerCredentials.createInsecure(),
        (err, port) => {
            if (err) {
                console.error(`Server error: ${err.message}`);
                return;
            }
            console.log(`🚀 gRPC Server running at 0.0.0.0:${port}`);
        }
    );
}

main();
