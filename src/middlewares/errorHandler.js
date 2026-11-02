const AppError = require('../utils/AppError');

function notFound(req, _res, next) {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}


function errorHandler(err, _req, res, _next) {
  
  const error =
    err.type === 'entity.parse.failed' ? AppError.badRequest('Malformed JSON body') : err;

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details && { details: error.details }),
      },
    });
  }

  console.error(err);
  return res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' },
  });
}

module.exports = { notFound, errorHandler };
