import pool from '../../../lib/db';
import {verifyToken} from '../../../lib/auth';
import corsMiddleware from '../../middleware/cors';
import {auditLog} from '../../../lib/audit';

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

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({message: 'Authorization header required'});
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({message: 'Token required'});
    }

    try {
        const decoded = await verifyToken(token);
        const {sid} = decoded;

        // Revoke the session
        await pool.query('UPDATE sessions SET revoked_at = NOW() WHERE id = $1', [sid]);

        // Revoke the refresh token associated with the session
        await pool.query('UPDATE refresh_tokens SET is_revoked = TRUE WHERE session_id = $1', [sid]);

        await auditLog('logout_success', decoded.sub, {sessionId: sid});

        res.status(200).json({message: 'Logged out successfully'});
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            await auditLog('logout_failed', null, {reason: 'Invalid or expired token'});
            return res.status(401).json({message: 'Invalid or expired token'});
        }
        console.error(error);
        await auditLog('logout_error', null, {error: error.message});
        res.status(500).json({message: 'Internal server error'});
    }
}
