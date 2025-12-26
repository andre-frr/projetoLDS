import GrpcClient from "@/lib/grpc-client.js";
import {applyCors} from "@/lib/cors.js";

function handleError(error, res) {
    console.error(error);
    const statusCode = error.statusCode || 500;
    return res
        .status(statusCode)
        .json({message: error.message || "Internal Server Error"});
}

function findCurrentYear(years) {
    const currentYear = new Date().getFullYear();

    const current = years.find(
        (year) => year.ano_inicio <= currentYear && year.ano_fim >= currentYear
    );

    if (current) {
        return {...current, is_current: true};
    }

    if (years.length > 0) {
        return {...years[0], is_current: false};
    }

    return null;
}

async function handleGet(res) {
    try {
        const years = await GrpcClient.getAll("ano_letivo", {
            orderBy: "ano_inicio DESC, ano_fim DESC",
        });

        const currentYear = findCurrentYear(years);

        if (!currentYear) {
            return res.status(404).json({
                message: "Nenhum ano letivo encontrado. Por favor, crie um ano letivo.",
            });
        }

        return res.status(200).json(currentYear);
    } catch (error) {
        return handleError(error, res);
    }
}

async function handler(req, res) {
    if (req.method !== "GET") {
        res.setHeader("Allow", ["GET"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    return handleGet(res);
}

export default async function handlerWithCors(req, res) {
    await applyCors(req, res);
    return handler(req, res);
}

