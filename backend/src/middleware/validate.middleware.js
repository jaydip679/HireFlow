import ApiError from '../utils/apiError.js';

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body:   req.body,
    query:  req.query,
    params: req.params,
  });

  if (!result.success) {
    const errors = result.error.issues.map((issue) => {
      // Remove the top-level 'body', 'query', or 'params' keys to simplify field names for client responses
      const field = issue.path.slice(1).join('.') || issue.path.join('.');
      return {
        field,
        message: issue.message,
      };
    });
    
    return next(new ApiError(400, 'Validation failed', 'VALIDATION_ERROR', errors));
  }

  // Overwrite with validated and parsed/coerced values (e.g. string "true" -> boolean true)
  if (result.data.body)   req.body   = result.data.body;
  if (result.data.query)  req.query  = result.data.query;
  if (result.data.params) req.params = result.data.params;

  next();
};

export default validate;
