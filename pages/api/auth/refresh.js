import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import pool from '../../../lib/db';
import {randomUUID} from 'crypto';
import corsMiddleware from '../../../lib/cors';
import {auditLog} from '../../../lib/audit';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export default async function handler(req, res) {
    await new Promise((resolve, reject) => {
        corsMiddleware(req, res, (result) => {
            if (result instanceof Error) {
                return reject(result);
            }
            return resolve(result);
        });
    });

    if (req.method !== 'POST') {
        return res.status(405).json({message: 'Method not allowed'});
    }

    const {refreshToken} = req.body;

    if (!refreshToken) {
        return res.status(400).json({message: 'Refresh token is required'});
    }

    try {
        const refreshTokenHash = await argon2.hash(refreshToken);

        const tokenResult = await pool.query(
            `SELECT rt.*, s.user_id, s.family_id, s.revoked_at as session_revoked_at
             FROM refresh_tokens rt
                      JOIN sessions s ON rt.session_id = s.id
             WHERE rt.token_hash = $1
               AND rt.is_revoked = FALSE
               AND rt.expires_at > NOW()`,
            [refreshTokenHash]
        );

        const oldToken = tokenResult.rows[0];

        if (!oldToken || oldToken.session_revoked_at) {
            // Here you might want to revoke the entire session family for security reasons
            await auditLog('refresh_failed', null, {reason: 'Invalid or expired refresh token'});
            return res.status(401).json({message: 'Invalid or expired refresh token'});
        }

        // Revoke the old refresh token
        await pool.query('UPDATE refresh_tokens SET is_revoked = TRUE WHERE id = $1', [oldToken.id]);

        // Create a new refresh token in the same family
        const newRefreshToken = randomUUID();
        const newRefreshTokenHash = await argon2.hash(newRefreshToken);
        const newRefreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        await pool.query(
            'INSERT INTO refresh_tokens (session_id, token_hash, expires_at) VALUES ($1, $2, $3)',
            [oldToken.session_id, newRefreshTokenHash, newRefreshTokenExpiresAt]
        );

        const userResult = await pool.query('SELECT id, token_version, role FROM users WHERE id = $1', [oldToken.user_id]);
        const user = userResult.rows[0];

        await auditLog('refresh_success', user.id, {sessionId: oldToken.session_id});

        const accessToken = jwt.sign(
            {
                sub: user.id,
                sid: oldToken.session_id,
                tv: user.token_version,
                role: user.role,
            },
            JWT_SECRET,
            {expiresIn: '15m'}
        );

        res.status(200).json({accessToken, refreshToken: newRefreshToken});
    } catch (error) {
        console.error(error);
        await auditLog('refresh_error', null, {error: error.message});
        res.status(500).json({message: 'Internal server error'});
    }
}
