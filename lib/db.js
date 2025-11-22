import pkg from "pg";

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // ./.env
});

// Log database connection events
pool.on("connect", () => {
  console.log("[DB] New client connected to PostgreSQL");
});

pool.on("error", (err) => {
  console.error("[DB] Unexpected error on idle client:", err);
});

console.log("[DB] PostgreSQL pool initialized");

export default pool;
