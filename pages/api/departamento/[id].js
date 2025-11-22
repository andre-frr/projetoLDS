import GrpcClient from "@/lib/grpc-client.js";
import corsMiddleware from "@/lib/cors.js";

async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "GET") {
    try {
      const result = await GrpcClient.getById("departamento", id);
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
  } else if (req.method === "PUT") {
    const { nome, sigla, ativo } = req.body;

    try {
      // Get current data
      const current = await GrpcClient.getById("departamento", id);

      // Check sigla uniqueness if changed
      if (sigla && sigla !== current.sigla) {
        const existing = await GrpcClient.getAll("departamento", {
          filters: { sigla },
        });
        const duplicate = existing.find((dep) => dep.id_dep !== parseInt(id));
        if (duplicate) {
          return res.status(409).json({ message: "Sigla duplicada." });
        }
      }

      // Check nome uniqueness if changed
      if (nome && nome !== current.nome) {
        const existing = await GrpcClient.getAll("departamento", {
          filters: { nome },
        });
        const duplicate = existing.find((dep) => dep.id_dep !== parseInt(id));
        if (duplicate) {
          return res.status(409).json({ message: "Nome duplicado." });
        }
      }

      // Prepare update data
      const updateData = {
        nome: nome ?? current.nome,
        sigla: sigla ?? current.sigla,
        ativo: ativo ?? current.ativo,
      };

      const result = await GrpcClient.update("departamento", id, updateData);
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
  } else if (req.method === "DELETE") {
    try {
      // Check if department has areas
      const areas = await GrpcClient.getAll("area_cientifica", {
        filters: { id_dep: parseInt(id) },
      });

      if (areas.length > 0) {
        // Mark as inactive instead of deleting
        await GrpcClient.update("departamento", id, { ativo: false });
        return res
          .status(200)
          .json({ message: "Departamento marcado como inativo." });
      } else {
        await GrpcClient.delete("departamento", id);
        return res.status(204).end();
      }
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
    res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
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
