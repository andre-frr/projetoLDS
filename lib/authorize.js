import {verifyToken} from './auth.js';
import {hasPermission} from './permissions.js';

/**
 * Middleware to require authentication
 * Verifies JWT token and attaches user to request
 */
export function requireAuth() {
    return async (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({message: "Authorization header required"});
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({message: "Token required"});
        }

        try {
            const decoded = await verifyToken(token);
            req.user = decoded;

            if (next) {
                return next(req, res);
            }

        } catch (error) {
            if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
                return res.status(401).json({message: "Invalid or expired token"});
            }
            console.error("[Auth] Unexpected error:", error);
            return res.status(500).json({message: "Internal server error"});
        }
    };
}

/**
 * Helper function to authenticate request and return true if successful
 * Returns false if authentication failed (and response was already sent)
 */
async function authenticateRequest(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({message: "Authorization header required"});
        return false;
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
        res.status(401).json({message: "Token required"});
        return false;
    }

    try {
        const decoded = await verifyToken(token);
        req.user = decoded;
        return true;
    } catch (error) {
        if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
            res.status(401).json({message: "Invalid or expired token"});
        } else {
            console.error("[Auth] Unexpected error:", error);
            res.status(500).json({message: "Internal server error"});
        }
        return false;
    }
}

/**
 * Middleware to require specific role(s)
 * @param {string|string[]} roles - Required role(s)
 */
export function requireRole(roles) {
    const roleArray = Array.isArray(roles) ? roles : [roles];

    return (handler) => async (req, res) => {
        const authenticated = await authenticateRequest(req, res);
        if (!authenticated) {
            return;
        }

        // Check role
        if (!roleArray.includes(req.user.role)) {
            console.log(`[Auth] Access denied - Required roles: ${roleArray.join(', ')}, User role: ${req.user.role}`);
            return res.status(403).json({message: "Forbidden - Insufficient permissions"});
        }

        return handler(req, res);
    };
}

/**
 * Middleware to check resource permission
 * @param {string} action - Action to perform (create, read, update, delete)
 * @param {string} resource - Resource type
 * @param {Function} contextExtractor - Function to extract context from request
 */
export function requirePermission(action, resource, contextExtractor = () => ({})) {
    return (handler) => async (req, res) => {
        const authenticated = await authenticateRequest(req, res);
        if (!authenticated) {
            return;
        }

        // Extract context
        const context = typeof contextExtractor === 'function'
            ? contextExtractor(req)
            : contextExtractor;

        // Check permission
        const allowed = await hasPermission(req.user, action, resource, context);

        if (!allowed) {
            console.log(`[Auth] Permission denied - User: ${req.user.sub}, Role: ${req.user.role}, Action: ${action}, Resource: ${resource}, Context:`, context);
            return res.status(403).json({
                message: "Forbidden - You don't have permission to perform this action"
            });
        }

        return handler(req, res);
    };
}

/**
 * Helper to create context extractor for department-based resources
 */
export function departmentContext(req) {
    return {
        departmentId: req.query.id || req.body.id_dep || req.query.id_dep
    };
}

/**
 * Helper to create context extractor for course-based resources
 */
export function courseContext(req) {
    return {
        cursoId: req.query.id || req.body.id_curso || req.query.id_curso
    };
}

/**
 * Helper to create context extractor for UC-based resources
 */
export function ucContext(req) {
    return {
        ucId: req.query.id || req.body.id_uc || req.query.id_uc,
        cursoId: req.body.id_curso
    };
}

/**
 * Helper to create context extractor for area-based resources
 */
export function areaContext(req) {
    return {
        areaId: req.query.id || req.body.id_area || req.query.id_area,
        departmentId: req.body.id_dep
    };
}

// Export legacy requireRole for backward compatibility
export {requireRole as requireRoleCompat};

// Export constants for easy access
export {ACTIONS, RESOURCES} from './permissions.js';
