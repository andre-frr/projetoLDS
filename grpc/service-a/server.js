const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const {Pool} = require('pg');

const pool = new Pool({
    connectionString: "postgres://user:password@db:5432/database",
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

function getData(call, callback) {
    // For now, just return a dummy response
    // In the future, this will query the database
    callback(null, {data: "Data for " + call.request.id});
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
