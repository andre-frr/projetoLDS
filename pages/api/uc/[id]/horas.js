import pool from "@/lib/db.js";
import {applyCors} from "@/lib/cors.js";

async function handler(req, res) {
    const {id} = req.query;

    if (req.method === "GET") {
        try {
            const result = await pool.query(
                "SELECT tipo, horas FROM uc_horas_contacto WHERE id_uc=$1",
                [id]
            );
            if (result.rowCount === 0) {
                return res.status(404).json({message: "UC inexistente."});
            }
            return res.status(200).json(result.rows);
        } catch (error) {
            console.error(error);
            return res.status(500).json({message: "Internal Server Error"});
        }
    } else if (req.method === "POST") {
        const {tipo, horas} = req.body;

        if (!tipo || horas === undefined) {
            return res.status(400).json({message: "Dados mal formatados."});
        }

        try {
            const ucExists = await pool.query("SELECT 1 FROM uc WHERE id_uc = $1", [
                id,
            ]);
            if (ucExists.rowCount === 0) {
                return res.status(404).json({message: "UC inexistente."});
            }

            const result = await pool.query(
                `INSERT INTO uc_horas_contacto (id_uc, tipo, horas)
                 VALUES ($1, $2, $3) ON CONFLICT (id_uc, tipo)
                 DO
                UPDATE SET horas = $3
                    RETURNING *`,
                [id, tipo, horas]
            );
            return res.status(201).json(result.rows[0]);
        } catch (error) {
            console.error(error);
            return res.status(500).json({message: "Internal Server Error"});
        }
    } else {
        res.setHeader("Allow", ["GET", "POST"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

export default async function handlerWithCors(req, res) {
    await applyCors(req, res);
    return handler(req, res);
}
