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

// Get gRPC service address from environment or default
const GRPC_ADDRESS = process.env.GRPC_SERVICE_ADDRESS || 'service-a:50051';

// Create a singleton client
let client = null;

function getClient() {
    if (!client) {
        client = new data_proto.Data(GRPC_ADDRESS, grpc.credentials.createInsecure());
    }
    return client;
}

// Promisified wrapper functions
class GrpcClient {
    static async getAll(tableName, options = {}) {
        return new Promise((resolve, reject) => {
            const request = {
                tableName,
                filters: options.filters ? JSON.stringify(options.filters) : undefined,
                orderBy: options.orderBy,
                limit: options.limit,
                offset: options.offset
            };

            getClient().getAll(request, (err, response) => {
                if (err) {
                    return reject(err);
                }
                if (response.error) {
                    const error = new Error(response.error);
                    error.statusCode = response.statusCode;
                    return reject(error);
                }
                resolve(JSON.parse(response.data));
            });
        });
    }

    static async getById(tableName, id) {
        return new Promise((resolve, reject) => {
            const request = {
                tableName,
                id: typeof id === 'object' ? JSON.stringify(id) : String(id)
            };

            getClient().getById(request, (err, response) => {
                if (err) {
                    return reject(err);
                }
                if (response.error) {
                    const error = new Error(response.error);
                    error.statusCode = response.statusCode;
                    return reject(error);
                }
                resolve(JSON.parse(response.data));
            });
        });
    }

    static async create(tableName, data) {
        return new Promise((resolve, reject) => {
            const request = {
                tableName,
                data: JSON.stringify(data)
            };

            getClient().create(request, (err, response) => {
                if (err) {
                    return reject(err);
                }
                if (response.error) {
                    const error = new Error(response.error);
                    error.statusCode = response.statusCode;
                    return reject(error);
                }
                resolve(JSON.parse(response.data));
            });
        });
    }

    static async update(tableName, id, data) {
        return new Promise((resolve, reject) => {
            const request = {
                tableName,
                id: typeof id === 'object' ? JSON.stringify(id) : String(id),
                data: JSON.stringify(data)
            };

            getClient().update(request, (err, response) => {
                if (err) {
                    return reject(err);
                }
                if (response.error) {
                    const error = new Error(response.error);
                    error.statusCode = response.statusCode;
                    return reject(error);
                }
                resolve(JSON.parse(response.data));
            });
        });
    }

    static async delete(tableName, id) {
        return new Promise((resolve, reject) => {
            const request = {
                tableName,
                id: typeof id === 'object' ? JSON.stringify(id) : String(id)
            };

            getClient().delete(request, (err, response) => {
                if (err) {
                    return reject(err);
                }
                if (response.error) {
                    const error = new Error(response.error);
                    error.statusCode = response.statusCode;
                    return reject(error);
                }
                resolve(JSON.parse(response.data));
            });
        });
    }

    static async getWithRelations(tableName, id, relations = []) {
        return new Promise((resolve, reject) => {
            const request = {
                tableName,
                id: typeof id === 'object' ? JSON.stringify(id) : String(id),
                relations
            };

            getClient().getWithRelations(request, (err, response) => {
                if (err) {
                    return reject(err);
                }
                if (response.error) {
                    const error = new Error(response.error);
                    error.statusCode = response.statusCode;
                    return reject(error);
                }
                resolve(JSON.parse(response.data));
            });
        });
    }

    static async executeCustomQuery(queryName, params = {}) {
        return new Promise((resolve, reject) => {
            const request = {
                queryName,
                params: JSON.stringify(params)
            };

            getClient().executeCustomQuery(request, (err, response) => {
                if (err) {
                    return reject(err);
                }
                if (response.error) {
                    const error = new Error(response.error);
                    error.statusCode = response.statusCode;
                    return reject(error);
                }
                resolve(JSON.parse(response.data));
            });
        });
    }
}

module.exports = GrpcClient;
