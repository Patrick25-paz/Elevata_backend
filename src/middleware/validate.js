/**
 * Express middleware factory to validate request inputs using Zod schemas.
 * Re-assigns validated and sanitized data back to the express request object.
 * @param {z.ZodSchema} schema - The Zod schema to validate against
 * @param {string} source - Request source: 'body', 'query', or 'params' (default: 'body')
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed; // Store sanitized and coerced values back
      next();
    } catch (error) {
      next(error); // Forward to global error handler
    }
  };
};
