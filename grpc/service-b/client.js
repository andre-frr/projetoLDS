const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

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

function main() {
    const client = new data_proto.Data('service-a:50051',
        grpc.credentials.createInsecure());
    client.getData({id: '1'}, function (err, response) {
        if (err) {
            console.error(err);
            return;
        }
        console.log('Data:', response.data);
    });
}

main();

