import { verifyAccessToken } from '../utils/jwt.js';
import { AppError } from '../utils/errors.js';
import prisma from '../config/prisma.js';

/**
 * Middleware to authenticate requests via JWT access tokens.
 * Supports Bearer header or accessToken cookies.
 */
export const authenticate = async (req, res, next) => {
  try {
    let token;

    // 1. Extract token from Authorization header or Cookies
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new AppError('Authentication token is missing. Please log in.', 401);
    }

    // 2. Verify token
    const decoded = verifyAccessToken(token);

    // 3. Verify user exists and is active in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      throw new AppError('User belonging to this token no longer exists.', 401);
    }

    if (!user.isActive) {
      throw new AppError('Your account has been deactivated. Please contact support.', 401);
    }

    // 4. Attach active user summary to the request object
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    console.error('🔓 JWT Authentication error:', error.message);
    next(new AppError(error.message || 'Authentication failed.', 401));
  }
};
