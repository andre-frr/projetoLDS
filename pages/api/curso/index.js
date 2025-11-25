import GrpcClient from "@/lib/grpc-client.js";
import corsMiddleware from "@/lib/cors.js";

async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const result = await GrpcClient.getAll("curso");
      return res.status(200).json(result);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res
        .status(statusCode)
        .json({ message: error.message || "Internal Server Error" });
    }
  } else if (req.method === "POST") {
    const { nome, sigla, tipo } = req.body;
    if (!nome || !sigla || !tipo) {
      return res.status(400).json({ message: "Dados mal formatados." });
    }

    try {
      const existing = await GrpcClient.getAll("curso", { filters: { sigla } });
      if (existing.length > 0) {
        return res.status(409).json({ message: "Sigla duplicada." });
      }

      const result = await GrpcClient.create("curso", {
        nome,
        sigla,
        tipo,
        ativo: true,
      });
      return res.status(201).json(result);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res
        .status(statusCode)
        .json({ message: error.message || "Internal Server Error" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export default async function handlerWithCors(req, res) {
  await new Promise((resolve, reject) => {
    corsMiddleware(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });

  return handler(req, res);
}
