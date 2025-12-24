import GrpcClient from "@/lib/grpc-client.js";
import {applyCors} from "@/lib/cors.js";

async function handler(req, res) {
    const {id} = req.query;

    if (req.method === "DELETE") {
        try {
            // Check if department exists
            const dept = await GrpcClient.getById("departamento", id);

            if (!dept) {
                return res.status(404).json({message: "Departamento inexistente."});
            }

            // Update department to set ativo = false
            const result = await GrpcClient.update("departamento", id, {
                ativo: false,
            });
            return res.status(200).json(result);
        } catch (error) {
            console.error(error);
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({
                message:
                    statusCode === 404
                        ? "Departamento inexistente."
                        : "Internal Server Error",
            });
        }
    } else {
        res.setHeader("Allow", ["DELETE"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

export default async function handlerWithCors(req, res) {
    await applyCors(req, res);
    return handler(req, res);
}
