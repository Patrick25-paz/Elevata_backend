/**
 * Sends a standardized success response.
 * @param {object} res - Express response object
 * @param {string} message - Response message
 * @param {any} data - Response payload data
 * @param {number} statusCode - HTTP status code (default: 200)
 */
export const successResponse = (res, message, data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Sends a standardized error response.
 * @param {object} res - Express response object
 * @param {string} message - Error response message
 * @param {array} errors - List of detailed error messages or validation structures
 * @param {number} statusCode - HTTP status code (default: 500)
 */
export const errorResponse = (res, message, errors = [], statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors
  });
};
