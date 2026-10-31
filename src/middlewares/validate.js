const AppError = require('../utils/AppError');

/**
 * Validasi body request memakai schema Zod.
 * Body yang lolos diganti dengan hasil parse (sudah dinormalisasi dan field
 * asing dibuang), jadi controller hanya menerima data yang bersih.
 */
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
