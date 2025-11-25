import GrpcClient from "@/lib/grpc-client.js";
import corsMiddleware from "@/lib/cors.js";

async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "GET") {
    try {
      const result = await GrpcClient.getById("area_cientifica", id);
      return res.status(200).json(result);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        message:
          statusCode === 404 ? "Área científica inexistente." : error.message,
      });
    }
  } else if (req.method === "PUT") {
    const { nome, sigla, id_dep, ativo } = req.body;

    try {
      const current = await GrpcClient.getById("area_cientifica", id);

      if (id_dep && id_dep !== current.id_dep) {
        try {
          await GrpcClient.getById("departamento", id_dep);
        } catch (error) {
          if (error.statusCode === 404) {
            return res
              .status(404)
              .json({ message: "Departamento inexistente." });
          }
          throw error;
        }
      }

      // Check for duplicate nome
      if (nome && nome !== current.nome) {
        const existing = await GrpcClient.getAll("area_cientifica", {
          filters: { nome },
        });
        const duplicate = existing.find(
          (area) => area.id_area !== parseInt(id)
        );
        if (duplicate) {
          return res.status(409).json({ message: "Nome duplicado." });
        }
      }

      // Check for duplicate sigla
      if (sigla && sigla !== current.sigla) {
        const existing = await GrpcClient.getAll("area_cientifica", {
          filters: { sigla },
        });
        const duplicate = existing.find(
          (area) => area.id_area !== parseInt(id)
        );
        if (duplicate) {
          return res.status(409).json({ message: "Sigla duplicada." });
        }
      }

      const updateData = {
        nome: nome ?? current.nome,
        sigla: sigla ?? current.sigla,
        id_dep: id_dep ?? current.id_dep,
        ativo: ativo ?? current.ativo,
      };

      const result = await GrpcClient.update("area_cientifica", id, updateData);
      return res.status(200).json(result);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        message:
          statusCode === 404 ? "Área científica inexistente." : error.message,
      });
    }
  } else if (req.method === "DELETE") {
    try {
      await GrpcClient.delete("area_cientifica", id);
      return res.status(204).end();
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        message:
          statusCode === 404 ? "Área científica inexistente." : error.message,
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
