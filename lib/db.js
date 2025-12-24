import {Pool} from "pg";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

pool.on("connect", () => {
    console.log("[DB] New client connected to PostgreSQL");
});

pool.on("error", (err) => {
    console.error("[DB] Unexpected error on idle client:", err);
});

console.log("[DB] PostgreSQL pool initialized");

export default pool;
