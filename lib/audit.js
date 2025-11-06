import pool from './db';

export const auditLog = async (action, userId, details) => {
    try {
        await pool.query(
            'INSERT INTO audit_logs (action, user_id, details) VALUES ($1, $2, $3)',
            [action, userId, details]
        );
    } catch (error) {
        console.error('Failed to write to audit log:', error);
    }
};

