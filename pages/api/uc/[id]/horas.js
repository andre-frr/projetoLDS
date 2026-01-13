import GrpcClient from "@/lib/grpc-client.js";
import {applyCors} from "@/lib/cors.js";
import {ACTIONS, requirePermission, RESOURCES} from "@/lib/authorize.js";

async function handler(req, res) {
    const {id} = req.query;

    const hoursContext = () => ({ucId: id});

    if (req.method === "GET") {
        return requirePermission(ACTIONS.READ, RESOURCES.HOURS, hoursContext)(async (req, res) => {
            try {
                // First check if UC exists
                try {
                    await GrpcClient.getById("uc", id);
                } catch (error) {
                    if (error.statusCode === 404) {
                        return res.status(404).json({message: "UC inexistente."});
                    }
                    throw error;
                }

                // Then get hours (may be empty if not set yet)
                const horas = await GrpcClient.getAll("uc_horas_contacto", {
                    filters: {id_uc: Number(id)}
                });

                return res.status(200).json(horas); // Returns empty array if no hours
            } catch (error) {
                console.error(error);
                return res.status(500).json({message: "Internal Server Error"});
            }
        })(req, res);
    } else if (req.method === "POST") {
        return requirePermission(ACTIONS.UPDATE, RESOURCES.HOURS, hoursContext)(async (req, res) => {
            const {tipo, horas} = req.body;

            if (!tipo || horas === undefined) {
                return res.status(400).json({message: "Dados mal formatados."});
            }

            try {
                // Check if UC exists
                try {
                    await GrpcClient.getById("uc", id);
                } catch (error) {
                    if (error.statusCode === 404) {
                        return res.status(404).json({message: "UC inexistente."});
                    }
                    throw error;
                }

                // Check if hours record already exists
                const existing = await GrpcClient.getAll("uc_horas_contacto", {
                    filters: {id_uc: Number(id), tipo}
                });

                let result;
                if (existing.length > 0) {
                    // Update existing
                    result = await GrpcClient.update("uc_horas_contacto", {id_uc: id, tipo}, {horas});
                } else {
                    // Create new
                    result = await GrpcClient.create("uc_horas_contacto", {
                        id_uc: Number(id),
                        tipo,
                        horas
                    });
                }

                return res.status(201).json(result);
            } catch (error) {
                console.error(error);
                return res.status(500).json({message: "Internal Server Error"});
            }
        })(req, res);
    } else {
        res.setHeader("Allow", ["GET", "POST"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

export default async function handlerWithCors(req, res) {
    await applyCors(req, res);
    return handler(req, res);
}
