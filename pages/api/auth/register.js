import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db.js';
import {randomUUID} from 'node:crypto';
import {applyCors} from '@/lib/cors.js';
import {auditLog} from '@/lib/audit.js';

const VALID_ROLES = ['Administrador', 'Coordenador', 'Docente', 'Convidado'];
const JWT_SECRET = process.env.JWT_SECRET;

// SECURITY: Fail fast if JWT_SECRET is not configured in production
if (!JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('FATAL: JWT_SECRET must be set in production environment');
    }
    console.warn('WARNING: JWT_SECRET not set! Using insecure default. DO NOT use in production!');
}

const SECRET_TO_USE = JWT_SECRET || 'your-secret-key-INSECURE-DEV-ONLY';

export default async function handler(req, res) {
    await applyCors(req, res);

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

        // Create session and tokens (same as login)
        const sessionFamilyId = randomUUID();
        const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        const sessionResult = await pool.query(
            'INSERT INTO sessions (user_id, family_id, expires_at) VALUES ($1, $2, $3) RETURNING id',
            [newUser.id, sessionFamilyId, sessionExpiresAt]
        );
        const sessionId = sessionResult.rows[0].id;

        const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        const refreshToken = randomUUID();
        const refreshTokenHash = await argon2.hash(refreshToken);

        await pool.query(
            'INSERT INTO refresh_tokens (session_id, token_hash, expires_at) VALUES ($1, $2, $3)',
            [sessionId, refreshTokenHash, refreshTokenExpiresAt]
        );

        const accessToken = jwt.sign(
            {
                sub: newUser.id,
                sid: sessionId,
                tv: 1, // Initial token version
                role: newUser.role,
            },
            SECRET_TO_USE,
            {expiresIn: '15m'}
        );

        await auditLog('register_success', newUser.id, {email, role});

        res.status(201).json({
            accessToken,
            refreshToken,
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
