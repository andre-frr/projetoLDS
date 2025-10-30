const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const express = require('express');

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

function main(callback) {
    const client = new data_proto.Data('service-a:50051',
        grpc.credentials.createInsecure());
    client.getData({id: '1'}, function (err, response) {
        if (err) {
            console.error(err);
            callback(err, null);
            return;
        }
        console.log('Data:', response.data);
        callback(null, response.data);
    });
}

const app = express();
const port = 3001;

app.get('/', (req, res) => {
    main((err, data) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.send(data);
    });
});

app.listen(port, () => {
    console.log(`Service-b listening at http://localhost:${port}`);
});
