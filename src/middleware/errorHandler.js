import { errorResponse } from '../utils/response.js';
import { AppError } from '../utils/errors.js';
import { z } from 'zod';

/**
 * Global Express Error Handler Middleware.
 */
export const errorHandler = (err, req, res, next) => {
  // Log all errors for transparency
  console.error('❌ Error caught by global handler:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    code: err.code
  });

  // Handle Custom AppError
  if (err instanceof AppError) {
    return errorResponse(res, err.message, err.errors, err.statusCode);
  }

  // Handle Zod Validation Error
  if (err instanceof z.ZodError) {
    const formattedErrors = err.errors.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message
    }));
    return errorResponse(res, 'Validation failed', formattedErrors, 400);
  }

  // Handle Prisma Known Request Errors
  if (err.code && err.code.startsWith('P')) {
    // P2002: Unique constraint failed
    if (err.code === 'P2002') {
      const field = err.meta?.target ? err.meta.target.join(', ') : 'field';
      return errorResponse(res, `A record with this ${field} already exists.`, [], 409);
    }
    // P2025: Record not found
    if (err.code === 'P2025') {
      return errorResponse(res, err.meta?.cause || 'Record not found.', [], 404);
    }
    // General Prisma Database error
    return errorResponse(res, 'Database error occurred.', [], 500);
  }

  // Handle JWT specific errors
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 'Invalid token provided.', [], 401);
  }
  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 'Token has expired.', [], 401);
  }

  // Fallback: Internal Server Error
  const message = process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred.';
  return errorResponse(res, message, [], 500);
};
