const AppError = require('../utils/AppError');

/** 404 untuk route yang tidak terdaftar. */
function notFound(req, _res, next) {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}

/**
 * Satu-satunya tempat yang membentuk response error, sehingga formatnya
 * konsisten di seluruh API:
 *   { success: false, error: { code, message, details? } }
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  // Body JSON yang rusak dari express.json()
  if (err.type === 'entity.parse.failed') {
    err = AppError.badRequest('Malformed JSON body');
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message, ...(err.details && { details: err.details }) },
    });
  }

  // Error tak terduga: log lengkap di server, balas generik ke client.
  console.error(err);
  return res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' },
  });
}

module.exports = { notFound, errorHandler };
