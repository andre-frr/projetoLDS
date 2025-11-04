import pkg from 'pg';

const {Pool} = pkg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // ./.env
});

export default pool;
