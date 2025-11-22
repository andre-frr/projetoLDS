import { verifyToken } from "./auth.js";

export function requireRole(role) {
  return (handler) => async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log("[Auth] Missing authorization header");
      return res.status(401).json({ message: "Authorization header required" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      console.log("[Auth] Missing token in authorization header");
      return res.status(401).json({ message: "Token required" });
    }

    try {
      const decoded = await verifyToken(token);
      req.user = decoded;
      console.log(
        `[Auth] Token verified for user ${decoded.sub}, role: ${decoded.role}`
      );

      if (role && decoded.role !== role) {
        console.log(
          `[Auth] Access denied - Required role: ${role}, User role: ${decoded.role}`
        );
        return res.status(403).json({ message: "Forbidden" });
      }

      console.log(`[Auth] Access granted for ${req.method} ${req.url}`);
      return handler(req, res);
    } catch (error) {
      if (
        error.name === "JsonWebTokenError" ||
        error.name === "TokenExpiredError"
      ) {
        console.log(`[Auth] Token validation failed: ${error.message}`);
        return res.status(401).json({ message: "Invalid or expired token" });
      }
      console.error("[Auth] Unexpected error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
}
