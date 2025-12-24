import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.join(__dirname, 'grpc/protos/data.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const data_proto = grpc.loadPackageDefinition(packageDefinition).data;
const GRPC_ADDRESS = process.env.GRPC_SERVICE_ADDRESS || 'service-a:50051';
const client = new data_proto.Data(GRPC_ADDRESS, grpc.credentials.createInsecure());

// Promisify gRPC methods
const getWithRelationsAsync = promisify(client.getWithRelations.bind(client));
const getAllAsync = promisify(client.getAll.bind(client));
const getByIdAsync = promisify(client.getById.bind(client));
const executeCustomQueryAsync = promisify(client.executeCustomQuery.bind(client));

function handleResponse(response) {
    if (response.error) {
        const error = new Error(response.error);
        error.statusCode = response.statusCode;
        throw error;
    }
    return JSON.parse(response.data);
}

async function getWithRelations(tableName, id, relations) {
    const response = await getWithRelationsAsync({
        tableName,
        id: String(id),
        relations
    });
    return handleResponse(response);
}

async function getAll(tableName, filters) {
    const response = await getAllAsync({
        tableName,
        filters: filters ? JSON.stringify(filters) : undefined
    });
    return handleResponse(response);
}

async function getById(tableName, id) {
    const response = await getByIdAsync({
        tableName,
        id: String(id)
    });
    return handleResponse(response);
}

async function executeCustomQuery(queryName, params = {}) {
    const response = await executeCustomQueryAsync({
        queryName,
        params: JSON.stringify(params)
    });
    return handleResponse(response);
}

export {
    getWithRelations,
    getAll,
    getById,
    executeCustomQuery
};
