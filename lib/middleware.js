import {verifyToken} from './auth';

export function requireRole(role) {
    return (handler) => async (req, res) => {
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
            req.user = decoded;

            if (role && decoded.role !== role) {
                return res.status(403).json({message: 'Forbidden'});
            }

            return handler(req, res);
        } catch (error) {
            if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
                return res.status(401).json({message: 'Invalid or expired token'});
            }
            console.error(error);
            return res.status(500).json({message: 'Internal server error'});
        }
    };
}

