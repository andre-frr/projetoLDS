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
    // With the database trigger, only one year can be active (arquivado = false) at a time
    // So we simply return the non-archived year
    const activeYear = years.find((year) => !year.arquivado);

    if (activeYear) {
        return {...activeYear, is_current: true};
    }

    // Fallback: if all years are archived, return the most recent one
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
