const AppError = require('../utils/AppError');

function notFound(req, _res, next) {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}


function errorHandler(err, _req, res, _next) {
  
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
