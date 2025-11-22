import GrpcClient from "@/lib/grpc-client.js";
import corsMiddleware from "@/lib/cors.js";

async function handler(req, res) {
  if (req.method === "GET") {
    const { incluirInativos } = req.query;
    const filters = incluirInativos !== "true" ? { ativo: true } : undefined;

    try {
      const result = await GrpcClient.getAll("docente", { filters });
      return res.status(200).json(result);
    } catch (error) {
      console.error(error);
      const statusCode = error.statusCode || 500;
      return res
        .status(statusCode)
        .json({ message: error.message || "Internal Server Error" });
    }
  } else if (req.method === "POST") {
    const { nome, email, id_area, convidado } = req.body;
    if (!nome || !email || !id_area) {
      return res.status(400).json({ message: "Dados mal formatados." });
    }

    try {
      // Check email uniqueness
      const emailExists = await GrpcClient.getAll("docente", {
        filters: { email },
      });
      if (emailExists.length > 0) {
        return res.status(409).json({ message: "Email duplicado." });
      }

      // Validate area exists
      try {
        await GrpcClient.getById("area_cientifica", id_area);
      } catch (error) {
        if (error.statusCode === 404) {
          return res
            .status(404)
            .json({ message: "Área científica inexistente." });
        }
        throw error;
      }

      const result = await GrpcClient.create("docente", {
        nome,
        email,
        id_area,
        ativo: true,
        convidado: convidado ?? false,
      });
      return res.status(201).json(result);
    } catch (error) {
      console.error(error);
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
