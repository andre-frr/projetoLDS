import GrpcClient from "@/lib/grpc-client.js";
import corsMiddleware from "@/lib/cors-middleware.js";

async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "DELETE") {
    try {
      const current = await GrpcClient.getById("uc", id);

      const result = await GrpcClient.update("uc", id, {
        ...current,
        ativo: false,
      });

      return res.status(200).json(result);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        message: statusCode === 404 ? "UC inexistente." : error.message,
      });
    }
  } else {
    res.setHeader("Allow", ["DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export default corsMiddleware(handler);
