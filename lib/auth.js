import jwt from 'jsonwebtoken';
import {promisify} from 'node:util';
import pool from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const verifyJwt = promisify(jwt.verify);

export async function verifyToken(token) {
    const decoded = await verifyJwt(token, JWT_SECRET);

    const {sub, sid, tv} = decoded;

    const sessionResult = await pool.query(
        'SELECT * FROM sessions WHERE id = $1 AND revoked_at IS NULL AND expires_at > NOW()',
        [sid]
    );
    const session = sessionResult.rows[0];

    if (!session) {
        throw new Error('Invalid or expired session');
    }

    const userResult = await pool.query('SELECT * FROM users WHERE id = $1 AND token_version = $2', [sub, tv]);
    const user = userResult.rows[0];

    if (!user) {
        throw new Error('Invalid user or token version');
    }

    return decoded;
}
