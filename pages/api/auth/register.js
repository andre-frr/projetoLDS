import argon2 from 'argon2';
import pool from '@/lib/db.js';
import corsMiddleware from '@/lib/cors.js';
import {auditLog} from '@/lib/audit.js';

const VALID_ROLES = ['Administrador', 'Coordenador', 'Docente', 'Convidado'];

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

    const {email, password, role = 'Convidado'} = req.body;

    // Validation
    if (!email || !password) {
        return res.status(400).json({message: 'Email and password are required'});
    }

    if (!VALID_ROLES.includes(role)) {
        return res.status(400).json({
            message: 'Invalid role',
            validRoles: VALID_ROLES
        });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({message: 'Invalid email format'});
    }

    // Password strength validation (at least 8 characters)
    if (password.length < 8) {
        return res.status(400).json({message: 'Password must be at least 8 characters long'});
    }

    try {
        // Check if user already exists
        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            await auditLog('register_failed', null, {email, reason: 'Email already exists'});
            return res.status(409).json({message: 'User with this email already exists'});
        }

        // Hash password with argon2
        const passwordHash = await argon2.hash(password);

        // Insert new user
        const result = await pool.query(
            'INSERT INTO users (email, password_hash, role, ativo) VALUES ($1, $2, $3, TRUE) RETURNING id, email, role, ativo',
            [email, passwordHash, role]
        );

        const newUser = result.rows[0];

        await auditLog('register_success', newUser.id, {email, role});

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: newUser.id,
                email: newUser.email,
                role: newUser.role,
                ativo: newUser.ativo
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        await auditLog('register_error', null, {email, error: error.message});
        res.status(500).json({message: 'Internal server error'});
    }
}

