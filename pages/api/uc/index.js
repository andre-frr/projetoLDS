import GrpcClient from "@/lib/grpc-client.js";
import corsMiddleware from "@/lib/cors.js";

async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const result = await GrpcClient.getAll("uc");
      return res.status(200).json(result);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res
        .status(statusCode)
        .json({ message: error.message || "Internal Server Error" });
    }
  } else if (req.method === "POST") {
    const { nome, id_curso, id_area, ano_curso, sem_curso, ects } = req.body;

    if (
      !nome ||
      !id_curso ||
      !id_area ||
      !ano_curso ||
      !sem_curso ||
      ects == null
    ) {
      return res
        .status(400)
        .json({
          message:
            "Dados mal formatados. Campos obrigatórios: nome, id_curso, id_area, ano_curso, sem_curso, ects",
        });
    }

    try {
      try {
        await GrpcClient.getById("curso", id_curso);
      } catch (error) {
        if (error.statusCode === 404) {
          return res.status(404).json({ message: "Curso inexistente." });
        }
        throw error;
      }

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

      const result = await GrpcClient.create("uc", {
        nome,
        id_curso,
        id_area,
        ano_curso,
        sem_curso,
        ects,
        ativo: true,
      });

      return res.status(201).json({
        message: "UC criada com sucesso",
        uc: result,
      });
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

export default corsMiddleware(handler);
