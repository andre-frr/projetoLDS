import GrpcClient from "@/lib/grpc-client.js";
import {applyCors} from "@/lib/cors.js";
import {ACTIONS, requirePermission, RESOURCES} from "@/lib/authorize.js";

function handleError(error, res) {
    console.error(error);
    const statusCode = error.statusCode || 500;
    return res
        .status(statusCode)
        .json({message: error.message || "Internal Server Error"});
}

async function handleGet(req, res) {
    const {incluirInativos} = req.query;
    const filters = incluirInativos === "true" ? undefined : {ativo: true};

    try {
        const result = await GrpcClient.getAll("docente", {filters});
        return res.status(200).json(result);
    } catch (error) {
        return handleError(error, res);
    }
}

async function validateAreaExists(id_area, res) {
    try {
        await GrpcClient.getById("area_cientifica", id_area);
        return null;
    } catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).json({message: "Área científica inexistente."});
        }
        throw error;
    }
}

async function handlePost(req, res) {
    const {nome, email, id_area, convidado, createSystemUser, role} = req.body;
    if (!nome || !email || !id_area) {
        return res.status(400).json({message: "Dados mal formatados."});
    }

    try {
        const emailExists = await GrpcClient.getAll("docente", {
            filters: {email},
        });
        if (emailExists.length > 0) {
            return res.status(409).json({message: "Email duplicado."});
        }

        const areaError = await validateAreaExists(id_area, res);
        if (areaError) return areaError;

        // Create system user first if requested
        let systemUserId = null;
        let systemUser = null;
        if (createSystemUser) {
            const pool = (await import('@/lib/db.js')).default;
            const userRole = role || 'Coordenador'; // Default to Coordenador

            // Check if user already exists
            const existingUser = await pool.query(
                'SELECT id, email, role, ativo FROM users WHERE email = $1',
                [email]
            );

            if (existingUser.rows.length === 0) {
                // Create user with NULL password (requires first-time setup)
                const userResult = await pool.query(
                    'INSERT INTO users (email, password_hash, role, ativo) VALUES ($1, NULL, $2, $3) RETURNING id, email, role, ativo',
                    [email, userRole, true]
                );
                systemUser = userResult.rows[0];
                systemUserId = systemUser.id;
            } else {
                systemUser = existingUser.rows[0];
                systemUserId = systemUser.id;
            }
        }

        // Create docente with id_user link
        const result = await GrpcClient.create("docente", {
            nome,
            email,
            id_area,
            id_user: systemUserId,
            ativo: true,
            convidado: convidado ?? false,
        });

        return res.status(201).json({
            ...result,
            systemUser: systemUser || undefined
        });
    } catch (error) {
        return handleError(error, res);
    }
}

async function handler(req, res) {
    const professorContext = (req) => ({
        areaId: req.body?.id_area
    });

    switch (req.method) {
        case "GET":
            return requirePermission(ACTIONS.READ, RESOURCES.PROFESSORS)(handleGet)(req, res);
        case "POST":
            return requirePermission(ACTIONS.CREATE, RESOURCES.PROFESSORS, professorContext)(handlePost)(req, res);
        default:
            res.setHeader("Allow", ["GET", "POST"]);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

export default async function handlerWithCors(req, res) {
    await applyCors(req, res);
    return handler(req, res);
}
