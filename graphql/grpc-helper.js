const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const PROTO_PATH = path.join(__dirname, '../grpc/protos/data.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const data_proto = grpc.loadPackageDefinition(packageDefinition).data;
const GRPC_ADDRESS = process.env.GRPC_SERVICE_ADDRESS || 'service-a:50051';
const grpcClient = new data_proto.Data(GRPC_ADDRESS, grpc.credentials.createInsecure());

function getWithRelations(tableName, id, relations) {
    return new Promise((resolve, reject) => {
        grpcClient.getWithRelations({
            tableName,
            id: String(id),
            relations
        }, (err, response) => {
            if (err) return reject(err);
            if (response.error) {
                const error = new Error(response.error);
                error.statusCode = response.statusCode;
                return reject(error);
            }
            resolve(JSON.parse(response.data));
        });
    });
}

function getAll(tableName, filters) {
    return new Promise((resolve, reject) => {
        grpcClient.getAll({
            tableName,
            filters: filters ? JSON.stringify(filters) : undefined
        }, (err, response) => {
            if (err) return reject(err);
            if (response.error) return reject(new Error(response.error));
            resolve(JSON.parse(response.data));
        });
    });
}

function getById(tableName, id) {
    return new Promise((resolve, reject) => {
        grpcClient.getById({
            tableName,
            id: String(id)
        }, (err, response) => {
            if (err) return reject(err);
            if (response.error) {
                const error = new Error(response.error);
                error.statusCode = response.statusCode;
                return reject(error);
            }
            resolve(JSON.parse(response.data));
        });
    });
}

function executeCustomQuery(queryName, params = {}) {
    return new Promise((resolve, reject) => {
        grpcClient.executeCustomQuery({
            queryName,
            params: JSON.stringify(params)
        }, (err, response) => {
            if (err) return reject(err);
            if (response.error) return reject(new Error(response.error));
            resolve(JSON.parse(response.data));
        });
    });
}

export {
    getWithRelations,
    getAll,
    getById,
    executeCustomQuery
};
