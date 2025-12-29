import pool from "@/lib/db.js";
import {applyCors} from "@/lib/cors.js";
import {ACTIONS, requirePermission, RESOURCES} from "@/lib/authorize.js";

async function handler(req, res) {
    const {id} = req.query;

    const hoursContext = (req) => ({ucId: id});

    if (req.method === "PATCH") {
        return requirePermission(ACTIONS.UPDATE, RESOURCES.UCS, hoursContext)(async (req, res) => {
            const {horas_por_ects} = req.body;

            if (!horas_por_ects || horas_por_ects <= 0) {
                return res.status(400).json({message: "horas_por_ects deve ser maior que 0."});
            }

            try {
                const result = await pool.query(
                    `UPDATE uc
                     SET horas_por_ects = $1
                     WHERE id_uc = $2 RETURNING *`,
                    [horas_por_ects, id]
                );

                if (result.rowCount === 0) {
                    return res.status(404).json({message: "UC inexistente."});
                }

                return res.status(200).json(result.rows[0]);
            } catch (error) {
                console.error(error);
                return res.status(500).json({message: "Internal Server Error"});
            }
        })(req, res);
    } else {
        res.setHeader("Allow", ["PATCH"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

export default async function handlerWithCors(req, res) {
    await applyCors(req, res);
    return handler(req, res);
}
