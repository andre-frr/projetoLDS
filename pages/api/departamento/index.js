import GrpcClient from "@/lib/grpc-client.js";
import { requireRole } from "@/lib/middleware.js";
import corsMiddleware from "@/lib/cors.js";

const postHandler = async (req, res) => {
  const { nome, sigla } = req.body;
  if (!nome || !sigla) {
    return res.status(400).json({ message: "Dados mal formatados." });
  }

  try {
    // Check if sigla already exists
    const existing = await GrpcClient.getAll("departamento", {
      filters: { sigla },
    });

    if (existing.length > 0) {
      return res.status(409).json({ message: "Sigla duplicada." });
    }

    const result = await GrpcClient.create("departamento", {
      nome,
      sigla,
      ativo: true,
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error(error);
    const statusCode = error.statusCode || 500;
    return res
      .status(statusCode)
      .json({ message: error.message || "Internal Server Error" });
  }
};

async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const result = await GrpcClient.getAll("departamento");
      return res.status(200).json(result);
    } catch (error) {
      console.error(error);
      const statusCode = error.statusCode || 500;
      return res
        .status(statusCode)
        .json({ message: error.message || "Internal Server Error" });
    }
  } else if (req.method === "POST") {
    return requireRole("Administrador")(postHandler)(req, res);
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export default async function handlerWithCors(req, res) {
  return new Promise((resolve, reject) => {
    corsMiddleware(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(handler(req, res));
    });
  });
}
