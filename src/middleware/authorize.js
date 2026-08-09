import { AppError } from '../utils/errors.js';

/**
 * Middleware factory to authorize requests based on user roles.
 * Must be executed after the authenticate middleware.
 * @param {...string} allowedRoles - List of authorized roles (e.g., 'ADMIN', 'BUSINESS')
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required before authorization.', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to access this resource.', 403));
    }

    next();
  };
};
