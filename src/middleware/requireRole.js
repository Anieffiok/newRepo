import ApiError from "../utils/ApiError.js";

/**
 * Middleware that checks if the authenticated user has one of the allowed roles.
 * Must be used AFTER the authenticate middleware.
 *
 * Usage:
 *   requireRole("ADMIN")              — only full admins
 *   requireRole("ADMIN", "OPERATIONS") — admins or operations
 */
export default function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, "FORBIDDEN", "Insufficient permissions"));
    }
    next();
  };
}
