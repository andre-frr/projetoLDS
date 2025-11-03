const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const {Pool} = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const PROTO_PATH = './protos/data.proto';

const packageDefinition = protoLoader.loadSync(
    PROTO_PATH,
    {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
    });
const data_proto = grpc.loadPackageDefinition(packageDefinition).data;

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

async function getData(call, callback) {
    const {tableName, id} = call.request;

    if (!tableName) {
        return callback({
            code: grpc.status.INVALID_ARGUMENT,
            details: "tableName is required"
        });
    }

    const allowedTables = Object.keys(primaryKeys);
    if (!allowedTables.includes(tableName)) {
        return callback({
            code: grpc.status.INVALID_ARGUMENT,
            details: "Invalid tableName"
        });
    }

    let query;
    const params = [];

    if (id) {
        const pk = primaryKeys[tableName];
        if (Array.isArray(pk)) {
            try {
                const ids = JSON.parse(id);
                const whereClauses = pk.map((key, index) => {
                    params.push(ids[key]);
                    return `${key} = $${index + 1}`;
                });
                query = `SELECT * FROM ${tableName} WHERE ${whereClauses.join(' AND ')}`;
            } catch (e) {
                return callback({
                    code: grpc.status.INVALID_ARGUMENT,
                    details: "Invalid ID format for composite key. Expected JSON."
                });
            }
        } else {
            query = `SELECT * FROM ${tableName} WHERE ${pk} = $1`;
            params.push(id);
        }
    } else {
        query = `SELECT * FROM ${tableName}`;
    }

    try {
        const {rows} = await pool.query(query, params);
        if (rows.length === 0 && id) {
            return callback({
                code: grpc.status.NOT_FOUND,
                details: "Not found"
            });
        }
        callback(null, {data: JSON.stringify(rows)});
    } catch (e) {
        console.error(e);
        callback({
            code: grpc.status.INTERNAL,
            details: "Internal server error"
        });
    }
}

function main() {
    const server = new grpc.Server();
    server.addService(data_proto.Data.service, {getData: getData});
    server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), (err, port) => {
        if (err) {
            console.error(`Server error: ${err.message}`);
            return;
        }
        console.log(`Server running at http://0.0.0.0:${port}`);
    });
}

main();
