const AppError = require('../utils/AppError');


function validate(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      return next(AppError.badRequest('Request validation failed', details));
    }
    req.body = result.data;
    return next();
  };
}

module.exports = validate;
