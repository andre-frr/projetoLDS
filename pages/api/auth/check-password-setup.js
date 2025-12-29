import pool from '@/lib/db.js';
import {applyCors} from '@/lib/cors.js';

/**
 * POST /api/auth/check-password-setup
 * Check if a user needs to set up their password
 * Used to show the password setup form before login
 */
async function handler(req, res) {
    await applyCors(req, res);

    if (req.method !== 'POST') {
        return res.status(405).json({message: 'Method not allowed'});
    }

    const {email} = req.body;

    if (!email) {
        return res.status(400).json({message: 'Email is required'});
    }

    try {
        const userResult = await pool.query(
            'SELECT id, email, password_hash FROM users WHERE email = $1 AND ativo = TRUE',
            [email]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                message: 'User not found',
                requiresPasswordSetup: false
            });
        }

        const user = userResult.rows[0];

        return res.status(200).json({
            email: user.email,
            requiresPasswordSetup: user.password_hash === null
        });
    } catch (error) {
        console.error('Error checking password setup:', error);
        return res.status(500).json({message: 'Internal server error'});
    }
}

export default handler;
