import jwt from 'jsonwebtoken';
import pool from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function verifyToken(token) {
    return new Promise((resolve, reject) => {
        jwt.verify(token, JWT_SECRET, async (err, decoded) => {
            if (err) {
                return reject(err);
            }

            try {
                const {sub, sid, tv} = decoded;

                const sessionResult = await pool.query(
                    'SELECT * FROM sessions WHERE id = $1 AND revoked_at IS NULL AND expires_at > NOW()',
                    [sid]
                );
                const session = sessionResult.rows[0];

                if (!session) {
                    return reject(new Error('Invalid or expired session'));
                }

                const userResult = await pool.query('SELECT * FROM users WHERE id = $1 AND token_version = $2', [sub, tv]);
                const user = userResult.rows[0];

                if (!user) {
                    return reject(new Error('Invalid user or token version'));
                }

                resolve(decoded);
            } catch (dbError) {
                reject(dbError);
            }
        });
    });
}
