const AppError = require('../utils/AppError');

/**
 * Validates req.body / req.params / req.query against zod schemas.
 * Parsed (coerced + trimmed) values replace the originals; for query we use
 * req.validatedQuery because req.query is a getter in newer Express versions.
 *
 * Usage: validate({ body: schema, params: schema, query: schema })
 */
const validate = (schemas) => (req, res, next) => {
  const errors = {};

  for (const [key, schema] of Object.entries(schemas)) {
    const result = schema.safeParse(req[key]);
    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path.join('.') || key;
        if (!errors[field]) errors[field] = issue.message;
      }
    } else if (key === 'query') {
      req.validatedQuery = result.data;
    } else {
      req[key] = result.data;
    }
  }

  if (Object.keys(errors).length > 0) {
    return next(AppError.badRequest('Validation failed', errors));
  }
  return next();
};

module.exports = validate;
