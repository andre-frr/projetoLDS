import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import path from "node:path";
import fs from "node:fs";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try multiple possible paths for the proto file
const possiblePaths = [
    path.join(__dirname, "../grpc/protos/data.proto"), // Standard path
    path.join(process.cwd(), "grpc/protos/data.proto"), // From app root
    "/app/grpc/protos/data.proto", // Docker absolute path
];

let PROTO_PATH = null;
for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
        PROTO_PATH = p;
        console.log(`Found proto file at: ${PROTO_PATH}`);
        break;
    }
}

if (!PROTO_PATH) {
    console.error("Proto file not found in any of these locations:");
    possiblePaths.forEach((p) => console.error(`  - ${p}`));
    throw new Error("data.proto file not found");
}

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});

const data_proto = grpc.loadPackageDefinition(packageDefinition).data;

// Get gRPC service address from environment or default
const GRPC_ADDRESS = process.env.GRPC_SERVICE_ADDRESS || "service-a:50051";

// Create a singleton client
let client = null;
let promisifiedMethods = null;

function getClient() {
    if (!client) {
        client = new data_proto.Data(
            GRPC_ADDRESS,
            grpc.credentials.createInsecure()
        );

        // Promisify all gRPC methods once
        promisifiedMethods = {
            getAll: promisify(client.getAll.bind(client)),
            getById: promisify(client.getById.bind(client)),
            create: promisify(client.create.bind(client)),
            update: promisify(client.update.bind(client)),
            delete: promisify(client.delete.bind(client)),
            getWithRelations: promisify(client.getWithRelations.bind(client)),
            executeCustomQuery: promisify(client.executeCustomQuery.bind(client)),
        };
    }
    return promisifiedMethods;
}

function handleResponse(response) {
    if (response.error) {
        const error = new Error(response.error);
        error.statusCode = response.statusCode;
        throw error;
    }
    return JSON.parse(response.data);
}

// Promisified wrapper functions
class GrpcClient {
    static async getAll(tableName, options = {}) {
        const request = {
            tableName,
            filters: options.filters ? JSON.stringify(options.filters) : undefined,
            orderBy: options.orderBy,
            limit: options.limit,
            offset: options.offset,
        };

        const response = await getClient().getAll(request);
        return handleResponse(response);
    }

    static async getById(tableName, id) {
        const request = {
            tableName,
            id: typeof id === "object" ? JSON.stringify(id) : String(id),
        };

        const response = await getClient().getById(request);
        return handleResponse(response);
    }

    static async create(tableName, data) {
        const request = {
            tableName,
            data: JSON.stringify(data),
        };

        const response = await getClient().create(request);
        return handleResponse(response);
    }

    static async update(tableName, id, data) {
        const request = {
            tableName,
            id: typeof id === "object" ? JSON.stringify(id) : String(id),
            data: JSON.stringify(data),
        };

        const response = await getClient().update(request);
        return handleResponse(response);
    }

    static async delete(tableName, id) {
        const request = {
            tableName,
            id: typeof id === "object" ? JSON.stringify(id) : String(id),
        };

        const response = await getClient().delete(request);
        return handleResponse(response);
    }

    static async getWithRelations(tableName, id, relations = []) {
        const request = {
            tableName,
            id: typeof id === "object" ? JSON.stringify(id) : String(id),
            relations,
        };

        const response = await getClient().getWithRelations(request);
        return handleResponse(response);
    }

    static async executeCustomQuery(queryName, params = {}) {
        const request = {
            queryName,
            params: JSON.stringify(params),
        };

        const response = await getClient().executeCustomQuery(request);
        return handleResponse(response);
    }
}

export default GrpcClient;
