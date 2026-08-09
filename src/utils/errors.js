/**
 * Custom operational error class for Elevata backend.
 */
export class AppError extends Error {
  /**
   * Creates an AppError instance.
   * @param {string} message - User-facing error message
   * @param {number} statusCode - HTTP Status code (e.g., 400, 401, 403, 404, 409)
   * @param {array} errors - Detailed list of errors (e.g., validation parameters)
   */
  constructor(message, statusCode = 500, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
