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

async function getData(call, callback) {
    const {id} = call.request;
    try {
        const {rows} = await pool.query('SELECT * FROM departamento WHERE id_dep = $1', [id]);
        if (rows.length === 0) {
            return callback({
                code: grpc.status.NOT_FOUND,
                details: "Not found"
            });
        }
        callback(null, {data: JSON.stringify(rows[0])});
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
