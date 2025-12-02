import GrpcClient from "@/lib/grpc-client.js";
import corsMiddleware from "@/lib/cors.js";

async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "GET") {
    try {
      const uc = await GrpcClient.getById("uc", id);
      const horasContacto = await GrpcClient.getAll("uc_horas_contacto", {
        filters: { id_uc: parseInt(id) },
      });

      return res.status(200).json({
        ...uc,
        horas_contacto: horasContacto,
      });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        message: statusCode === 404 ? "UC inexistente." : error.message,
      });
    }
  } else if (req.method === "PUT") {
    const { nome, id_curso, id_area, ano_curso, sem_curso, ects, ativo } =
      req.body;

    try {
      const current = await GrpcClient.getById("uc", id);

      if (id_curso && id_curso !== current.id_curso) {
        try {
          await GrpcClient.getById("curso", id_curso);
        } catch (error) {
          if (error.statusCode === 404) {
            return res.status(404).json({ message: "Curso inexistente." });
          }
          throw error;
        }
      }

      if (id_area && id_area !== current.id_area) {
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
      }

      const updateData = {
        nome: nome ?? current.nome,
        id_curso: id_curso ?? current.id_curso,
        id_area: id_area ?? current.id_area,
        ano_curso: ano_curso ?? current.ano_curso,
        sem_curso: sem_curso ?? current.sem_curso,
        ects: ects ?? current.ects,
        ativo: ativo ?? current.ativo,
      };

      const result = await GrpcClient.update("uc", id, updateData);
      return res.status(200).json(result);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        message: statusCode === 404 ? "UC inexistente." : error.message,
      });
    }
  } else if (req.method === "DELETE") {
    try {
      await GrpcClient.delete("uc", id);
      return res.status(204).end();
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        message: statusCode === 404 ? "UC inexistente." : error.message,
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
