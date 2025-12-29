import pool from '@/lib/db.js';
import argon2 from 'argon2';
import {applyCors} from '@/lib/cors.js';

/**
 * POST /api/auth/setup-password
 * For users created without passwords (teachers auto-created as system users)
 * Allows them to set their password on first login
 */
async function handler(req, res) {
    await applyCors(req, res);

    if (req.method !== 'POST') {
        return res.status(405).json({message: 'Method not allowed'});
    }

    const {email, password} = req.body;

    if (!email || !password) {
        return res.status(400).json({message: 'Email and password are required'});
    }

    // Trim and validate password
    const trimmedPassword = password.trim();

    if (trimmedPassword.length === 0) {
        return res.status(400).json({message: 'Password cannot be empty or only whitespace'});
    }

    // Validate password strength
    if (trimmedPassword.length < 8) {
        return res.status(400).json({
            message: 'Password must be at least 8 characters long'
        });
    }

    if (trimmedPassword.length > 128) {
        return res.status(400).json({
            message: 'Password must not exceed 128 characters'
        });
    }

    try {
        // Check if user exists and has no password
        const userResult = await pool.query(
            'SELECT id, email, password_hash FROM users WHERE email = $1',
            [email]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({message: 'User not found'});
        }

        const user = userResult.rows[0];

        // User must have NULL password to use this endpoint
        if (user.password_hash !== null) {
            return res.status(400).json({
                message: 'Password already set. Please use the login page or password reset.'
            });
        }

        // Hash the password (use trimmed version)
        const passwordHash = await argon2.hash(trimmedPassword);

        // Update user with new password
        await pool.query(
            'UPDATE users SET password_hash = $1 WHERE id = $2',
            [passwordHash, user.id]
        );

        return res.status(200).json({
            message: 'Password set successfully. You can now login.',
            email: user.email
        });
    } catch (error) {
        console.error('Error setting up password:', error);
        return res.status(500).json({message: 'Internal server error'});
    }
}

export default handler;
