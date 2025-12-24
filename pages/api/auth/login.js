import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import pool from '@/lib/db.js';
import {randomUUID} from 'node:crypto';
import {applyCors} from '@/lib/cors.js';
import {auditLog} from '@/lib/audit.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret-key';

export default async function handler(req, res) {
    await applyCors(req, res);

    if (req.method !== 'POST') {
        return res.status(405).json({message: 'Method not allowed'});
    }

    const {email, password} = req.body;

    if (!email || !password) {
        return res.status(400).json({message: 'Email and password are required'});
    }

    try {
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1 AND ativo = TRUE', [email]);
        const user = userResult.rows[0];

        if (!user) {
            await auditLog('login_failed', null, {email, reason: 'Invalid credentials'});
            return res.status(401).json({message: 'Invalid credentials'});
        }

        const passwordMatch = await argon2.verify(user.password_hash, password);

        if (!passwordMatch) {
            await auditLog('login_failed', user.id, {email, reason: 'Invalid credentials'});
            return res.status(401).json({message: 'Invalid credentials'});
        }

        const sessionFamilyId = randomUUID();
        const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        const sessionResult = await pool.query(
            'INSERT INTO sessions (user_id, family_id, expires_at) VALUES ($1, $2, $3) RETURNING id',
            [user.id, sessionFamilyId, sessionExpiresAt]
        );
        const sessionId = sessionResult.rows[0].id;

        const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        const refreshToken = randomUUID();
        const refreshTokenHash = await argon2.hash(refreshToken);

        await pool.query(
            'INSERT INTO refresh_tokens (session_id, token_hash, expires_at) VALUES ($1, $2, $3)',
            [sessionId, refreshTokenHash, refreshTokenExpiresAt]
        );

        await auditLog('login_success', user.id, {sessionId});

        const accessToken = jwt.sign(
            {
                sub: user.id,
                sid: sessionId,
                tv: user.token_version,
                role: user.role,
            },
            JWT_SECRET,
            {expiresIn: '15m'}
        );

        res.status(200).json({accessToken, refreshToken});
    } catch (error) {
        console.error(error);
        await auditLog('login_error', null, {error: error.message});
        res.status(500).json({message: 'Internal server error'});
    }
}
